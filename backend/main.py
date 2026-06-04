import os, pickle, sys, secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from contextlib import asynccontextmanager
from pathlib import Path

# ── Path setup MUST be first ─────────────────────────────────────
BACKEND_DIR = Path(__file__).parent
PROJECT_DIR = BACKEND_DIR.parent
MODELS_DIR  = str(PROJECT_DIR / "models")
for p in [str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import numpy as np
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, EmailStr, field_validator, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from database.connection import get_db, init_db, close_db
from models.database import User, Scan, ThreatIntelligence, OTPCode
from auth.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_token, generate_api_key
)
from services.email import email_service

# ── Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    load_ml_model()
    yield
    await close_db()

# ── App ───────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])
app = FastAPI(title="Ghydra API", version="2.0.0",
              docs_url=None, redoc_url=None, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "https://ghydra-ai.pages.dev,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)

# ── ML Model ──────────────────────────────────────────────────────
model = scaler = encoders = None
model_loaded = False
security = HTTPBearer(auto_error=False)

def load_ml_model():
    global model, scaler, encoders, model_loaded
    mp = os.path.join(MODELS_DIR, "threat_model_sklearn.pkl")
    sp = os.path.join(MODELS_DIR, "scaler.pkl")
    ep = os.path.join(MODELS_DIR, "encoders.pkl")
    if all(os.path.exists(p) for p in [mp, sp, ep]):
        try:
            with open(mp, "rb") as f: model    = pickle.load(f)
            with open(sp, "rb") as f: scaler   = pickle.load(f)
            with open(ep, "rb") as f: encoders = pickle.load(f)
            model_loaded = True
            print("ML model loaded successfully")
        except Exception as e:
            print(f"Model load failed: {e}")
    else:
        print("No pre-trained model found")

# ── Auth helpers ──────────────────────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
        result  = await db.execute(select(User).where(User.id == payload.get("sub")))
        user    = result.scalar_one_or_none()
        return user if user and user.is_active else None
    except Exception:
        return None

async def require_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user

# ── Schemas ───────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

class URLScanRequest(BaseModel):
    url: HttpUrl

class DeviceScanRequest(BaseModel):
    user_agent: Optional[str] = ""

# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
@limiter.limit("60/minute")
async def health(request: Request):
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/auth/register")
@limiter.limit("5/minute")
async def register(user_data: UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == user_data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        api_key=generate_api_key()
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    db.add(OTPCode(
        user_id=user.id, code=otp_code, purpose="email_verification",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
    ))
    await db.commit()

    email_sent = await email_service.send_verification_code(user.email, otp_code, user.full_name)
    return {
        "message": "Check your email for verification code",
        "email": user.email,
        "verification_code": None if email_sent else otp_code
    }

@app.post("/auth/verify-email")
@limiter.limit("10/minute")
async def verify_email(otp_data: OTPVerify, request: Request, db: AsyncSession = Depends(get_db)):
    ur = await db.execute(select(User).where(User.email == otp_data.email))
    user = ur.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    otr = await db.execute(select(OTPCode).where(and_(
        OTPCode.user_id == user.id,
        OTPCode.code == otp_data.code,
        OTPCode.purpose == "email_verification",
        OTPCode.used == False,
        OTPCode.expires_at > datetime.now(timezone.utc)
    )))
    otp = otr.scalar_one_or_none()
    if not otp:
        raise HTTPException(400, "Invalid or expired code")

    user.is_verified = True
    otp.used = True
    await db.commit()
    return {"message": "Email verified successfully"}

@app.post("/auth/login")
@limiter.limit("10/minute")
async def login(login_data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_verified:
        raise HTTPException(403, "Email not verified")
    return {
        "access_token":  create_access_token({"sub": user.id, "email": user.email}),
        "refresh_token": create_refresh_token({"sub": user.id}),
        "token_type":    "bearer",
        "user": {
            "id": user.id, "email": user.email,
            "full_name": user.full_name,
            "subscription_tier": user.subscription_tier
        }
    }

@app.post("/scan/url")
@limiter.limit("30/minute")
async def scan_url(
    scan_data: URLScanRequest, request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    url    = str(scan_data.url)
    domain = scan_data.url.host
    score, flags, cats = 0.0, [], []

    ti_r = await db.execute(select(ThreatIntelligence).where(and_(
        ThreatIntelligence.indicator == domain,
        ThreatIntelligence.indicator_type == "domain",
        ThreatIntelligence.is_active == True
    )))
    ti = ti_r.scalar_one_or_none()
    if ti:
        score = ti.confidence
        cats.append(ti.threat_type)
        flags.append(f"Known {ti.threat_type} domain")

    if any(url.endswith(t) for t in [".tk", ".ml", ".cf", ".ga"]):
        score += 0.3; flags.append("Suspicious TLD")
    if len(domain.split(".")) > 3:
        score += 0.2; flags.append("Excessive subdomains")

    score = min(score, 1.0)
    scan = Scan(
        user_id=current_user.id if current_user else None,
        scan_type="url", target=url,
        is_threat=score > 0.3, threat_score=score,
        threat_flags=flags, threat_categories=cats,
        ip_address=request.client.host
    )
    db.add(scan)
    await db.commit()
    return {"url": url, "is_threat": score > 0.3, "threat_score": round(score, 3),
            "flags": flags, "categories": cats, "scan_id": scan.id}

@app.post("/scan/device")
@limiter.limit("20/minute")
async def scan_device(
    scan_data: DeviceScanRequest, request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    ua    = scan_data.user_agent or request.headers.get("user-agent", "")
    ip    = request.client.host
    score, flags = 0.0, []

    for sig in ["sqlmap", "nikto", "masscan", "nmap", "zgrab"]:
        if sig in ua.lower():
            score += 0.6; flags.append(f"Suspicious agent: {sig}")

    score = min(score, 1.0)
    scan = Scan(
        user_id=current_user.id if current_user else None,
        scan_type="device", target=f"{ip}:{ua[:100]}",
        is_threat=score > 0.3, threat_score=score,
        threat_flags=flags, user_agent=ua, ip_address=ip
    )
    db.add(scan)
    await db.commit()
    return {"ip_address": ip, "is_threat": score > 0.3,
            "threat_score": round(score, 3), "flags": flags, "scan_id": scan.id}

@app.get("/dashboard/stats")
@limiter.limit("60/minute")
async def dashboard_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user)
):
    total   = await db.scalar(select(func.count(Scan.id)).where(Scan.user_id == current_user.id)) or 0
    threats = await db.scalar(select(func.count(Scan.id)).where(
        and_(Scan.user_id == current_user.id, Scan.is_threat == True)
    )) or 0
    recent  = await db.execute(
        select(Scan).where(Scan.user_id == current_user.id)
        .order_by(Scan.created_at.desc()).limit(10)
    )
    scans = [
        {"id": s.id, "type": s.scan_type, "target": s.target,
         "is_threat": s.is_threat, "threat_score": s.threat_score,
         "created_at": s.created_at.isoformat()}
        for s in recent.scalars()
    ]
    return {
        "total_scans": total, "threats_found": threats,
        "clean_scans": total - threats,
        "threat_rate": round(threats / max(total, 1), 3),
        "recent_scans": scans,
        "model_status": "active" if model_loaded else "offline"
    }

@app.get("/dashboard/threats")
@limiter.limit("60/minute")
async def threat_dashboard(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user)
):
    return {"threat_map": [], "model_loaded": model_loaded}
