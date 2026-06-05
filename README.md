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
