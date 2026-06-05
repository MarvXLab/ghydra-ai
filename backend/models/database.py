from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for OAuth users
    full_name = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # OAuth fields
    google_id = Column(String, unique=True, nullable=True)
    github_id = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Subscription
    subscription_tier = Column(String, default="free")  # free, pro, enterprise
    api_key = Column(String, unique=True, nullable=True)
    api_calls_count = Column(Integer, default=0)
    api_calls_limit = Column(Integer, default=1000)  # per month
    
    # Relationships
    scans = relationship("Scan", back_populates="user")
    projects = relationship("Project", back_populates="user")
    otp_codes = relationship("OTPCode", back_populates="user")

class OTPCode(Base):
    __tablename__ = "otp_codes"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    code = Column(String, nullable=False)
    purpose = Column(String, nullable=False)  # email_verification, password_reset
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="otp_codes")

class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # nullable for anonymous
    scan_type = Column(String, nullable=False)  # device, url, ip
    target = Column(String, nullable=False)  # IP, URL, or device info
    
    # Results
    is_threat = Column(Boolean, nullable=False)
    threat_score = Column(Float, nullable=False)
    threat_flags = Column(JSON, default=list)
    threat_categories = Column(JSON, default=list)  # malware, phishing, suspicious
    
    # Metadata
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="scans")

class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"
    
    id = Column(Integer, primary_key=True)
    indicator = Column(String, nullable=False, index=True)  # IP, domain, hash
    indicator_type = Column(String, nullable=False)  # ip, domain, url, hash
    threat_type = Column(String, nullable=False)  # malware, phishing, botnet
    severity = Column(String, nullable=False)  # low, medium, high, critical
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    
    description = Column(Text, nullable=True)
    source = Column(String, nullable=False)  # internal, external_api, user_report
    tags = Column(JSON, default=list)
    
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    domain = Column(String, nullable=True)
    api_key = Column(String, unique=True, nullable=False)
    
    # Settings
    webhook_url = Column(String, nullable=True)
    email_alerts = Column(Boolean, default=True)
    threat_threshold = Column(Float, default=0.3)  # 0.0 to 1.0
    
    # Stats
    total_requests = Column(Integer, default=0)
    threats_blocked = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="projects")
    events = relationship("SecurityEvent", back_populates="project")

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    
    # Request details
    ip_address = Column(String, nullable=False)
    user_agent = Column(Text, nullable=True)
    request_path = Column(String, nullable=True)
    request_method = Column(String, nullable=True)
    
    # Threat analysis
    is_threat = Column(Boolean, nullable=False)
    threat_score = Column(Float, nullable=False)
    threat_categories = Column(JSON, default=list)
    
    # Geolocation
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Response
    action_taken = Column(String, default="logged")  # logged, blocked, rate_limited
    webhook_sent = Column(Boolean, default=False)
    email_sent = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="events")

class TrafficLog(Base):
    __tablename__ = "traffic_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Traffic metrics
    bytes_in = Column(Integer, default=0)
    bytes_out = Column(Integer, default=0)
    requests_count = Column(Integer, default=0)
    threats_count = Column(Integer, default=0)
    
    # Time bucket (hourly aggregation)
    hour_bucket = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())