# GHYDRA — Project Summary
## AI-Powered Threat Detection & Developer Security Platform

---

## 1. WHAT IS GHYDRA

Ghydra is a full-stack AI-powered cybersecurity platform with two sides:

- **User side** — a security dashboard where individuals scan URLs and devices for threats, monitor their scan history, and manage linked devices
- **Developer side** — a security-as-a-service API platform where developers register projects, get API keys (`ghk_...`), and integrate Ghydra's threat detection into their own applications. Their site's traffic, IPs, and threat events are then visible in a per-project analytics dashboard

The name "Ghydra" reflects a multi-headed defense system — each integration point (URL scan, device scan, beacon, CORS guard) is a separate head that contributes to one unified security picture.

---

## 2. TECHNOLOGY STACK

### Backend
| Component         | Technology                                      |
|-------------------|-------------------------------------------------|
| Runtime           | Python 3.11                                     |
| Framework         | FastAPI + Uvicorn                               |
| Database          | PostgreSQL (async via asyncpg + SQLAlchemy 2.0) |
| Auth              | JWT (access + refresh tokens), bcrypt, OTP      |
| Email             | Brevo SMTP API                                  |
| ML Engine         | scikit-learn — MLP Classifier (256→128→64→1)    |
| Training Data     | NSL-KDD Dataset (125,973 network traffic records)|
| Rate Limiting     | slowapi                                         |
| HTTP Client       | httpx                                           |
| Deployment        | Render (web service)                            |

### Frontend
| Component         | Technology                                      |
|-------------------|-------------------------------------------------|
| Framework         | React 18 + TypeScript + Vite                   |
| Styling           | Tailwind CSS                                    |
| Charts            | Recharts                                        |
| Routing           | React Router v6                                 |
| HTTP Client       | Axios                                           |
| Auth Storage      | localStorage (JWT tokens)                       |
| Deployment        | Cloudflare Pages                                |

### Legacy Dashboard (Streamlit)
- Original proof-of-concept dashboard built with Streamlit + Plotly
- Still accessible at `ghydra-ai.streamlit.app`
- Used for visualizing the ML model performance metrics

---

## 3. FEATURES

### User Features
- **Email + Password registration** with OTP email verification
- **Google OAuth** and **GitHub OAuth** login
- **URL Threat Scanning** — paste any URL, Ghydra scores it 0.0–1.0 for threat probability with specific flags (suspicious TLD, obfuscated URL, known threat domain, unencrypted HTTP, etc.)
- **Device/IP Scanning** — scan a device's user agent and IP for known attack tool signatures (sqlmap, nikto, nmap, etc.)
- **Personal Dashboard** — see total scans, threats found, clean scans, threat rate, and recent scan history
- **Dark / Light mode** toggle
- **Profile management** — name, username, bio, avatar (Cloudinary upload)
- **Device linking** — register up to 2 devices on free plan, unlimited on Pro

### Developer Features
- **Developer enrollment** — OTP-verified activation of developer account
- **Developer profile** — public profile with pronouns, company, location, social links, bio
- **Project creation** — each project requires a name + website URL (required), gets a unique `ghk_` prefixed API key
- **OTP-gated key issuance** — a verification code is sent before any API key is created
- **Analytics dashboard** per project:
  - Total requests, threats blocked, allowed requests
  - Traffic over time (area chart — allowed vs denied)
  - Top 5 IPs by request count
  - Top 5 user agents
  - Top 5 request paths
  - Recent activity feed (target, IP, timestamp, ALLOW/DENY status)
- **Integration code snippets** — ready-to-copy examples in HTML, JavaScript, React, Python, Node.js, cURL
- **Dynamic CORS** — registering a project website automatically allows that origin on the Ghydra API — no manual env var changes needed
- **Project deletion** with confirmation phrase ("delete this project")
- **User Behaviour Analytics** — Pro tier, coming soon

### API Key Integration (what developers embed in their apps)
- `POST /beacon` — fire a pageview ping. Records page, IP, user agent under that project's analytics
- `POST /scan/url` — scan a URL for threats. Records the result under the project's external scans
- `POST /scan/device` — scan a device/IP for malicious signatures

---

## 4. SECURITY IMPLEMENTATION

### Authentication
- Passwords hashed with **bcrypt** (cost factor 12)
- JWT access tokens (24hr expiry) + refresh tokens (30 day expiry)
- **OTP email verification** on registration
- **OTP-gated developer enrollment** — you cannot become a developer without verifying your email via a 6-digit code
- **OTP-gated API key creation** — every new project key requires a fresh OTP confirmation
- Token type validation — refresh tokens cannot be used as access tokens (checked via `type` claim)

### API Security
- **Rate limiting** on all sensitive endpoints via slowapi:
  - Auth endpoints: 5–10 requests/minute
  - Scan endpoints: 20–30 requests/minute
  - Global default: 300 requests/minute
- **Input validation** via Pydantic field validators on all request bodies
- **SSRF protection** on URL scanning — private/internal IP ranges and localhost are blocked
- **API key format enforcement** — all project keys must start with `ghk_` prefix
- **Project key scoping** — a `ghk_` key can only see analytics for its own project

### CORS
- Static allowed origins list covers the Ghydra frontend and localhost dev
- **Dynamic CORS middleware** — checks the `Origin` header against all registered project websites in the DB and automatically allows matching origins, including handling `OPTIONS` preflight requests
- Any developer who registers a project with `https://theirapp.com` gets CORS access automatically — no manual Render env var changes required

### Security Headers
Every HTTP response includes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Data Protection
- Passwords never stored in plain text
- OTP codes are single-use and expire in 10 minutes
- Project API keys are stored in plaintext in the DB (needed for lookup) but only displayed once in the UI after creation — masked thereafter as `ghk_••••••••••••••••`
- Avatar URLs must be Cloudinary URLs (validated by regex) — no arbitrary external URLs accepted

---

## 5. SYSTEM FLOW

### User Registration Flow
```
User fills form
    → POST /auth/register
    → bcrypt password hash
    → Save user to DB (is_verified = False)
    → Generate 6-digit OTP
    → Send OTP via Brevo email
    → User enters OTP on /verify-email page
    → POST /auth/verify-email
    → Mark user as verified
    → Issue JWT access + refresh tokens
    → User lands on Dashboard
```

### Developer Enrollment Flow
```
Logged-in user clicks "Become a Developer"
    → POST /developer/enroll/request
    → Generate 6-digit OTP
    → Send OTP to user's email
    → User enters OTP
    → POST /developer/enroll/verify
    → Mark user as is_developer = True
    → User sets up developer profile
    → User can now create projects
```

### Project API Key Creation Flow
```
Developer fills project form (name + website required)
    → Click "Create Project"
    → POST /developer/projects/request-key
    → Generate 6-digit OTP → Send to email
    → User enters OTP
    → POST /developer/projects { name, website, otp_code }
    → OTP verified → Generate ghk_ prefixed key
    → Project saved to DB with website URL
    → Website origin auto-added to dynamic CORS allowlist
    → Key shown once in UI
```

### External Integration Flow (developer's app using the key)
```
Developer's app fires:
    POST /beacon { page: "/dashboard", referrer: null }
    Authorization: Bearer ghk_xxxxx

    → Ghydra validates ghk_ key → finds matching Project
    → Records ExternalScan { scan_type: "pageview", target: "/dashboard",
        ip_address: visitor_ip, user_agent: browser_ua }
    → Developer sees this in their analytics dashboard
```

### URL Scan Flow
```
POST /scan/url { url: "https://suspicious.xyz" }
    → SSRF check (block private IPs / localhost)
    → Heuristic scoring engine:
        + 0.40 if suspicious TLD (.tk .ml .xyz etc.)
        + 0.50 if bare IP address used as domain
        + 0.35 if phishing keywords found
        + 0.20 if URL length > 200 chars
        + 0.15 if unencrypted HTTP
        + 0.25 if URL obfuscation (>5 % chars)
        + 0.20 if excessive subdomains
        + 1.00 if known threat domain
    → Score clamped to [0.0, 1.0]
    → is_threat = score >= 0.3
    → Saved to Scan table
    → If ghk_ key used → also saved to ExternalScan under that project
    → Returns { url, is_threat, threat_score, flags, scan_id }
```

### Dynamic CORS Flow
```
Browser sends OPTIONS preflight to ghydra-ai.onrender.com
    Origin: https://developer-app.com

    → CORSMiddleware checks static ALLOWED_ORIGINS → no match
    → dynamic_cors middleware runs
    → Queries all active Projects from DB
    → Parses each project.website to extract origin
    → Match found: https://developer-app.com = registered project website
    → Returns 200 with Access-Control-Allow-Origin: https://developer-app.com
    → Browser proceeds with actual POST request
```

---

## 6. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     GHYDRA PLATFORM                         │
│                                                             │
│  ┌──────────────────────┐    ┌─────────────────────────┐   │
│  │   REACT FRONTEND     │    │   THIRD-PARTY APPS       │   │
│  │  (Cloudflare Pages)  │    │  (Keyra, etc.)           │   │
│  │                      │    │                          │   │
│  │  Dashboard           │    │  Uses ghk_ API key       │   │
│  │  Threat Scanner      │    │  Calls /beacon           │   │
│  │  Dev Analytics       │    │  Calls /scan/url         │   │
│  │  Settings/Dev Portal │    │  Calls /scan/device      │   │
│  └──────────┬───────────┘    └────────────┬────────────┘   │
│             │ HTTPS                        │ HTTPS          │
│             ▼                              ▼                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FASTAPI BACKEND (Render)                 │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │  Auth Layer  │  │  Scan Engine │  │  Dev Portal  │ │  │
│  │  │             │  │              │  │              │ │  │
│  │  │ JWT + OTP   │  │ URL Scoring  │  │ Projects     │ │  │
│  │  │ bcrypt      │  │ Device Scan  │  │ Analytics    │ │  │
│  │  │ Google OAuth│  │ ML Model     │  │ API Keys     │ │  │
│  │  │ GitHub OAuth│  │              │  │              │ │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────────┐│  │
│  │  │              SECURITY MIDDLEWARE                  ││  │
│  │  │  Rate Limiting │ Dynamic CORS │ Security Headers  ││  │
│  │  └──────────────────────────────────────────────────┘│  │
│  └──────────────────────────┬───────────────────────────┘  │
│                              │                              │
│             ┌────────────────┼────────────────┐            │
│             ▼                ▼                ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │  ML Model    │  │  Brevo Email │     │
│  │  (Neon)      │  │  sklearn pkl │  │  (OTP / Verify)│   │
│  │              │  │  scaler.pkl  │  │              │     │
│  │  Users       │  │  encoders    │  │              │     │
│  │  Scans       │  │              │  │              │     │
│  │  Projects    │  │  Trained on  │  │              │     │
│  │  ExternalScans│ │  NSL-KDD     │  │              │     │
│  │  Devices     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. DATABASE MODELS

| Table               | Purpose                                                      |
|---------------------|--------------------------------------------------------------|
| `users`             | User accounts — email, hashed_password, is_developer, etc.  |
| `otp_codes`         | Time-limited 6-digit codes for email verify / dev enrollment |
| `scans`             | Every scan run by a logged-in user (URL, device)             |
| `external_scans`    | Scans and beacons from third-party apps using a `ghk_` key  |
| `projects`          | Developer projects — name, website, api_key                  |
| `devices`           | Devices linked by users for monitoring                       |
| `threat_intelligence`| Known malicious indicators (IP, domain, hash)               |

---

## 8. ML ENGINE

- **Algorithm**: MLPClassifier (Multi-Layer Perceptron) — scikit-learn
- **Architecture**: 256 → 128 → 64 → 1 (binary classification)
- **Training Data**: NSL-KDD — 125,973 labeled network traffic records
- **Features**: protocol type, service, flag, src_bytes, dst_bytes, duration, logged_in, serror_rate, same_srv_rate, count, num_compromised + 30 more
- **Preprocessing**: Standard scaler, label encoders for categorical features
- **Output**: `is_threat` (boolean) + `threat_score` (0.0–1.0)
- **Accuracy**: ~77.5% overall, ~97.1% precision
- **Saved artifacts**: `threat_model_sklearn.pkl`, `scaler.pkl`, `encoders.pkl`
- **Fallback**: If model not loaded, URL heuristics-only scoring still works

---

## 9. API ENDPOINTS

### Public
| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| POST   | `/auth/register`            | Register new user                    |
| POST   | `/auth/verify-email`        | Verify email with OTP                |
| POST   | `/auth/login`               | Login with email + password          |
| GET    | `/auth/google`              | Google OAuth redirect                |
| GET    | `/auth/github`              | GitHub OAuth redirect                |
| POST   | `/scan/url`                 | Scan a URL (ghk_ key optional)       |
| POST   | `/scan/device`              | Scan a device/IP (ghk_ key optional) |
| POST   | `/beacon`                   | Fire pageview beacon (ghk_ required) |

### Authenticated (Bearer JWT)
| Method | Endpoint                             | Description                     |
|--------|--------------------------------------|---------------------------------|
| GET    | `/auth/me`                           | Get current user profile        |
| PUT    | `/auth/profile`                      | Update profile                  |
| GET    | `/dashboard/stats`                   | Personal scan statistics        |
| POST   | `/developer/enroll/request`          | Request developer enrollment OTP|
| POST   | `/developer/enroll/verify`           | Verify OTP → become developer   |
| PUT    | `/developer/profile`                 | Update developer profile        |
| GET    | `/developer/projects`                | List projects                   |
| POST   | `/developer/projects/request-key`    | Request OTP for new project     |
| POST   | `/developer/projects`                | Create project (OTP required)   |
| DELETE | `/developer/projects/{id}`           | Delete project                  |
| GET    | `/developer/projects/{id}/analytics` | Project analytics dashboard     |
| GET    | `/devices`                           | List linked devices             |
| POST   | `/devices/link`                      | Link a device                   |
| DELETE | `/devices/{id}`                      | Unlink a device                 |

---

## 10. DEPLOYMENT

| Service    | Platform         | URL                              |
|------------|------------------|----------------------------------|
| Backend    | Render           | https://ghydra-ai.onrender.com   |
| Frontend   | Cloudflare Pages | https://ghydra-ai.pages.dev      |
| Database   | Neon (PostgreSQL)| Managed — connection via env var |
| Email      | Brevo            | Transactional SMTP               |
| ML Model   | Pretrained + bundled with backend on Render              |

### Environment Variables Required
```
Backend (Render):
  DATABASE_URL        — Neon PostgreSQL connection string
  JWT_SECRET_KEY      — Secret for signing JWTs
  BREVO_API_KEY       — Brevo email API key
  FROM_EMAIL          — Sender address for OTP emails
  GOOGLE_CLIENT_ID    — Google OAuth app client ID
  GOOGLE_CLIENT_SECRET— Google OAuth app secret
  GITHUB_CLIENT_ID    — GitHub OAuth app client ID
  GITHUB_CLIENT_SECRET— GitHub OAuth app secret
  FRONTEND_URL        — https://ghydra-ai.pages.dev
  BACKEND_URL         — https://ghydra-ai.onrender.com
  ALLOWED_ORIGINS     — Comma-separated static CORS origins

Frontend (Cloudflare Pages):
  VITE_API_URL        — https://ghydra-ai.onrender.com
```

---

## 11. INTEGRATIONS

### Keyra Password Manager
- Keyra is the first external project integrated with Ghydra
- Uses a `ghk_` project API key stored as `VITE_GHYDRA_KEY` in Cloudflare Pages
- `GhydraBeacon` component in `App.tsx` fires `POST /beacon` on every route change — records page + IP + user agent under Keyra's Ghydra project analytics
- Keyra backend also calls `POST /scan/url` before saving any vault item that contains a URL, flagging phishing/malicious links
- Keyra's project website `https://keyra.pages.dev` is registered in Ghydra → automatically allowed via dynamic CORS

---

## 12. KNOWN LIMITATIONS & PLANNED IMPROVEMENTS

| Item                        | Status          | Notes                                    |
|-----------------------------|-----------------|------------------------------------------|
| User Behaviour Analytics    | Planned (Pro)   | Click tracking, feature usage heatmaps   |
| IP Geolocation              | Partial         | DB column exists, not populated yet      |
| ML model auto-retrain       | Manual only     | Triggered via POST /model/train          |
| In-memory challenge store   | Dev only        | Should use Redis in production           |
| Free tier device limit      | 2 devices       | Enforced server-side                     |
| Subscription billing        | Not implemented | Stripe integration planned               |
| Webhook alerts              | Not implemented | Planned — POST to developer's endpoint on threat |
