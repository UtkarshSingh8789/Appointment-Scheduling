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
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

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

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@scheduleapp.com | admin123 |
| Provider | provider@scheduleapp.com | provider123 |
| Customer | customer@scheduleapp.com | customer123 |

## License

MIT
