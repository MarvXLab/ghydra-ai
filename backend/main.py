import os, pickle, sys, secrets, uuid, html, logging

logger = logging.getLogger("ghydra")
from datetime import datetime, timedelta, timezone
from typing import Optional, AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
MODELS_DIR  = PROJECT_DIR / "models"

# ── Third-party imports ───────────────────────────────────────────
import httpx
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, EmailStr, field_validator, HttpUrl
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, func, and_, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
import bcrypt
import jwt

# ── Database models (inlined) ─────────────────────────────────────
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id                = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email             = Column(String, unique=True, index=True, nullable=False)
    hashed_password   = Column(String, nullable=True)
    full_name         = Column(String, nullable=False)
    is_verified       = Column(Boolean, default=False)
    is_active         = Column(Boolean, default=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    subscription_tier = Column(String, default="free")
    api_key           = Column(String, unique=True, nullable=True)
    google_id         = Column(String, unique=True, nullable=True)
    github_id         = Column(String, unique=True, nullable=True)
    avatar_url        = Column(String, nullable=True)
    username          = Column(String, unique=True, nullable=True)
    bio               = Column(String, nullable=True)
    otp_codes         = relationship("OTPCode", back_populates="user")
    scans             = relationship("Scan", back_populates="user")
    devices           = relationship("Device", back_populates="user")

class OTPCode(Base):
    __tablename__ = "otp_codes"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    code       = Column(String, nullable=False)
    purpose    = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user       = relationship("User", back_populates="otp_codes")

class Scan(Base):
    __tablename__ = "scans"
    id               = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id          = Column(String, ForeignKey("users.id"), nullable=True)
    scan_type        = Column(String, nullable=False)
    target           = Column(String, nullable=False)
    is_threat        = Column(Boolean, nullable=False)
    threat_score     = Column(Float, nullable=False)
    threat_flags     = Column(JSON, default=list)
    threat_categories= Column(JSON, default=list)
    user_agent       = Column(Text, nullable=True)
    ip_address       = Column(String, nullable=True)
    country          = Column(String, nullable=True)
    city             = Column(String, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    user             = relationship("User", back_populates="scans")

class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"
    id             = Column(Integer, primary_key=True)
    indicator      = Column(String, nullable=False, index=True)
    indicator_type = Column(String, nullable=False)
    threat_type    = Column(String, nullable=False)
    severity       = Column(String, nullable=False)
    confidence     = Column(Float, nullable=False)
    is_active      = Column(Boolean, default=True)
    first_seen     = Column(DateTime(timezone=True), server_default=func.now())

class Device(Base):
    __tablename__ = "devices"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    device_name = Column(String, nullable=False)
    device_type = Column(String, default="browser")
    user_agent  = Column(String, nullable=True)
    ip_address  = Column(String, nullable=True)
    is_active   = Column(Boolean, default=True)
    last_seen   = Column(DateTime(timezone=True), server_default=func.now())
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    user        = relationship("User", back_populates="devices")

class Project(Base):
    __tablename__ = "projects"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    name        = Column(String, nullable=False)
    description = Column(String, nullable=True)
    website     = Column(String, nullable=True)
    api_key     = Column(String, unique=True, nullable=False)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    user        = relationship("User")

# ── Database connection (inlined) ─────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
if "postgresql://" in DATABASE_URL and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
DATABASE_URL = DATABASE_URL.split("?")[0] + "?ssl=require"

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=5, max_overflow=10, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator:
    async with AsyncSessionLocal() as session:
        yield session

# ── Auth utils (inlined) ──────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")

def hash_password(p: str) -> str:           return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(p: str, h: str) -> bool: return bcrypt.checkpw(p.encode(), h.encode())

def create_access_token(data: dict) -> str:
    payload = {**data, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def create_refresh_token(data: dict) -> str:
    payload = {**data, "exp": datetime.now(timezone.utc) + timedelta(days=30), "type": "refresh"}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.exceptions.PyJWTError:
        raise HTTPException(401, "Invalid token")

def generate_api_key() -> str:
    import string
    alpha = string.ascii_letters + string.digits
    return "ghy_" + "".join(secrets.choice(alpha) for _ in range(32))

# ── Email service (inlined) ───────────────────────────────────────
BREVO_KEY = os.getenv("BREVO_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@ghydra.ai")

async def send_otp_email(to_email: str, code: str, name: str) -> bool:
    if not BREVO_KEY:
        logger.info("[DEV] OTP for %s: %s", to_email, code)
        return False
    # Escape user-controlled data before injecting into HTML (XSS fix)
    safe_name = html.escape(str(name)[:100])
    safe_code = html.escape(str(code))
    email_html = f"""<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:40px">
        <h2>Verify your Ghydra account</h2>
        <p>Hi {safe_name}, enter this code to verify your email:</p>
        <div style="background:#3b82f6;color:white;font-family:monospace;font-size:28px;letter-spacing:8px;padding:20px;border-radius:8px;text-align:center">{safe_code}</div>
        <p style="color:#6b7280;font-size:13px">Expires in 10 minutes. If you didn't register, ignore this email.</p>
    </div>"""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={"api-key": BREVO_KEY, "content-type": "application/json"},
                json={"sender": {"name": "Ghydra Security", "email": FROM_EMAIL},
                      "to": [{"email": to_email}], "subject": "Verify your Ghydra account",
                      "htmlContent": email_html},
                timeout=20.0
            )
            return r.status_code == 201
    except httpx.HTTPError as e:
        logger.error("Email send failed: %s", e)
        return False

# ── ML model ─────────────────────────────────────────────────────
ml_model = ml_scaler = ml_encoders = None
model_loaded = False

def load_ml_model():
    global ml_model, ml_scaler, ml_encoders, model_loaded
    mp = MODELS_DIR / "threat_model_sklearn.pkl"
    sp = MODELS_DIR / "scaler.pkl"
    ep = MODELS_DIR / "encoders.pkl"
    if all(p.exists() for p in [mp, sp, ep]):
        try:
            with open(mp, "rb") as f: ml_model   = pickle.load(f)
            with open(sp, "rb") as f: ml_scaler  = pickle.load(f)
            with open(ep, "rb") as f: ml_encoders= pickle.load(f)
            model_loaded = True
            print("ML model loaded")
        except Exception as e:
            print(f"Model load failed: {e}")
    else:
        print("No pre-trained model found")

# ── App setup ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safely add new columns if they don't exist yet
        for sql in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR",
        ]:
            try: await conn.execute(__import__('sqlalchemy').text(sql))
            except Exception as e: logger.warning("Migration warning: %s", e)
    load_ml_model()
    yield
    await engine.dispose()

limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])
app = FastAPI(title="Ghydra API", version="2.0.0", docs_url=None, redoc_url=None, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "https://ghydra-ai.pages.dev,http://localhost:5173").split(",")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://ghydra-ai.pages.dev")
GOOGLE_CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GITHUB_CLIENT_ID     = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
BACKEND_URL = os.environ.get("BACKEND_URL", "https://ghydra-ai.onrender.com")

app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS,
                   allow_methods=["GET","POST","PUT","DELETE","OPTIONS"],
                   allow_headers=["Content-Type","Authorization"], allow_credentials=True)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

http_security = HTTPBearer(auto_error=False)

# ── Auth dependencies ─────────────────────────────────────────────
async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(http_security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not creds: return None
    try:
        payload = verify_token(creds.credentials)
        # verify token type to prevent refresh tokens being used as access tokens
        if payload.get("type") != "access":
            return None
        r = await db.execute(select(User).where(User.id == payload.get("sub")))
        u = r.scalar_one_or_none()
        return u if u and u.is_active else None
    except HTTPException:
        return None
    except Exception as e:
        logger.warning("Auth error: %s", e)
        return None

async def require_user(u: User = Depends(get_current_user)) -> User:
    if not u: raise HTTPException(401, "Authentication required")
    return u

# ── Schemas ───────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    @field_validator("password")
    @classmethod
    def check_pw(cls, v):
        if len(v) < 8: raise ValueError("Password must be at least 8 characters")
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

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator('full_name')
    @classmethod
    def validate_name(cls, v):
        if v and len(v) > 100: raise ValueError('Name too long')
        return v

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        import re
        if v and not re.match(r'^[a-z0-9_-]{1,30}$', v):
            raise ValueError('Username must be 1-30 chars, lowercase letters/numbers/_/-')
        return v

    @field_validator('bio')
    @classmethod
    def validate_bio(cls, v):
        if v and len(v) > 300: raise ValueError('Bio too long (max 300 chars)')
        return v

    @field_validator('avatar_url')
    @classmethod
    def validate_avatar(cls, v):
        if v and not v.startswith('https://res.cloudinary.com/'):
            raise ValueError('Avatar must be a Cloudinary URL')
        return v

class DeviceLink(BaseModel):
    device_name: str
    device_type: str = "browser"

    @field_validator('device_name')
    @classmethod
    def validate_name(cls, v):
        if len(v) > 60: raise ValueError('Device name too long')
        return v.strip()

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip(): raise ValueError('Name required')
        if len(v) > 80: raise ValueError('Name too long')
        return v.strip()

    @field_validator('description')
    @classmethod
    def validate_desc(cls, v):
        if v and len(v) > 300: raise ValueError('Description too long')
        return v

    @field_validator('website')
    @classmethod
    def validate_website(cls, v):
        if v and not (v.startswith('https://') or v.startswith('http://')):
            raise ValueError('Website must be a valid URL')
        if v and len(v) > 200: raise ValueError('Website URL too long')
        return v

# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
@limiter.limit("60/minute")
async def health(request: Request):
    return {"status": "ok", "model_loaded": model_loaded, "ts": datetime.now(timezone.utc).isoformat()}

@app.post("/auth/register")
@limiter.limit("5/minute")
async def register(data: UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    ex = await db.execute(select(User).where(User.email == data.email))
    if ex.scalar_one_or_none(): raise HTTPException(400, "Email already registered")
    user = User(email=data.email, hashed_password=hash_password(data.password),
                full_name=data.full_name, api_key=generate_api_key())
    db.add(user); await db.commit(); await db.refresh(user)
    code = "".join(str(secrets.randbelow(10)) for _ in range(6))
    db.add(OTPCode(user_id=user.id, code=code, purpose="email_verification",
                   expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)))
    await db.commit()
    sent = await send_otp_email(user.email, code, user.full_name)
    return {"message": "Check your email for verification code", "email": user.email,
            "verification_code": None if sent else code}

@app.post("/auth/verify-email")
@limiter.limit("10/minute")
async def verify_email(data: OTPVerify, request: Request, db: AsyncSession = Depends(get_db)):
    ur = await db.execute(select(User).where(User.email == data.email))
    user = ur.scalar_one_or_none()
    if not user: raise HTTPException(404, "User not found")
    otr = await db.execute(select(OTPCode).where(and_(
        OTPCode.user_id == user.id, OTPCode.code == data.code,
        OTPCode.purpose == "email_verification", OTPCode.used == False,
        OTPCode.expires_at > datetime.now(timezone.utc)
    )))
    otp = otr.scalar_one_or_none()
    if not otp: raise HTTPException(400, "Invalid or expired code")
    user.is_verified = True; otp.used = True
    await db.commit()
    return {"message": "Email verified successfully"}

@app.post("/auth/login")
@limiter.limit("10/minute")
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(User).where(User.email == data.email))
    user = r.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_verified: raise HTTPException(403, "Email not verified")
    return {"access_token": create_access_token({"sub": user.id, "email": user.email}),
            "refresh_token": create_refresh_token({"sub": user.id}),
            "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "full_name": user.full_name,
                     "subscription_tier": user.subscription_tier}}

@app.post("/scan/url")
@limiter.limit("30/minute")
async def scan_url(data: URLScanRequest, request: Request, db: AsyncSession = Depends(get_db),
                   current_user: Optional[User] = Depends(get_current_user)):
    import re
    url = str(data.url)
    # SSRF protection — block private/internal IPs
    domain = data.url.host.lower()
    private_patterns = [
        r'^localhost$', r'^127\.', r'^10\.', r'^172\.(1[6-9]|2[0-9]|3[01])\.',
        r'^192\.168\.', r'^0\.0\.0\.0$', r'^::1$', r'^169\.254\.'
    ]
    for pat in private_patterns:
        if re.match(pat, domain):
            raise HTTPException(400, "Scanning internal/private addresses is not allowed")
    if len(url) > 2000:
        raise HTTPException(400, "URL too long")
    score, flags = 0.0, []
    if any(domain.endswith(t) for t in [".tk",".ml",".cf",".ga",".gq",".xyz",".top",".click",".loan",".work",".party",".review",".stream",".download"]):
        score += 0.4; flags.append("Suspicious TLD")
    # Excessive subdomains
    if len(domain.split(".")) > 4:
        score += 0.2; flags.append("Excessive subdomains")
    # IP address as host
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain):
        score += 0.5; flags.append("IP address used as domain")
    # Suspicious keywords in URL
    bad_words = ["phish","malware","virus","hack","crack","keygen","warez","free-download",
                 "login-secure","verify-account","update-payment","confirm-identity",
                 "paypal-","amazon-","google-","apple-","microsoft-","bankofamerica",
                 "account-suspended","unusual-activity","lucky-winner"]
    for w in bad_words:
        if w in url.lower(): score += 0.35; flags.append(f"Suspicious keyword: {w}"); break
    # Very long URL
    if len(url) > 200:
        score += 0.2; flags.append("Unusually long URL")
    # Too many hyphens in domain
    if domain.count("-") > 3:
        score += 0.2; flags.append("Too many hyphens in domain")
    # Non-HTTPS
    if url.startswith("http://"):
        score += 0.15; flags.append("Unencrypted HTTP")
    # Encoded characters (obfuscation)
    if url.count("%") > 5:
        score += 0.25; flags.append("URL obfuscation detected")
    # Known test threat domains
    if any(d in domain for d in ["malware-test","eicar","phishtank","badssl","danger","evil","threat"]):
        score = 1.0; flags.append("Known threat domain")

    score = min(round(score, 3), 1.0)
    is_threat = score >= 0.3
    scan = Scan(user_id=current_user.id if current_user else None, scan_type="url",
                target=url, is_threat=is_threat, threat_score=score,
                threat_flags=flags, threat_categories=[], ip_address=request.client.host)
    db.add(scan); await db.commit()
    return {"url": url, "is_threat": is_threat, "threat_score": score, "flags": flags, "scan_id": scan.id}

@app.post("/scan/device")
@limiter.limit("20/minute")
async def scan_device(data: DeviceScanRequest, request: Request, db: AsyncSession = Depends(get_db),
                      current_user: Optional[User] = Depends(get_current_user)):
    ua = (data.user_agent or request.headers.get("user-agent", ""))[:512]
    ip = request.client.host; score, flags = 0.0, []
    for sig in ["sqlmap", "nikto", "masscan", "nmap", "zgrab"]:
        if sig in ua.lower(): score += 0.6; flags.append(f"Suspicious agent: {sig}")
    score = min(score, 1.0)
    scan = Scan(user_id=current_user.id if current_user else None, scan_type="device",
                target=f"{ip}:{ua[:100]}", is_threat=score > 0.3, threat_score=score,
                threat_flags=flags, user_agent=ua, ip_address=ip)
    db.add(scan); await db.commit()
    return {"ip_address": ip, "is_threat": score > 0.3, "threat_score": round(score, 3),
            "flags": flags, "scan_id": scan.id}

@app.get("/dashboard/stats")
@limiter.limit("60/minute")
async def dashboard_stats(request: Request, db: AsyncSession = Depends(get_db),
                           current_user: User = Depends(require_user)):
    total   = await db.scalar(select(func.count(Scan.id)).where(Scan.user_id == current_user.id)) or 0
    threats = await db.scalar(select(func.count(Scan.id)).where(
        and_(Scan.user_id == current_user.id, Scan.is_threat == True))) or 0
    recent  = await db.execute(select(Scan).where(Scan.user_id == current_user.id)
                                .order_by(Scan.created_at.desc()).limit(10))
    scans = [{"id": s.id, "type": s.scan_type, "target": s.target, "is_threat": s.is_threat,
               "threat_score": s.threat_score, "created_at": s.created_at.isoformat()}
             for s in recent.scalars()]
    return {"total_scans": total, "threats_found": threats, "clean_scans": total - threats,
            "threat_rate": round(threats / max(total, 1), 3), "recent_scans": scans,
            "model_status": "active" if model_loaded else "offline"}

@app.get("/dashboard/threats")
@limiter.limit("60/minute")
async def threat_dashboard(request: Request, db: AsyncSession = Depends(get_db),
                            current_user: User = Depends(require_user)):
    return {"threat_map": [], "model_loaded": model_loaded}

@app.get("/auth/me")
async def get_me(current_user: User = Depends(require_user)):
    return {"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name,
            "username": current_user.username, "bio": current_user.bio,
            "avatar_url": current_user.avatar_url, "subscription_tier": current_user.subscription_tier,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None}

@app.put("/auth/profile")
async def update_profile(data: ProfileUpdate, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(require_user)):
    if data.full_name is not None: current_user.full_name = data.full_name
    if data.bio is not None: current_user.bio = data.bio
    if data.avatar_url is not None: current_user.avatar_url = data.avatar_url
    if data.username is not None:
        ex = await db.execute(select(User).where(User.username == data.username, User.id != current_user.id))
        if ex.scalar_one_or_none(): raise HTTPException(400, "Username already taken")
        current_user.username = data.username
    await db.commit(); await db.refresh(current_user)
    return {"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name,
            "username": current_user.username, "bio": current_user.bio, "avatar_url": current_user.avatar_url}

@app.get("/devices")
async def list_devices(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_user)):
    r = await db.execute(select(Device).where(Device.user_id == current_user.id, Device.is_active == True))
    devs = r.scalars().all()
    return [{"id": d.id, "name": d.device_name, "type": d.device_type,
             "last_seen": d.last_seen.isoformat(), "created_at": d.created_at.isoformat()} for d in devs]

@app.post("/devices/link")
async def link_device(data: DeviceLink, request: Request, db: AsyncSession = Depends(get_db),
                      current_user: User = Depends(require_user)):
    # Free tier: max 2 devices
    if current_user.subscription_tier == "free":
        r = await db.execute(select(Device).where(Device.user_id == current_user.id, Device.is_active == True))
        if len(r.scalars().all()) >= 2:
            raise HTTPException(403, "Free plan allows 2 devices. Upgrade to Pro for more.")
    device = Device(user_id=current_user.id, device_name=data.device_name,
                    device_type=data.device_type,
                    user_agent=request.headers.get("user-agent", ""),
                    ip_address=request.client.host)
    db.add(device); await db.commit(); await db.refresh(device)
    return {"id": device.id, "name": device.device_name, "created_at": device.created_at.isoformat()}

@app.delete("/devices/{device_id}")
async def unlink_device(device_id: str, db: AsyncSession = Depends(get_db),
                         current_user: User = Depends(require_user)):
    r = await db.execute(select(Device).where(Device.id == device_id, Device.user_id == current_user.id))
    device = r.scalar_one_or_none()
    if not device: raise HTTPException(404, "Device not found")
    device.is_active = False; await db.commit()
    return {"message": "Device unlinked"}

# ── Developer Portal ─────────────────────────────────────────────
@app.get("/developer/projects")
async def list_projects(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_user)):
    r = await db.execute(select(Project).where(Project.user_id == current_user.id, Project.is_active == True))
    return [{"id": p.id, "name": p.name, "description": p.description, "website": p.website,
             "api_key": p.api_key, "created_at": p.created_at.isoformat()} for p in r.scalars().all()]

@app.post("/developer/projects")
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(require_user)):
    # Limit: free=3 projects, pro=unlimited
    r = await db.execute(select(Project).where(Project.user_id == current_user.id, Project.is_active == True))
    existing = r.scalars().all()
    limit = 10 if current_user.subscription_tier == "pro" else 3
    if len(existing) >= limit:
        raise HTTPException(403, f"Project limit reached ({limit}). {'Upgrade to Pro for more.' if current_user.subscription_tier != 'pro' else ''}")
    project = Project(user_id=current_user.id, name=data.name, description=data.description,
                      website=data.website, api_key="ghk_" + secrets.token_urlsafe(32))
    db.add(project); await db.commit(); await db.refresh(project)
    return {"id": project.id, "name": project.name, "api_key": project.api_key,
            "created_at": project.created_at.isoformat()}

@app.delete("/developer/projects/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(require_user)):
    r = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == current_user.id))
    p = r.scalar_one_or_none()
    if not p: raise HTTPException(404, "Project not found")
    p.is_active = False; await db.commit()
    return {"message": "Project deleted"}

@app.get("/developer/projects/{project_id}/analytics")
async def project_analytics(project_id: str, db: AsyncSession = Depends(get_db),
                              current_user: User = Depends(require_user)):
    r = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == current_user.id))
    p = r.scalar_one_or_none()
    if not p: raise HTTPException(404, "Project not found")
    # Scans made using this project's API key (stored in threat_categories for now)
    total = await db.scalar(select(func.count(Scan.id)).where(
        Scan.threat_categories.contains([project_id]))) or 0
    threats = await db.scalar(select(func.count(Scan.id)).where(
        Scan.threat_categories.contains([project_id]), Scan.is_threat == True)) or 0
    recent_r = await db.execute(select(Scan).where(
        Scan.threat_categories.contains([project_id])).order_by(Scan.created_at.desc()).limit(20))
    scans = [{"id": s.id, "type": s.scan_type, "target": s.target, "is_threat": s.is_threat,
              "threat_score": s.threat_score, "ip_address": s.ip_address,
              "created_at": s.created_at.isoformat()} for s in recent_r.scalars()]
    return {"project": {"id": p.id, "name": p.name}, "total_requests": total,
            "threats_blocked": threats, "recent_activity": scans}

# ── OAuth helpers ─────────────────────────────────────────────────
from urllib.parse import quote as _quote

def _safe_name(raw: str, maxlen: int = 100) -> str:
    """Strip control characters and cap length for OAuth display names."""
    import unicodedata
    cleaned = "".join(c for c in raw if unicodedata.category(c) not in ("Cc", "Cf"))
    return cleaned[:maxlen].strip() or "User"

def _safe_avatar(url: str | None) -> str | None:
    """Only accept HTTPS avatar URLs from known providers."""
    if not url: return None
    allowed = ("https://lh3.googleusercontent.com/", "https://avatars.githubusercontent.com/")
    return url if any(url.startswith(p) for p in allowed) else None

# ── Google OAuth ──────────────────────────────────────────────────
@app.get("/auth/google")
async def google_login():
    from fastapi.responses import RedirectResponse
    import urllib.parse
    params = urllib.parse.urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile"
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")

@app.get("/auth/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    code = request.query_params.get("code")
    if not code: raise HTTPException(400, "Missing code")
    from fastapi.responses import RedirectResponse
    try:
        async with httpx.AsyncClient() as client:
            token_r = await client.post("https://oauth2.googleapis.com/token", data={
                "code": code, "client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{BACKEND_URL}/auth/google/callback", "grant_type": "authorization_code"
            }, timeout=15.0)
            token_data = token_r.json()
            if "access_token" not in token_data:
                raise HTTPException(400, "Google auth failed")
            user_r = await client.get("https://www.googleapis.com/oauth2/v2/userinfo",
                                       headers={"Authorization": f"Bearer {token_data['access_token']}"},
                                       timeout=15.0)
            guser = user_r.json()
    except httpx.HTTPError as e:
        logger.error("Google OAuth error: %s", e)
        raise HTTPException(502, "OAuth provider unreachable")
    if not guser.get("email") or not guser.get("id"):
        raise HTTPException(400, "Incomplete Google profile")
    r = await db.execute(select(User).where(User.google_id == guser["id"]))
    user = r.scalar_one_or_none()
    if not user:
        er = await db.execute(select(User).where(User.email == guser["email"]))
        user = er.scalar_one_or_none()
        if user:
            user.google_id = guser["id"]
            user.avatar_url = _safe_avatar(guser.get("picture"))
        else:
            user = User(email=guser["email"], full_name=_safe_name(guser.get("name", "")),
                        google_id=guser["id"], avatar_url=_safe_avatar(guser.get("picture")),
                        is_verified=True, api_key=generate_api_key())
            db.add(user)
        await db.commit(); await db.refresh(user)
    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})
    # URL-encode tokens before placing in redirect to prevent open redirect injection
    return RedirectResponse(
        f"{FRONTEND_URL}/auth/callback?access_token={_quote(access_token, safe='')}&refresh_token={_quote(refresh_token, safe='')}"
    )

# ── Model training endpoints ─────────────────────────────────────
import threading

_training_state: dict = {"status": "idle", "log": [], "progress": 0}

def _run_training():
    global ml_model, ml_scaler, ml_encoders, model_loaded, _training_state
    _training_state = {"status": "training", "log": ["[ghydra] Starting AI engine training..."], "progress": 0}
    try:
        import sys
        sys.path.insert(0, str(PROJECT_DIR))
        from src.preprocess import load_data, preprocess
        from sklearn.neural_network import MLPClassifier
        from sklearn.model_selection import train_test_split

        data_dir = PROJECT_DIR / "data"
        train_path = data_dir / "KDDTrain+.txt"
        test_path  = data_dir / "KDDTest+.txt"

        if not train_path.exists():
            _training_state["log"].append("[error] Training data not found")
            _training_state["status"] = "error"
            return

        _training_state["log"].append("[ghydra] Loading NSL-KDD dataset..."); _training_state["progress"] = 10
        train_df, test_df = load_data(str(train_path), str(test_path))

        _training_state["log"].append("[ghydra] Preprocessing features..."); _training_state["progress"] = 30
        MODELS_DIR.mkdir(exist_ok=True)
        X_train, y_train, _, _ = preprocess(train_df, test_df, str(MODELS_DIR))

        _training_state["log"].append("[ghydra] Training MLP 256→128→64..."); _training_state["progress"] = 50
        model = MLPClassifier(hidden_layer_sizes=(256, 128, 64), activation="relu", solver="adam",
                              max_iter=100, early_stopping=True, random_state=42, verbose=False)
        X_tr, _, y_tr, _ = train_test_split(X_train, y_train, test_size=0.1, random_state=42, stratify=y_train)
        model.fit(X_tr, y_tr)

        _training_state["log"].append("[ghydra] Saving model..."); _training_state["progress"] = 90
        with open(MODELS_DIR / "threat_model_sklearn.pkl", "wb") as f: pickle.dump(model, f)
        load_ml_model()
        _training_state["log"].append("[ghydra] ✓ AI engine online.")
        _training_state["progress"] = 100
        _training_state["status"] = "done"
    except Exception as e:
        _training_state["log"].append(f"[error] {e}")
        _training_state["status"] = "error"

@app.get("/model/status")
async def model_status():
    return {"loaded": model_loaded, "training": _training_state}

@app.get("/model/log")
async def model_log():
    return _training_state

@app.post("/model/train")
async def model_train():
    if model_loaded: raise HTTPException(400, detail="Model already trained")
    if _training_state["status"] == "training": raise HTTPException(400, detail="Training already in progress")
    threading.Thread(target=_run_training, daemon=True).start()
    return {"message": "Training started"}

# ── GitHub OAuth ──────────────────────────────────────────────────
@app.get("/auth/github")
async def github_login():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={BACKEND_URL}/auth/github/callback&scope=user:email")

@app.get("/auth/github/callback")
async def github_callback(request: Request, db: AsyncSession = Depends(get_db)):
    code = request.query_params.get("code")
    if not code: raise HTTPException(400, "Missing code")
    from fastapi.responses import RedirectResponse
    try:
        async with httpx.AsyncClient() as client:
            token_r = await client.post("https://github.com/login/oauth/access_token",
                                         headers={"Accept": "application/json"},
                                         data={"client_id": GITHUB_CLIENT_ID, "client_secret": GITHUB_CLIENT_SECRET, "code": code},
                                         timeout=15.0)
            token_data = token_r.json()
            if "access_token" not in token_data:
                raise HTTPException(400, "GitHub auth failed")
            gh_token = token_data["access_token"]
            user_r  = await client.get("https://api.github.com/user",
                                        headers={"Authorization": f"Bearer {gh_token}"}, timeout=15.0)
            email_r = await client.get("https://api.github.com/user/emails",
                                        headers={"Authorization": f"Bearer {gh_token}"}, timeout=15.0)
            guser = user_r.json()
            emails = email_r.json() if isinstance(email_r.json(), list) else []
    except httpx.HTTPError as e:
        logger.error("GitHub OAuth error: %s", e)
        raise HTTPException(502, "OAuth provider unreachable")
    if not guser.get("id"):
        raise HTTPException(400, "Incomplete GitHub profile")
    primary_email = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), guser.get("email", ""))
    if not primary_email:
        raise HTTPException(400, "No verified email on GitHub account")
    r = await db.execute(select(User).where(User.github_id == str(guser["id"])))
    user = r.scalar_one_or_none()
    if not user:
        er = await db.execute(select(User).where(User.email == primary_email))
        user = er.scalar_one_or_none()
        if user:
            user.github_id = str(guser["id"])
            user.avatar_url = _safe_avatar(guser.get("avatar_url"))
        else:
            user = User(email=primary_email,
                        full_name=_safe_name(guser.get("name") or guser.get("login", "")),
                        github_id=str(guser["id"]), avatar_url=_safe_avatar(guser.get("avatar_url")),
                        is_verified=True, api_key=generate_api_key())
            db.add(user)
        await db.commit(); await db.refresh(user)
    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})
    return RedirectResponse(
        f"{FRONTEND_URL}/auth/callback?access_token={_quote(access_token, safe='')}&refresh_token={_quote(refresh_token, safe='')}"
    )
