# Appointment Scheduling Platform

A production-ready, enterprise-level appointment scheduling platform inspired by Cal.com. Built with React (TypeScript) frontend and FastAPI (Python) backend.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **Zustand** for state management
- **Axios** for HTTP requests
- **Lucide React** for icons
- **React Hook Form** + **Zod** for form validation
- **date-fns** for date manipulation
- **React Hot Toast** for notifications

### Backend
- **FastAPI** (Python 3.11+)
- **SQLAlchemy** ORM with async support
- **PostgreSQL** database
- **Alembic** for migrations
- **JWT** authentication (access + refresh tokens)
- **Pydantic v2** for validation
- **bcrypt** for password hashing
- **uvicorn** ASGI server

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- **Nginx** as reverse proxy
- **PostgreSQL** database

## Project Structure

```
appointment-scheduling-platform/
├── frontend/                 # React TypeScript App
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── store/            # Zustand state management
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # Helper utilities
│   │   └── layouts/          # Layout components
│   ├── Dockerfile
│   └── package.json
├── backend/                  # FastAPI Python App
│   ├── app/
│   │   ├── routers/          # API route handlers
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── core/             # Config, security, database
│   │   ├── middleware/       # Custom middleware
│   │   └── utils/            # Shared utilities
│   ├── alembic/              # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
└── README.md
```

## Features

### Authentication & Authorization
- JWT-based authentication with access/refresh tokens
- Role-based access control (Customer, Service Provider, Admin)
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### Customer Features
- Browse and search service providers
- Filter by category, availability, location
- Book appointments with available time slots
- Reschedule or cancel appointments
- View appointment history and status tracking
- Personal dashboard with upcoming appointments

### Service Provider Features
- Profile management with specialization details
- Configurable availability slots (daily/weekly)
- Accept or reject appointment requests
- View daily and upcoming schedules
- Appointment statistics and analytics

### Admin Features
- User and provider management
- Platform-wide appointment monitoring
- Analytics dashboard with key metrics
- Service category management
- System health monitoring

### Scheduling Engine
- Real-time availability checking
- Double-booking prevention
- Time zone support
- Configurable slot durations
- Buffer time between appointments

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

```bash
docker-compose up --build
docker exec appointment_backend python seed.py
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MCP Server: http://localhost:8001/mcp

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## MCP Server

The project includes a read-only Model Context Protocol server for AI clients.
It exposes safe tools that can inspect real AppointEase data without directly
creating, updating, or cancelling appointments.

### Run With Docker

```bash
docker-compose up --build mcp
```

The MCP endpoint will be available at:

```text
http://localhost:8001/mcp
```

### Run Locally

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://postgres:<password>@localhost:5432/appointment_db"
python -m app.mcp_server
```

### Check It

The easiest way to inspect the server is the official MCP Inspector:

```bash
npx -y @modelcontextprotocol/inspector
```

In the Inspector UI, connect to:

```text
http://localhost:8001/mcp
```

Available tools include:

- `health_check`
- `list_categories`
- `search_providers`
- `get_provider_details`
- `get_provider_availability`
- `get_customer_summary`
- `get_recent_appointments`
- `get_platform_overview`
- `search_project_knowledge`

### Check It In The Live App

After logging in, open the floating **AppointEase AI** chat widget. The header
shows whether the MCP bridge is connected. Ask:

```text
MCP status
```

For customers, provider search and slot lookup inside the chat booking flow now
use the MCP bridge:

```text
Book a doctor in Delhi
```

The live app flow is:

```text
React chatbot -> FastAPI /api/mcp-tools -> MCP tool functions -> PostgreSQL
```

## Super Admin Document RAG

Provider onboarding documents can be reviewed with an admin-only RAG assistant.
This is separate from the normal chatbot and appears only for users with
`is_super_admin=true`.

Flow:

```text
Provider uploads documents
-> Super admin opens /admin/approvals
-> Expand a pending provider
-> Index docs or ask a question
-> Backend extracts text, chunks it, creates embeddings, searches relevant chunks
-> AI answers with citations and risk flags
```

The demo admin is marked as super admin:

```text
admin@appointly.com / admin123456
```

The RAG endpoints are:

```text
POST /api/admin/providers/{provider_id}/document-ai/reindex
POST /api/admin/providers/{provider_id}/document-ai/ask
```

The implementation stores embeddings in PostgreSQL as JSON by default so local
development works with the current `postgres:15-alpine` image. It is pgvector
ready: switch to a Postgres image with the `vector` extension and set
`ENABLE_PGVECTOR=true` for a real vector column path.

## Demo Credentials

Run `backend/seed.py` to create the demo users below.

### Admin

| Email | Password |
|-------|----------|
| admin@appointly.com | admin123456 |

### Customers

All customer accounts use password `password123`.

| Name | Email |
|------|-------|
| Priya Sharma | priya.sharma@email.com |
| Amit Patel | amit.patel@email.com |
| Sneha Reddy | sneha.reddy@email.com |
| Vikram Singh | vikram.singh@email.com |
| Ananya Iyer | ananya.iyer@email.com |
| Rohan Gupta | rohan.gupta@email.com |
| Kavita Nair | kavita.nair@email.com |
| Arjun Mehta | arjun.mehta@email.com |
| Deepika Joshi | deepika.joshi@email.com |
| Sanjay Verma | sanjay.verma@email.com |

### Providers

All provider accounts use password `password123`.

| Name | Email | Demo Profile |
|------|-------|--------------|
| Dr. Arun Kapoor | dr.arun.kapoor@email.com | General Medicine, Mumbai, INR 2500/hr |
| Dr. Meera Shah | dr.meera.shah@email.com | Dermatology, Delhi, INR 3500/hr |
| Neha Kapoor | neha.beauty@email.com | Hair Styling, Bangalore, INR 1500/hr |
| Swami Raghav | swami.raghav@email.com | Yoga & Meditation, Hyderabad, INR 800/hr |
| Prof. Suresh Iyer | prof.suresh.iyer@email.com | Maths Tutoring, Chennai, INR 1200/hr |
| Manish Tiwari | manish.tiwari@email.com | UPSC Coaching, Pune, INR 2000/hr |
| Adv. Sunita Desai | adv.sunita.desai@email.com | Property Law, Kolkata, INR 5000/hr |
| Ritu Malhotra | ritu.malhotra@email.com | Interior Design, Ahmedabad, INR 3000/hr |

The seed script also creates additional generated provider accounts using the pattern
`<category>-<specialization>-<number>@providers.appointease.test`, all with password
`password123`.

## License

MIT
