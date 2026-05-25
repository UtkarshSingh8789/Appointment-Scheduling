# AppointEase — Appointment Scheduling Platform

A production-ready, full-stack appointment scheduling platform built with **React** (Vite) and **FastAPI** (Python).

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication (access + refresh tokens)
- Role-based access control: Customer, Service Provider, Admin
- Secure password hashing with bcrypt

### 👤 Customer Features
- Browse and search service providers
- Filter by category, location, availability
- Multi-step booking wizard (Date → Time → Confirm)
- View appointment history with status tracking
- Cancel appointments

### 🏥 Service Provider Features
- Manage professional profile
- Configure weekly availability schedules
- Accept/reject/complete appointment requests
- View daily and upcoming schedules
- Appointment statistics

### ⚙️ Admin Features
- Platform statistics dashboard with charts
- User management (activate/deactivate)
- Monitor all appointments
- Category management (CRUD)

### 📅 Appointment System
- Smart slot generation from availability
- Double-booking prevention (DB + service layer)
- Status workflow: Pending → Confirmed → Completed
- Reschedule and cancellation support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, Axios, date-fns |
| Backend | FastAPI, SQLAlchemy, Pydantic, python-jose |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens), bcrypt |
| Deployment | Docker, Docker Compose, Nginx |

## Quick Start

### With Docker (Recommended)
```bash
cp .env.example .env
docker-compose up --build
```
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
cp .env.example .env
python3.11 -m venv venv
source venv/bin/activate   # macOS / Linux
# venv\Scripts\activate    # Windows
pip install -r requirements.txt
# Update backend/.env if you want PostgreSQL instead of SQLite
python seed.py             # Seed sample data
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

**Mailer (optional but recommended for real email delivery):**
```bash
cd mailer
cp .env.example .env
npm install
npm start
```

## Environment Files

The repo now includes starter env files:

- `.env.example` for Docker Compose
- `backend/.env.example`
- `frontend/.env.example`
- `mailer/.env.example`

Copy each one to `.env` before running locally.

## Google Auth Setup

AppointEase uses Google Identity Services on the frontend and verifies the returned ID token in FastAPI.

### 1. Create a Google OAuth client

In Google Cloud Console:

1. Create or select a project
2. Configure the OAuth consent screen
3. Create an **OAuth 2.0 Client ID** of type **Web application**
4. Add these **Authorized JavaScript origins** for local work:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - `http://localhost:3000`
5. Copy the client ID

### 2. Add the client ID to both frontend and backend

Set the same value in:

- `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`
- `backend/.env` as `GOOGLE_CLIENT_ID`

For Docker Compose, set `GOOGLE_CLIENT_ID` in the root `.env`.

### 3. What the app already does

- Frontend renders the Google sign-in button
- Frontend sends the Google credential to `POST /api/v1/auth/google`
- Backend verifies the token with Google using `GOOGLE_CLIENT_ID`
- Backend creates or signs in the user and returns JWT access + refresh tokens

## Mailer / Nodemailer Setup

The mailer service supports three modes:

1. `console` mode when no SMTP variables are set
2. `smtp` mode with `SMTP_USER` + `SMTP_PASS`
3. `oauth2` mode with `SMTP_CLIENT_ID` + `SMTP_CLIENT_SECRET` + `SMTP_REFRESH_TOKEN` + `SMTP_USER`

### Option A: SMTP username/password

Set these in the root `.env` for Docker, or `mailer/.env` for local mailer runs:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailbox@yourdomain.com
SMTP_PASS=your-app-password-or-smtp-password
MAIL_FROM=AppointEase <no-reply@yourdomain.com>
```

### Option B: Gmail / Google Workspace OAuth2

1. Enable the **Gmail API** in Google Cloud
2. Reuse or create an OAuth client
3. Generate a refresh token for the mailbox account using the scope:
   - `https://mail.google.com/`
4. Set:

```bash
SMTP_USER=your-mailbox@yourdomain.com
SMTP_CLIENT_ID=your-google-client-id
SMTP_CLIENT_SECRET=your-google-client-secret
SMTP_REFRESH_TOKEN=your-refresh-token
MAIL_FROM=AppointEase <no-reply@yourdomain.com>
```

The Docker Compose file now passes the OAuth2 mailer variables through to the Node mailer container.

### Backend notification settings

Set these in `backend/.env` or the Docker environment:

```bash
MAILER_URL=http://localhost:3001/send
MAIL_FROM=AppointEase <no-reply@yourdomain.com>
NOTIFICATIONS_ENABLED=true
```

In Docker Compose, the backend uses `http://mailer:3001/send`.

### How to confirm it works

1. Start the mailer
2. Open `http://localhost:3001/health`
3. Register a new user or use Google sign-up
4. Confirm that welcome emails or appointment emails are sent successfully

If no SMTP credentials are present, the mailer falls back to console mode and prints emails to the server logs.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@appointease.com | admin123 |
| Customer | john@example.com | password123 |
| Provider | alice@example.com | password123 |

## API Documentation

Once the backend is running, visit: http://localhost:8000/docs

### Key Endpoints
- `POST /api/v1/auth/register` — Register
- `POST /api/v1/auth/login` — Login
- `GET /api/v1/providers` — List providers
- `POST /api/v1/appointments` — Book appointment
- `GET /api/v1/admin/stats` — Platform stats

## Project Structure

```
appointment-scheduling-platform/
├── .env.example               # Docker Compose environment template
├── .gitignore                 # Local artifact exclusions
├── frontend/                  # React (Vite) app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # Auth context
│   │   ├── pages/             # All page components
│   │   ├── services/          # API client
│   │   ├── App.jsx            # Router
│   │   └── main.jsx           # React entry point
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                   # FastAPI app
│   ├── app/
│   │   ├── api/v1/            # Route handlers
│   │   ├── core/              # Config, security, deps
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── main.py            # Entry point
│   ├── seed.py                # Database seeder
│   ├── Dockerfile
│   └── requirements.txt
├── mailer/                    # Optional Nodemailer service
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── start.sh
└── README.md
```

## License

MIT
# AppointEase
