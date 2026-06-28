"""FastAPI application entry point."""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import create_tables
<<<<<<< HEAD
from app.core.security import hash_password
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.rate_limiter import RateLimitMiddleware
=======
from app.middleware.error_handler import ErrorHandlerMiddleware
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
from app.routers import (
    achievements,
    admin,
    ai_chat,
<<<<<<< HEAD
    ai_features,
=======
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
    appointments,
    auth,
    availability,
    categories,
    chat,
    coupons,
    favorites,
<<<<<<< HEAD
    calcom,
    invoices,
    loyalty,
=======
    invoices,
    loyalty,
    mcp_tools,
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
    notifications,
    payments,
    providers,
    reminders,
    reviews,
    users,
    waitlist,
<<<<<<< HEAD
    premium,
    integrations,
)
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.user import User, UserRole
=======
)
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

<<<<<<< HEAD
try:
    from app.routers import mcp_tools
except ModuleNotFoundError as exc:  # pragma: no cover - optional local dependency
    mcp_tools = None
    logger.warning("MCP tools router disabled: %s", exc)

=======
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A comprehensive appointment scheduling platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Add middleware
app.add_middleware(ErrorHandlerMiddleware)
<<<<<<< HEAD
=======

from app.middleware.rate_limiter import RateLimitMiddleware
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(providers.router)
app.include_router(availability.router)
app.include_router(appointments.router)
app.include_router(categories.router)
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(favorites.router)
app.include_router(admin.router)
app.include_router(waitlist.router)
app.include_router(loyalty.router)
<<<<<<< HEAD
=======
app.include_router(mcp_tools.router)
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
app.include_router(invoices.router)
app.include_router(chat.router)
app.include_router(coupons.router)
app.include_router(achievements.router)
app.include_router(ai_chat.router)
<<<<<<< HEAD
app.include_router(ai_features.router)
app.include_router(payments.router)
app.include_router(reminders.router)
app.include_router(premium.router)
app.include_router(integrations.router)
app.include_router(calcom.router)
if mcp_tools is not None:
    app.include_router(mcp_tools.router)


lifespan_started = False


async def _startup():
    """Initialize database tables and Redis on startup."""
    logger.info("Starting up Appointment Scheduling Platform...")
    await create_tables()
    from app.core.redis import get_redis
    await get_redis()
    logger.info("Database tables created/verified.")
    await _ensure_demo_auth_users()
    await _run_demo_seed()


async def _ensure_demo_auth_users():
    """Keep the documented demo credentials working across reused local volumes."""
    demo_users = [
        {
            "email": "admin@appointly.com",
            "full_name": "Admin User",
            "password": "Admin@2024",
            "role": UserRole.ADMIN,
            "is_super_admin": True,
        },
        {
            "email": "priya.sharma@email.com",
            "full_name": "Priya Sharma",
            "password": "Demo@1234",
            "role": UserRole.CUSTOMER,
        },
        {
            "email": "dr.arun.kapoor@email.com",
            "full_name": "Dr. Arun Kapoor",
            "password": "Demo@1234",
            "role": UserRole.PROVIDER,
        },
    ]

    async with async_session_maker() as db:
        changed = False
        for demo in demo_users:
            result = await db.execute(select(User).where(User.email == demo["email"]))
            user = result.scalar_one_or_none()
            if user is None:
                db.add(
                    User(
                        email=demo["email"],
                        full_name=demo["full_name"],
                        password_hash=hash_password(demo["password"]),
                        role=demo["role"],
                        is_active=True,
                        is_super_admin=demo.get("is_super_admin", False),
                    )
                )
                changed = True
                continue

            user.full_name = demo["full_name"]
            user.password_hash = hash_password(demo["password"])
            user.role = demo["role"]
            user.is_active = True
            if demo.get("is_super_admin", False):
                user.is_super_admin = True
            changed = True

        if changed:
            await db.commit()


async def _run_demo_seed():
    """Run the full demo seed once — skips automatically if data already exists."""
    try:
        from app.core.database import async_session_maker
        from sqlalchemy import select, func
        from app.models.provider import ServiceProvider
        async with async_session_maker() as db:
            r = await db.execute(select(func.count(ServiceProvider.id)))
            provider_count = int(r.scalar() or 0)
        if provider_count > 0:
            logger.info("Demo seed already applied — skipping.")
            return
        logger.info("Running full demo seed data...")
        import importlib.util, os
        seed_path = os.path.join(os.path.dirname(__file__), "..", "seed.py")
        seed_path = os.path.abspath(seed_path)
        if os.path.exists(seed_path):
            spec = importlib.util.spec_from_file_location("seed", seed_path)
            module = importlib.util.module_from_spec(spec)
            assert spec.loader is not None
            spec.loader.exec_module(module)
            await module.seed_database()
            await module.seed_more_data()
            await module.seed_ai_data()
            logger.info("Full demo seed applied successfully.")
        else:
            logger.warning("seed.py not found — skipping AI seed.")
    except Exception as e:
        logger.warning(f"AI seed skipped due to error: {e}")
=======
app.include_router(payments.router)
app.include_router(reminders.router)
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202


@app.on_event("startup")
async def startup_event():
<<<<<<< HEAD
    await _startup()
=======
    """Initialize database tables and Redis on startup."""
    logger.info("Starting up Appointment Scheduling Platform...")
    await create_tables()
    # Initialize Redis connection
    from app.core.redis import get_redis
    await get_redis()
    logger.info("Database tables created/verified.")
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
<<<<<<< HEAD


@app.get("/ping", tags=["Health"])
async def ping():
    """Lightweight keep-alive endpoint to prevent cold starts."""
    return {"pong": True}
=======
>>>>>>> f959a005532182b2a1b07dffc4ec81caecc28202
