import os
import pickle
import time
import threading
import hashlib
import asyncio
import sys
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
import httpx
try:
    import geoip2.database
    import geoip2.errors
except ImportError:
    geoip2 = None

from fastapi import FastAPI, HTTPException, Request, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, EmailStr, field_validator, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

# Add backend to Python path
BACKEND_DIR = Path(__file__).parent
PROJECT_DIR = BACKEND_DIR.parent
MODELS_DIR  = str(PROJECT_DIR / "models")
sys.path.insert(0, str(BACKEND_DIR))

# Local imports
from database.connection import get_db, init_db, close_db
from models.database import User, Scan, ThreatIntelligence, Project, SecurityEvent, TrafficLog, OTPCode
from auth.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    verify_token, generate_otp_code, verify_otp_code, generate_api_key
)
from services.email import email_service

# ── App Lifecycle ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    load_ml_model()
    yield
    # Shutdown
    await close_db()

# ── Rate Limiter ─────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])

app = FastAPI(
    title="Ghydra Threat Detection API",
    description="Advanced AI-powered cybersecurity platform",
    version="2.0.0",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS Configuration ───────────────────────────────────────────
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "https://ghydra-ai.pages.dev,http://localhost:5173,http://localhost:4173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)

# ML Model (pre-trained, loaded once)
model = None
scaler = None
encoders = None
model_loaded = False

# Security services
security = HTTPBearer(auto_error=False)

# GeoIP database (optional)
geoip_db = None
try:
    if geoip2 is not None:
        geoip_db_path = os.path.join(str(BACKEND_DIR.parent), "GeoLite2-City.mmdb")
        if os.path.exists(geoip_db_path):
            geoip_db = geoip2.database.Reader(geoip_db_path)
except Exception:
    pass

# ── Helper Functions ─────────────────────────────────────────────
def load_ml_model():
    """Load pre-trained ML model"""
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
            print(f"Failed to load model: {e}")
    else:
        print("No pre-trained model found — will train on demand")

def get_geolocation(ip: str) -> Dict[str, Any]:
    """Get geolocation data for IP address"""
    if not geoip_db or geoip2 is None:
        return {}
    
    try:
        response = geoip_db.city(ip)
        return {
            "country": response.country.name,
            "city": response.city.name,
            "latitude": float(response.location.latitude) if response.location.latitude else None,
            "longitude": float(response.location.longitude) if response.location.longitude else None,
        }
    except Exception:
        return {}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user"""
    if not credentials:
        return None
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid user")
        
        return user
    except HTTPException:
        return None

async def require_user(current_user: User = Depends(get_current_user)) -> User:
    """Require authenticated user"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return current_user

# ── Pydantic Models ──────────────────────────────────────────────
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
    
class IPScanRequest(BaseModel):
    ip: str
    
class DeviceScanRequest(BaseModel):
    user_agent: Optional[str] = ""

class ProjectCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    webhook_url: Optional[HttpUrl] = None

# ── Authentication Routes ────────────────────────────────────────
@app.post("/auth/register")
@limiter.limit("5/minute")
async def register(
    user_data: UserRegister,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        api_key=generate_api_key()
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Generate OTP for email verification
    import secrets
    otp_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_record = OTPCode(
        user_id=user.id,
        code=otp_code,
        purpose="email_verification",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    
    db.add(otp_record)
    await db.commit()
    
    # Send verification email
    email_sent = await email_service.send_verification_code(
        user.email, otp_code, user.full_name
    )
    
    return {
        "message": "Registration successful. Check your email for verification code.",
        "email": user.email,
        "verification_code": otp_code if not email_sent else None  # Only show in dev if email failed
    }

@app.post("/auth/verify-email")
@limiter.limit("10/minute")
async def verify_email(
    otp_data: OTPVerify,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Find user and OTP
    user_result = await db.execute(select(User).where(User.email == otp_data.email))
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(404, "User not found")
    
    otp_result = await db.execute(
        select(OTPCode).where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.code == otp_data.code,
                OTPCode.purpose == "email_verification",
                OTPCode.used == False,
                OTPCode.expires_at > datetime.now(timezone.utc)
            )
        )
    )
    otp_record = otp_result.scalar_one_or_none()
    
    if not otp_record:
        raise HTTPException(400, "Invalid or expired verification code")
    
    # Mark as verified
    user.is_verified = True
    otp_record.used = True
    
    await db.commit()
    
    return {"message": "Email verified successfully"}

@app.post("/auth/login")
@limiter.limit("10/minute")
async def login(
    login_data: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Find user
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    
    if not user.is_verified:
        raise HTTPException(403, "Email not verified")
    
    # Create tokens
    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "subscription_tier": user.subscription_tier
        }
    }

# ── Scanning Routes ──────────────────────────────────────────────
@app.post("/scan/url")
@limiter.limit("30/minute")
async def scan_url(
    scan_data: URLScanRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    url = str(scan_data.url)
    
    # Basic URL analysis
    threat_score = 0.0
    flags = []
    categories = []
    
    # Check against threat intelligence
    domain = scan_data.url.host
    threat_result = await db.execute(
        select(ThreatIntelligence).where(
            and_(
                ThreatIntelligence.indicator == domain,
                ThreatIntelligence.indicator_type == "domain",
                ThreatIntelligence.is_active == True
            )
        )
    )
    threat_intel = threat_result.scalar_one_or_none()
    
    if threat_intel:
        threat_score = threat_intel.confidence
        categories.append(threat_intel.threat_type)
        flags.append(f"Known {threat_intel.threat_type} domain")
    
    # Heuristic analysis
    suspicious_tlds = [".tk", ".ml", ".cf", ".ga"]
    if any(url.endswith(tld) for tld in suspicious_tlds):
        threat_score += 0.3
        flags.append("Suspicious TLD")
    
    if len(domain.split(".")) > 3:  # too many subdomains
        threat_score += 0.2
        flags.append("Excessive subdomains")
    
    threat_score = min(threat_score, 1.0)
    is_threat = threat_score > 0.3
    
    # Save scan result
    scan = Scan(
        user_id=current_user.id if current_user else None,
        scan_type="url",
        target=url,
        is_threat=is_threat,
        threat_score=threat_score,
        threat_flags=flags,
        threat_categories=categories,
        ip_address=request.client.host
    )
    
    db.add(scan)
    await db.commit()
    
    return {
        "url": url,
        "is_threat": is_threat,
        "threat_score": round(threat_score, 3),
        "flags": flags,
        "categories": categories,
        "scan_id": scan.id
    }

@app.post("/scan/device")
@limiter.limit("20/minute")
async def scan_device(
    scan_data: DeviceScanRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_agent = scan_data.user_agent or request.headers.get("user-agent", "")
    ip_address = request.client.host
    
    # Get geolocation
    geo_data = get_geolocation(ip_address)
    
    # Heuristic analysis
    threat_score = 0.0
    flags = []
    
    # Check for suspicious user agents
    suspicious_agents = ["sqlmap", "nikto", "masscan", "nmap", "zgrab", "curl/", "python-requests"]
    for agent in suspicious_agents:
        if agent.lower() in user_agent.lower():
            threat_score += 0.6
            flags.append(f"Suspicious user-agent: {agent}")
    
    # Check IP reputation
    private_ranges = ["10.", "192.168.", "172.16.", "127."]
    if not any(ip_address.startswith(r) for r in private_ranges):
        # Check threat intelligence for IP
        threat_result = await db.execute(
            select(ThreatIntelligence).where(
                and_(
                    ThreatIntelligence.indicator == ip_address,
                    ThreatIntelligence.indicator_type == "ip",
                    ThreatIntelligence.is_active == True
                )
            )
        )
        threat_intel = threat_result.scalar_one_or_none()
        
        if threat_intel:
            threat_score += threat_intel.confidence * 0.5
            flags.append(f"Known malicious IP ({threat_intel.threat_type})")
    
    threat_score = min(threat_score, 1.0)
    is_threat = threat_score > 0.3
    
    # Save scan
    scan = Scan(
        user_id=current_user.id if current_user else None,
        scan_type="device",
        target=f"{ip_address}:{user_agent[:100]}",
        is_threat=is_threat,
        threat_score=threat_score,
        threat_flags=flags,
        user_agent=user_agent,
        ip_address=ip_address,
        **geo_data
    )
    
    db.add(scan)
    await db.commit()
    
    return {
        "ip_address": ip_address,
        "is_threat": is_threat,
        "threat_score": round(threat_score, 3),
        "flags": flags,
        "geolocation": geo_data,
        "scan_id": scan.id
    }

# ── Dashboard & Analytics ────────────────────────────────────────
@app.get("/dashboard/stats")
@limiter.limit("60/minute")
async def get_dashboard_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user)
):
    # Get user's scan statistics
    total_scans = await db.scalar(
        select(func.count(Scan.id)).where(Scan.user_id == current_user.id)
    )
    
    threats_found = await db.scalar(
        select(func.count(Scan.id)).where(
            and_(Scan.user_id == current_user.id, Scan.is_threat == True)
        )
    )
    
    # Get recent activity
    recent_scans = await db.execute(
        select(Scan)
        .where(Scan.user_id == current_user.id)
        .order_by(Scan.created_at.desc())
        .limit(10)
    )
    
    scans_list = []
    for scan in recent_scans.scalars():
        scans_list.append({
            "id": scan.id,
            "type": scan.scan_type,
            "target": scan.target,
            "is_threat": scan.is_threat,
            "threat_score": scan.threat_score,
            "created_at": scan.created_at.isoformat(),
            "geolocation": {
                "country": scan.country,
                "city": scan.city
            } if scan.country else None
        })
    
    return {
        "total_scans": total_scans or 0,
        "threats_found": threats_found or 0,
        "clean_scans": (total_scans or 0) - (threats_found or 0),
        "threat_rate": round((threats_found or 0) / max(total_scans or 1, 1), 3),
        "recent_scans": scans_list,
        "model_status": "active" if model_loaded else "offline"
    }

@app.get("/dashboard/threats")
@limiter.limit("60/minute")
async def get_threat_dashboard(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user)
):
    # Get threat map data
    threat_scans = await db.execute(
        select(Scan)
        .where(
            and_(
                Scan.user_id == current_user.id,
                Scan.is_threat == True,
                Scan.latitude.is_not(None),
                Scan.longitude.is_not(None)
            )
        )
        .order_by(Scan.created_at.desc())
        .limit(100)
    )
    
    threat_map = []
    for scan in threat_scans.scalars():
        threat_map.append({
            "lat": scan.latitude,
            "lng": scan.longitude,
            "country": scan.country,
            "city": scan.city,
            "threat_score": scan.threat_score,
            "threat_type": scan.threat_categories[0] if scan.threat_categories else "unknown",
            "timestamp": scan.created_at.isoformat()
        })
    
    return {
        "threat_map": threat_map,
        "model_loaded": model_loaded
    }

# ── Health Check ─────────────────────────────────────────────────
@app.get("/")
@limiter.limit("60/minute")
async def health_check(request: Request):
    return {
        "status": "ok",
        "version": "2.0.0",
        "model_loaded": model_loaded,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }