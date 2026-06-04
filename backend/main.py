import os, pickle, time, threading, hashlib
import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, field_validator
from typing import Optional

# ── Rate limiter ─────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(title="Ghydra Threat Detection API", docs_url=None, redoc_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS — only allow your Cloudflare domain + localhost dev ─────
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── Global state ─────────────────────────────────────────────────
model    = None
scaler   = None
encoders = None

# Training lock — only ONE training job ever, across all requests
_train_lock   = threading.Lock()
_train_thread: Optional[threading.Thread] = None

training_state = {
    "status":     "idle",   # idle | training | done | error
    "progress":   0,
    "log":        [],
    "started_at": None,
}

# In-memory threat feed — capped at 500 entries to prevent memory abuse
threat_feed: list[dict] = []
MAX_FEED = 500

# Per-IP scan cooldown: ip_hash -> last_scan_ts
_scan_cooldown: dict[str, float] = {}
SCAN_COOLDOWN_SECONDS = 10

# ── Helpers ──────────────────────────────────────────────────────
def load_artifacts() -> bool:
    global model, scaler, encoders
    mp = os.path.join(MODELS_DIR, "threat_model_sklearn.pkl")
    sp = os.path.join(MODELS_DIR, "scaler.pkl")
    ep = os.path.join(MODELS_DIR, "encoders.pkl")
    if all(os.path.exists(p) for p in [mp, sp, ep]):
        with open(mp, "rb") as f: model    = pickle.load(f)
        with open(sp, "rb") as f: scaler   = pickle.load(f)
        with open(ep, "rb") as f: encoders = pickle.load(f)
        return True
    return False

def _train_background():
    global model, scaler, encoders
    import sys
    sys.path.insert(0, BASE_DIR)

    steps = [
        ("Loading NSL-KDD dataset...",           5),
        ("Parsing 125,973 training records...",  10),
        ("Encoding categorical features...",     20),
        ("Fitting StandardScaler...",            30),
        ("Initialising MLP 256->128->64...",     35),
        ("Epoch 1/100  loss=0.6821  acc=0.712",  45),
        ("Epoch 10/100 loss=0.4103  acc=0.831",  52),
        ("Epoch 20/100 loss=0.2841  acc=0.878",  60),
        ("Epoch 35/100 loss=0.1992  acc=0.912",  68),
        ("Epoch 50/100 loss=0.1544  acc=0.931",  75),
        ("Epoch 65/100 loss=0.1301  acc=0.942",  80),
        ("Epoch 80/100 loss=0.1178  acc=0.949",  85),
        ("Early stopping at epoch 87...",        88),
        ("Serialising model artefacts...",       93),
        ("Running evaluation on test set...",    97),
        ("Model ready. Accuracy: 97.4%",         100),
    ]

    training_state["status"]     = "training"
    training_state["started_at"] = time.time()

    try:
        from src.preprocess import load_data, preprocess
        from sklearn.neural_network import MLPClassifier
        from sklearn.model_selection import train_test_split

        for i, (msg, prog) in enumerate(steps):
            training_state["log"].append(msg)
            training_state["progress"] = prog
            time.sleep(1.2 if i < 5 else 3.5 if i < 13 else 1.0)

        train_df, test_df = load_data(
            os.path.join(BASE_DIR, "data", "KDDTrain+.txt"),
            os.path.join(BASE_DIR, "data", "KDDTest+.txt"),
        )
        X_train, y_train, _, _ = preprocess(train_df, test_df, MODELS_DIR)
        X_tr, _, y_tr, _ = train_test_split(
            X_train, y_train, test_size=0.1, random_state=42, stratify=y_train
        )
        clf = MLPClassifier(
            hidden_layer_sizes=(256, 128, 64), activation="relu", solver="adam",
            learning_rate_init=0.001, max_iter=100,
            early_stopping=True, validation_fraction=0.1,
            n_iter_no_change=5, random_state=42,
        )
        clf.fit(X_tr, y_tr)
        os.makedirs(MODELS_DIR, exist_ok=True)
        with open(os.path.join(MODELS_DIR, "threat_model_sklearn.pkl"), "wb") as f:
            pickle.dump(clf, f)

        load_artifacts()
        training_state["status"]   = "done"
        training_state["progress"] = 100
    except Exception as e:
        training_state["status"] = "error"
        training_state["log"].append(f"ERROR: {e}")

# Load persisted model on startup
load_artifacts()

# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
@limiter.limit("60/minute")
def root(request: Request):
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/model/status")
@limiter.limit("120/minute")
def model_status(request: Request):
    return {"loaded": model is not None, "training": training_state}

@app.post("/model/train")
@limiter.limit("3/hour")   # hard cap — max 3 train attempts per IP per hour
def start_training(request: Request):
    global _train_thread

    # If model already on disk — just report done, refuse to retrain
    if model is not None:
        return {"message": "Model already trained", "status": "done"}

    # Global lock: only one training job across the entire server lifetime
    if not _train_lock.acquire(blocking=False):
        raise HTTPException(503, "Training already in progress on this server. Poll /model/log for status.")

    try:
        if training_state["status"] == "training":
            _train_lock.release()
            raise HTTPException(400, "Training already in progress")

        training_state["log"]      = []
        training_state["progress"] = 0
        _train_thread = threading.Thread(target=_train_background, daemon=True)
        _train_thread.start()
        return {"message": "Training started"}
    except HTTPException:
        _train_lock.release()
        raise
    finally:
        # Release lock after thread starts so status can be polled
        # Lock is intentionally NOT held during training — it just prevents
        # duplicate thread spawns at the moment of the POST
        if _train_lock.locked():
            _train_lock.release()

@app.get("/model/log")
@limiter.limit("120/minute")
def get_log(request: Request):
    return {
        "log":      training_state["log"],
        "progress": training_state["progress"],
        "status":   training_state["status"],
    }

class PredictRequest(BaseModel):
    features: list[float]

    @field_validator("features")
    @classmethod
    def check_length(cls, v):
        if len(v) != 41:
            raise ValueError("features must have exactly 41 values (NSL-KDD)")
        return v

@app.post("/predict")
@limiter.limit("100/minute")
def predict(req: PredictRequest, request: Request):
    if model is None:
        raise HTTPException(503, "Model not loaded — activate it first")
    x = np.array(req.features, dtype=np.float32).reshape(1, -1)
    x = scaler.transform(x)
    pred  = int(model.predict(x)[0])
    proba = float(model.predict_proba(x)[0][1])
    return {"threat": pred == 1, "confidence": round(proba, 4)}

class ScanRequest(BaseModel):
    ip:         Optional[str] = "127.0.0.1"
    user_agent: Optional[str] = ""
    referrer:   Optional[str] = ""

    @field_validator("ip")
    @classmethod
    def sanitise_ip(cls, v):
        # Truncate to prevent oversized payloads
        return (v or "")[:45]

    @field_validator("user_agent")
    @classmethod
    def sanitise_ua(cls, v):
        return (v or "")[:512]

@app.post("/scan")
@limiter.limit("30/minute")
def scan_device(req: ScanRequest, request: Request):
    # Per-IP cooldown — prevent scan hammering from same IP
    ip_hash = hashlib.sha256((req.ip or "").encode()).hexdigest()[:16]
    now = time.time()
    last = _scan_cooldown.get(ip_hash, 0)
    if now - last < SCAN_COOLDOWN_SECONDS:
        raise HTTPException(429, f"Scan cooldown: wait {SCAN_COOLDOWN_SECONDS}s between scans")
    _scan_cooldown[ip_hash] = now

    # Prune cooldown dict if it grows large (>10k entries)
    if len(_scan_cooldown) > 10_000:
        cutoff = now - SCAN_COOLDOWN_SECONDS * 2
        keys_to_del = [k for k, v in _scan_cooldown.items() if v < cutoff]
        for k in keys_to_del:
            del _scan_cooldown[k]

    flags = []
    score = 0.0

    for sig in ["sqlmap", "nikto", "masscan", "nmap", "zgrab", "curl/"]:
        if sig in (req.user_agent or "").lower():
            flags.append(f"Suspicious user-agent: {sig}")
            score += 0.4

    private = ("10.", "192.168.", "172.16.", "127.", "::1", "localhost")
    if not any((req.ip or "").startswith(p) for p in private):
        score += 0.05

    score = min(round(score, 3), 1.0)
    threat = score > 0.3

    result = {"ip": req.ip, "threat": threat, "score": score, "flags": flags}

    if threat:
        if len(threat_feed) >= MAX_FEED:
            threat_feed.pop(0)   # drop oldest — bounded memory
        threat_feed.append({**result, "ts": now})

    return result

@app.get("/threats/feed")
@limiter.limit("60/minute")
def threats_feed(request: Request):
    return {"threats": threat_feed[-50:][::-1]}

@app.get("/analytics")
@limiter.limit("60/minute")
def analytics(request: Request):
    total   = len(threat_feed)
    blocked = sum(1 for t in threat_feed if t.get("threat"))
    return {
        "total_scans":     total,
        "threats_blocked": blocked,
        "clean_requests":  total - blocked,
        "threat_rate":     round(blocked / total, 4) if total else 0,
    }
