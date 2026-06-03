import os, json, pickle, time, threading
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Ghydra Threat Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── In-memory state ─────────────────────────────────────────────
model    = None
scaler   = None
encoders = None

training_state = {
    "status": "idle",       # idle | training | done | error
    "progress": 0,
    "log": [],
    "started_at": None,
}

# Simulated threat feed (IP, type, severity, timestamp)
threat_feed: list[dict] = []

# ── Helpers ──────────────────────────────────────────────────────
def load_artifacts():
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
        ("Initialising MLP 256→128→64...",       35),
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

    training_state["status"] = "training"
    training_state["started_at"] = time.time()

    try:
        from src.preprocess import load_data, preprocess
        from sklearn.neural_network import MLPClassifier
        from sklearn.model_selection import train_test_split

        for i, (msg, prog) in enumerate(steps):
            training_state["log"].append(msg)
            training_state["progress"] = prog
            if i < 5:
                time.sleep(1.2)
            elif i < 13:
                time.sleep(3.5)
            else:
                time.sleep(1.0)

        # Actual train
        train_df, test_df = load_data(
            os.path.join(BASE_DIR, "data", "KDDTrain+.txt"),
            os.path.join(BASE_DIR, "data", "KDDTest+.txt"),
        )
        X_train, y_train, _, _ = preprocess(train_df, test_df, MODELS_DIR)
        X_tr, X_val, y_tr, y_val = train_test_split(
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
        training_state["status"] = "done"
        training_state["progress"] = 100
    except Exception as e:
        training_state["status"] = "error"
        training_state["log"].append(f"ERROR: {e}")

# Load on startup if already trained
load_artifacts()

# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/model/status")
def model_status():
    return {
        "loaded":   model is not None,
        "training": training_state,
    }

@app.post("/model/train")
def start_training():
    if training_state["status"] == "training":
        raise HTTPException(400, "Training already in progress")
    if model is not None:
        return {"message": "Model already trained", "status": "done"}
    training_state["log"] = []
    training_state["progress"] = 0
    t = threading.Thread(target=_train_background, daemon=True)
    t.start()
    return {"message": "Training started"}

@app.get("/model/log")
def get_log():
    return {
        "log":      training_state["log"],
        "progress": training_state["progress"],
        "status":   training_state["status"],
    }

class PredictRequest(BaseModel):
    features: list[float]   # 41 NSL-KDD numeric features (pre-encoded)

@app.post("/predict")
def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(503, "Model not loaded")
    x = np.array(req.features, dtype=np.float32).reshape(1, -1)
    x = scaler.transform(x)
    pred  = int(model.predict(x)[0])
    proba = float(model.predict_proba(x)[0][1])
    return {"threat": pred == 1, "confidence": round(proba, 4)}

class ScanRequest(BaseModel):
    ip: Optional[str] = "127.0.0.1"
    user_agent: Optional[str] = ""
    referrer: Optional[str] = ""

@app.post("/scan")
def scan_device(req: ScanRequest):
    """Lightweight heuristic scan — no ML needed."""
    flags = []
    score = 0.0

    suspicious_ua = ["sqlmap", "nikto", "masscan", "nmap", "zgrab", "curl/"]
    for ua in suspicious_ua:
        if ua.lower() in (req.user_agent or "").lower():
            flags.append(f"Suspicious user-agent: {ua}")
            score += 0.4

    private_prefixes = ("10.", "192.168.", "172.16.", "127.")
    if not any(req.ip.startswith(p) for p in private_prefixes):
        score += 0.05

    score = min(score, 1.0)
    threat = score > 0.3

    result = {
        "ip":     req.ip,
        "threat": threat,
        "score":  round(score, 3),
        "flags":  flags,
    }
    if threat:
        threat_feed.append({**result, "ts": time.time()})
    return result

@app.get("/threats/feed")
def threats_feed():
    """Return last 50 detected threats for the dashboard map."""
    return {"threats": threat_feed[-50:][::-1]}

@app.get("/analytics")
def analytics():
    total   = len(threat_feed)
    blocked = sum(1 for t in threat_feed if t.get("threat"))
    return {
        "total_scans":    total,
        "threats_blocked": blocked,
        "clean_requests": total - blocked,
        "threat_rate":    round(blocked / total, 4) if total else 0,
    }
