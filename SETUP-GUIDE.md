# AppointEase — Complete Setup Guide (Things YOU Need to Do)

> This document lists EVERYTHING you need to configure from your side
> to make all platform features fully operational — covering V1, V2, and V3 features.
> Last updated: May 30, 2026

---

## 🚀 RUN IT IMMEDIATELY (Zero Config)

The platform runs **fully out of the box** — no API keys or external accounts required:

```bash
cd appointment-scheduling-platform
docker compose up --build -d        # start db + backend + frontend + nginx
docker exec appointment_backend python seed.py   # seed demo data (first run only)
```

Then open **http://localhost:3000**. Log in with any seeded account (see "Login Credentials" below).

Everything in the "Already Working" list functions without setup. The items under
"Requires Your Setup" are **optional external integrations** (real email delivery, live
payments) — the app degrades gracefully without them (e.g. emails are logged to the
backend console, the forgot-password flow returns the token in the response for testing).

---

## ✅ ALREADY WORKING (No Setup Needed)

These features work out of the box right now:

| Feature | Status |
|---------|--------|
| User Registration & Login | ✅ Working |
| JWT Authentication (access + refresh tokens) | ✅ Working |
| Role-based access (Customer/Provider/Admin) | ✅ Working |
| Provider Listings with search/filter | ✅ Working |
| Advanced Search with Autocomplete & Filters | ✅ Working |
| Appointment Booking with slot validation | ✅ Working |
| Multi-step Booking Wizard | ✅ Working |
| Double-booking prevention | ✅ Working |
| Appointment status management | ✅ Working |
| Appointment Status Tracker (package-tracking style) | ✅ Working |
| Confirmation Dialogs (cancel, reject, delete) | ✅ Working |
| Notifications (in-app) | ✅ Working |
| Interactive Notification Center (slide-out panel) | ✅ Working |
| Reviews & Ratings | ✅ Working |
| Favorites | ✅ Working |
| Dark Mode | ✅ Working |
| Command Palette (Cmd+K) | ✅ Working |
| Availability Management | ✅ Working |
| Drag-and-Drop Schedule Builder | ✅ Working |
| Multi-View Calendar (Month/Week/Agenda) | ✅ Working |
| Availability Exceptions (holidays) | ✅ Working |
| Provider Vacation Mode | ✅ Working |
| Provider Public Profile (shareable /p/:id) | ✅ Working |
| Provider Onboarding Wizard | ✅ Working |
| Provider Comparison Feature | ✅ Working |
| Appointment Comments | ✅ Working |
| Appointment Timeline | ✅ Working |
| Audit Logs | ✅ Working |
| Admin Dashboard with Charts | ✅ Working |
| Admin User Management | ✅ Working |
| Admin Category Management | ✅ Working |
| Admin Broadcast Notifications | ✅ Working |
| Password Reset (token-based) | ✅ Working |
| Loyalty Points System | ✅ Working |
| Wallet Page (points balance, redeem, history) | ✅ Working |
| Rewards & Achievements (Gamification) | ✅ Working |
| Coupon & Promo Code System | ✅ Working |
| Waitlist System | ✅ Working |
| In-App Chat (per appointment) | ✅ Working |
| Invoice Generation (GST) | ✅ Working |
| Invoices Page (billing history, GST breakdown) | ✅ Working |
| Provider Earnings Dashboard | ✅ Working |
| Appointment Export (CSV + iCal) | ✅ Working |
| Cancellation Analytics | ✅ Working |
| Settings Page (Profile, Notifications, Theme, Security) | ✅ Working |
| Grouped Sidebar Navigation (role-based sections) | ✅ Working |
| Universal Search (pages, providers, features) | ✅ Working |
| Confirmation Dialogs (approve / reject / complete / delete / logout / redeem) | ✅ Working |
| Light & Dark Theme (full contrast, both modes) | ✅ Working |
| SMTP Email Service (backend, logs when unconfigured) | ✅ Working |
| INR Currency (₹) | ✅ Working |
| Indian Cities & Context | ✅ Working |
| Mobile Bottom Navigation | ✅ Working |
| Page Animations (Framer Motion) | ✅ Working |
| Loading Skeletons | ✅ Working |
| Error Boundary | ✅ Working |

---

## 🔧 REQUIRES YOUR SETUP

### 1. Email Notifications (Nodemailer via SMTP)
**What it enables:** Email verification, password reset emails, appointment reminders

**Steps:**
1. Choose an SMTP provider (Gmail, Outlook, Mailtrap for testing, or any SMTP server)
2. For Gmail: Enable "App Passwords" at https://myaccount.google.com/apppasswords
3. Add to `backend/.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=noreply@yourdomain.com
   ```
4. For testing, use Mailtrap (free: 100 emails/month):
   - Sign up at https://mailtrap.io
   - Get SMTP credentials from your inbox settings
   ```
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-user
   SMTP_PASS=your-mailtrap-pass
   ```
5. Install: `pip install aiosmtplib email-mime-multipart` (backend)
6. Frontend email service uses the backend API — no frontend package needed.
7. Currently, the forgot-password endpoint returns the token in the response (for testing).
   In production, it should send an email instead.

---

### 2. Razorpay Payments (INR)
**What it enables:** Collect payments at booking, refunds on cancellation

**Steps:**
1. Go to https://razorpay.com and sign up
2. Go to Settings → API Keys → Generate Key
3. Add to `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
   ```
4. Add to `frontend/.env`:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   ```
5. Install Razorpay SDK: `pip install razorpay` (in backend)
6. Add Razorpay checkout script to `frontend/index.html`:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```

---

---

### 4. Google OAuth (Social Login)
**What it enables:** "Sign in with Google" button on login page

**Steps:**
1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Set Authorized redirect URI: `http://localhost:8000/api/auth/google/callback`
5. Add to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
   ```
6. Install: `pip install authlib httpx`

---

### 5. Google Calendar Sync
**What it enables:** Auto-create calendar events on booking

**Steps:**
1. In Google Cloud Console, enable the Google Calendar API
2. Create OAuth 2.0 credentials (same project as above)
3. Add Calendar scope: `https://www.googleapis.com/auth/calendar.events`
4. Add to `backend/.env`:
   ```
   GOOGLE_CALENDAR_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
   ```

---

### 6. File Uploads (Cloudinary)
**What it enables:** Provider portfolio images, profile photos, documents

**Steps:**
1. Your Cloudinary credentials are already in MCP config!
2. Enable the Cloudinary MCP server (change `"disabled": true` → `false`)
3. Add to `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
4. Install: `pip install cloudinary`

---

### 7. Error Monitoring (Sentry)
**What it enables:** Track production errors, performance monitoring

**Steps:**
1. Your Sentry token is already configured in MCP!
2. Add to `backend/.env`:
   ```
   SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
   ```
3. Add to `frontend/.env`:
   ```
   VITE_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
   ```
4. Install: `pip install sentry-sdk[fastapi]` (backend)
5. Install: `npm install @sentry/react` (frontend)

---

### 8. Redis (Caching & Background Tasks)
**What it enables:** API response caching, rate limiting, Celery task queue

**Steps:**
1. Add Redis to `docker-compose.yml`:
   ```yaml
   redis:
     image: redis:7-alpine
     container_name: appointment_redis
     ports:
       - "6379:6379"
     networks:
       - app-network
   ```
2. Add to `backend/.env`:
   ```
   REDIS_URL=redis://redis:6379/0
   ```
3. Install: `pip install redis celery[redis]`
4. Enable Redis MCP server (change `"disabled": true` → `false`)

---

### 9. Brave Search (Web Search MCP)
**What it enables:** AI-powered web search within Kiro

**Steps:**
1. Go to https://brave.com/search/api/
2. Sign up for free tier (2000 queries/month)
3. Get your API key
4. Edit `.kiro/settings/mcp.json`:
   - Replace `YOUR_BRAVE_API_KEY` with your key
   - Change `"disabled": true` to `"disabled": false`

---

### 10. Neon Database (Serverless Postgres)
**What it enables:** Cloud-hosted PostgreSQL for production deployment

**Steps:**
1. Your Neon API key is already configured!
2. To use Neon instead of local PostgreSQL:
   - Create a database at https://neon.tech
   - Get the connection string
   - Update `DATABASE_URL` in docker-compose.yml or backend .env

---

## 📋 QUICK SETUP CHECKLIST

```
□ SMTP credentials for Nodemailer (for emails)
□ Razorpay keys (for payments)
□ Google OAuth credentials (for social login)
□ Google Calendar API enabled (for calendar sync)
□ Cloudinary enabled in MCP (already has keys)
□ Sentry DSN (for error monitoring)
□ Redis container added (for caching)
□ Brave Search API key (for web search MCP)
```

---

## 🚀 RUNNING THE PLATFORM

```bash
# Start everything
cd appointment-scheduling-platform
docker-compose up --build -d

# Seed the database (first time only)
docker exec appointment_backend python seed.py

# Access the app
open http://localhost:3000
```

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@appointly.com | admin123456 |
| **Customer** | priya.sharma@email.com | password123 |
| **Provider** | dr.arun.kapoor@email.com | password123 |

### URLs
| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| Nginx Proxy | http://localhost:80 |

---

## 📊 PLATFORM STATS

| Metric | Count |
|--------|-------|
| API Endpoints | 79 |
| Backend Python Files | 56+ |
| Frontend TypeScript Files | 75+ |
| Database Tables | 19 |
| Sample Users | 19 |
| Sample Appointments | 25 |
| Sample Reviews | 14 |

---

*Last updated: May 28, 2026*

---

## 🆕 V3 FEATURES — ADDITIONAL SETUP REQUIRED

### 11. OpenAI / Google Gemini API (AI Features)
**What it enables:** AI scheduling assistant, chatbot, review summaries, smart recommendations

**Steps:**
1. Go to https://platform.openai.com → Sign up → API Keys
2. Or go to https://aistudio.google.com → Get Gemini API key
3. Add to `backend/.env`:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
   # OR
   GOOGLE_GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxx
   ```
4. Install: `pip install openai` or `pip install google-generativeai`
5. Free tier: OpenAI ($5 credit), Gemini (free tier available)

---

### 12. Elasticsearch / Meilisearch (Advanced Search)
**What it enables:** Full-text search, autocomplete, typo tolerance, faceted filtering

**Steps:**
1. Add to `docker-compose.yml`:
   ```yaml
   elasticsearch:
     image: elasticsearch:8.12.0
     environment:
       - discovery.type=single-node
       - xpack.security.enabled=false
     ports:
       - "9200:9200"
     networks:
       - app-network
   ```
   OR use Meilisearch (lighter):
   ```yaml
   meilisearch:
     image: getmeili/meilisearch:v1.6
     ports:
       - "7700:7700"
     networks:
       - app-network
   ```
2. Add to `backend/.env`:
   ```
   ELASTICSEARCH_URL=http://elasticsearch:9200
   # OR
   MEILISEARCH_URL=http://meilisearch:7700
   MEILISEARCH_API_KEY=masterKey
   ```
3. Install: `pip install elasticsearch` or `pip install meilisearch`

---

### 13. RabbitMQ (Message Queue for Microservices)
**What it enables:** Event-driven architecture, reliable message delivery, service decoupling

**Steps:**
1. Add to `docker-compose.yml`:
   ```yaml
   rabbitmq:
     image: rabbitmq:3-management-alpine
     ports:
       - "5672:5672"
       - "15672:15672"
     environment:
       RABBITMQ_DEFAULT_USER: admin
       RABBITMQ_DEFAULT_PASS: admin123
     networks:
       - app-network
   ```
2. Add to `backend/.env`:
   ```
   RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672/
   ```
3. Install: `pip install aio-pika`
4. Management UI: http://localhost:15672 (admin/admin123)

---

### 14. Mixpanel / PostHog (Product Analytics)
**What it enables:** User behavior tracking, funnel analysis, retention metrics

**Steps:**
1. Go to https://posthog.com → Sign up (free: 1M events/month)
   OR https://mixpanel.com → Sign up (free: 20M events/month)
2. Get your project token/API key
3. Add to `frontend/.env`:
   ```
   VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```
4. Install: `npm install posthog-js`

---

### 15. Datadog / Grafana Cloud (Monitoring & APM)
**What it enables:** Application performance monitoring, error tracking, infrastructure metrics

**Steps:**
1. Go to https://grafana.com/products/cloud/ → Sign up (free: 10K metrics)
   OR https://www.datadoghq.com → Sign up (free: 5 hosts)
2. Get API key and app key
3. Add to `backend/.env`:
   ```
   DD_API_KEY=xxxxxxxxxxxxxxxxxxxxx
   DD_APP_KEY=xxxxxxxxxxxxxxxxxxxxx
   # OR for Grafana
   GRAFANA_CLOUD_API_KEY=xxxxxxxxxxxxxxxxxxxxx
   ```
4. Install: `pip install ddtrace` or use Prometheus + Grafana (self-hosted, free)

---

---

### 17. Aadhaar Verification (DigiLocker API)
**What it enables:** Government ID verification for providers and patients

**Steps:**
1. Go to https://partners.digilocker.gov.in → Apply for API access
2. Get Client ID and Client Secret (requires business registration)
3. Add to `backend/.env`:
   ```
   DIGILOCKER_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
   DIGILOCKER_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
   DIGILOCKER_REDIRECT_URI=http://localhost:8000/api/auth/digilocker/callback
   ```
4. Note: Requires registered business entity (LLP/Pvt Ltd)

---

### 18. Daily.co / Twilio Video (Video Consultations)
**What it enables:** Built-in video calling for virtual appointments

**Steps:**
1. Go to https://www.daily.co → Sign up (free: 10,000 participant minutes/month)
   OR https://www.twilio.com/video → Sign up
2. Get API key
3. Add to `backend/.env`:
   ```
   DAILY_API_KEY=xxxxxxxxxxxxxxxxxxxxx
   # OR
   TWILIO_VIDEO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
   TWILIO_VIDEO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
   ```
4. Install: `pip install daily-python` or `pip install twilio`
5. Frontend: `npm install @daily-co/daily-js`

---

### 19. Zapier Webhook (Integration Platform)
**What it enables:** Connect AppointEase to 5000+ apps without code

**Steps:**
1. No API key needed from Zapier side
2. Implement webhook endpoints in backend (already partially done)
3. Register your app on https://developer.zapier.com (for public listing)
4. Provide webhook URL format: `https://yourdomain.com/api/webhooks/zapier`
5. Document triggers and actions for Zapier app review

---

### 20. Vercel / AWS Deployment (Production)
**What it enables:** Production deployment with custom domain, SSL, CDN

**Steps for Vercel (Frontend):**
1. Push frontend to GitHub
2. Go to https://vercel.com → Import project
3. Set environment variables in Vercel dashboard
4. Custom domain: Add CNAME record pointing to `cname.vercel-dns.com`

**Steps for AWS (Backend):**
1. Create ECR repository, push Docker image
2. Create ECS Fargate cluster
3. Set up ALB (Application Load Balancer)
4. Create RDS PostgreSQL instance
5. Create ElastiCache Redis instance
6. Set up Route 53 for DNS
7. ACM certificate for SSL

**Steps for Railway (Simpler alternative):**
1. Go to https://railway.app → Connect GitHub
2. Deploy backend + PostgreSQL + Redis in one click
3. Custom domain with automatic SSL
4. Free tier: $5/month credit

---

## 📋 COMPLETE SETUP CHECKLIST

### Priority 1 — Essential (Do These First)
```
□ SMTP credentials (emails via Nodemailer) — 5 min setup
□ Razorpay keys (payments) — 10 min setup
□ Redis container in docker-compose — 2 min setup
□ Cloudinary enabled in MCP (already has keys) — 1 min
□ Sentry enabled (already has token) — 1 min
```

### Priority 2 — Important (Do Within First Week)
```
□ Google OAuth credentials — 10 min setup
□ Google Calendar API enabled — 5 min setup
□ OpenAI or Gemini API key (AI features) — 5 min setup
□ Brave Search API key — 3 min setup
```

### Priority 3 — Nice to Have (Do When Needed)
```
□ Elasticsearch/Meilisearch container — 5 min setup
□ RabbitMQ container — 5 min setup
□ PostHog/Mixpanel (analytics) — 10 min setup
□ Daily.co (video calls) — 5 min setup
□ Datadog/Grafana (monitoring) — 15 min setup
□ DigiLocker API (Aadhaar verification) — Requires business registration
□ Zapier developer account — 30 min setup
□ Production deployment (Vercel/AWS/Railway) — 1-2 hours
```

### Priority 4 — Enterprise (When Scaling)
```
□ Kubernetes cluster (EKS/GKE)
□ Multi-region deployment
□ HIPAA compliance audit
□ SOC 2 certification
□ Custom domain + SSL
□ CDN configuration
□ Database read replicas
□ Load testing infrastructure
```

---

## 🔑 MCP SERVERS STATUS

| Server | Status | Action Needed |
|--------|--------|---------------|
| Filesystem | ✅ Active | None |
| PostgreSQL | ✅ Active | None |
| Puppeteer | ✅ Active | None |
| Playwright | ✅ Active | None |
| GitHub | ✅ Active | None |
| Context7 | ✅ Active | None |
| Figma | ✅ Active | None |
| Firecrawl | ✅ Active | None |
| Docker | ✅ Active | None |
| Shadcn/UI | ✅ Active | None |
| Cloudinary | ✅ Active | None |
| Sentry | ✅ Active | None |
| Neon | ✅ Active | None |
| Memory | ✅ Active | None |
| Sequential Thinking | ✅ Active | None |
| Fetch | ✅ Active | None |
| Git | ✅ Active | None |
| Time | ✅ Active | None |
| SQLite | ✅ Active | None |
| Everything | ✅ Active | None |
| Stitch | ✅ Active | None |
| Brave Search | ❌ Disabled | Add API key |
| Todoist | ❌ Disabled | Add API key |
| Slack | ❌ Disabled | Add API key |
| Linear | ❌ Disabled | Add API key |

---

*Last updated: May 28, 2026*
*Platform version: 3.0*
*Total API endpoints: 79*
*Total features implemented: 50+ (V1+V2)*
*Total features planned: 150+ (V3)*
