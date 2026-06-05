"""Admin router."""

from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import get_admin_user
from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import NotificationType
from app.models.provider import ServiceProvider
from app.models.review import Review
from app.models.service_category import ServiceCategory
from app.models.invoice import Invoice
from app.models.user import User, UserRole
from app.schemas.appointment import AppointmentListResponse
from app.schemas.audit_log import AuditLogListResponse
from app.schemas.service_category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)
from app.schemas.provider import ProviderResponse
from app.schemas.provider import OnboardingDocument, ProviderApprovalResponse
from app.schemas.user import UserListResponse, UserResponse
from app.services.admin_service import AdminService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.services.user_service import UserService

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class UserStatusUpdate(BaseModel):
    """Schema for updating user status via JSON body."""

    is_active: bool


class BroadcastRequest(BaseModel):
    """Schema for broadcasting a notification."""

    target: str  # "all", "customers", "providers"
    title: str
    message: str


class AdminUserDetailResponse(BaseModel):
    """Schema for admin user detail view."""

    user: UserResponse
    provider: Optional[ProviderResponse] = None


class ProviderApprovalRequest(BaseModel):
    """Schema for approving or rejecting a provider application."""

    action: str  # approve | reject
    reason: Optional[str] = None


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List all users",
)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and search. Admin only."""
    service = UserService(db)
    result = await service.get_users(
        page=page, per_page=per_page, search=search, role=role
    )
    return result


@router.get(
    "/users/{user_id}",
    response_model=AdminUserDetailResponse,
    summary="Get user details",
)
async def get_user_details(
    user_id: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user's details for admin review."""
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)

    provider_result = await db.execute(
        select(ServiceProvider)
        .options(
            joinedload(ServiceProvider.user),
            joinedload(ServiceProvider.category),
        )
        .where(ServiceProvider.user_id == user_id)
    )
    provider = provider_result.scalar_one_or_none()

    return AdminUserDetailResponse(user=user, provider=provider)


@router.put(
    "/users/{user_id}/status",
    response_model=UserResponse,
    summary="Activate/deactivate user",
)
async def update_user_status(
    user_id: UUID,
    data: UserStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a user account. Admin only. Soft-deletes providers."""
    service = AdminService(db)
    user = await service.deactivate_provider_soft(user_id, data.is_active)
    return user


@router.get(
    "/stats",
    summary="Get platform statistics",
)
async def get_platform_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide statistics. Admin only."""
    service = AdminService(db)
    stats = await service.get_platform_stats()
    return stats


@router.get(
    "/appointments",
    response_model=AppointmentListResponse,
    summary="List all appointments",
)
async def list_all_appointments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[AppointmentStatus] = None,
    provider_id: Optional[UUID] = None,
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all appointments with filters. Admin only."""
    service = AdminService(db)
    result = await service.get_all_appointments(
        page=page,
        per_page=per_page,
        status_filter=status,
        provider_id=provider_id,
        category_id=category_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )
    return result


@router.get(
    "/providers/pending",
    response_model=List[ProviderApprovalResponse],
    summary="List pending provider applications",
)
async def list_pending_providers(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all providers awaiting approval. Admin only."""
    service = AdminService(db)
    providers = await service.get_pending_providers()
    return [
        ProviderApprovalResponse(
            provider=item["provider"],
            avatar=item.get("avatar"),
            documents=[OnboardingDocument(**doc) for doc in item.get("documents", [])],
            application=item.get("application"),
            summary=item.get("summary"),
        )
        for item in providers
    ]


@router.post(
    "/providers/{provider_id}/approval",
    response_model=ProviderResponse,
    summary="Approve or reject a provider application",
)
async def update_provider_approval(
    provider_id: UUID,
    data: ProviderApprovalRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a provider onboarding application. Admin only."""
    service = AdminService(db)
    approve = data.action.lower() == "approve"
    provider = await service.update_provider_approval(
        provider_id=provider_id,
        approve=approve,
        reason=data.reason,
    )
    return provider


@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    summary="Get audit logs",
)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get audit logs with optional filters. Admin only."""
    service = AuditService(db)
    result = await service.get_audit_logs(
        page=page,
        size=size,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
    )
    return result


@router.get(
    "/analytics/cancellations",
    summary="Get cancellation analytics",
)
async def get_cancellation_analytics(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get cancellation reasons breakdown. Admin only."""
    result = await db.execute(
        select(
            Appointment.cancellation_reason,
            func.count(Appointment.id),
        )
        .where(Appointment.status == AppointmentStatus.CANCELLED)
        .group_by(Appointment.cancellation_reason)
    )
    rows = result.all()

    reasons = []
    total_cancellations = 0
    for reason, count in rows:
        total_cancellations += count
        reasons.append({
            "reason": reason or "No reason provided",
            "count": count,
        })

    return {
        "total_cancellations": total_cancellations,
        "reasons": reasons,
    }


@router.post(
    "/broadcast",
    summary="Broadcast notification",
)
async def broadcast_notification(
    data: BroadcastRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a notification to all users, customers, or providers. Admin only."""
    # Get target users
    query = select(User).where(User.is_active == True)

    if data.target == "customers":
        query = query.where(User.role == UserRole.CUSTOMER)
    elif data.target == "providers":
        query = query.where(User.role == UserRole.PROVIDER)
    # "all" sends to everyone

    result = await db.execute(query)
    users = result.scalars().all()

    notification_service = NotificationService(db)
    count = 0
    for user in users:
        await notification_service.create_notification(
            user_id=user.id,
            type=NotificationType.SYSTEM,
            title=data.title,
            message=data.message,
        )
        count += 1

    return {"message": f"Notification sent to {count} users"}


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=201,
    summary="Create service category",
)
async def create_category(
    data: CategoryCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new service category. Admin only."""
    service = AdminService(db)
    category = await service.create_category(data)
    return category


@router.put(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="Update service category",
)
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a service category. Admin only."""
    service = AdminService(db)
    category = await service.update_category(category_id, data)
    return category


@router.delete(
    "/categories/{category_id}",
    status_code=204,
    summary="Delete service category",
)
async def delete_category(
    category_id: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a service category. Admin only."""
    service = AdminService(db)
    await service.delete_category(category_id)


@router.get(
    "/categories",
    response_model=List[CategoryResponse],
    summary="List all categories (admin)",
)
async def list_categories(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all categories including inactive ones. Admin only."""
    service = AdminService(db)
    categories = await service.list_categories()
    return categories


@router.get(
    "/reports",
    summary="Get platform reports data",
)
async def get_reports(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get comprehensive platform reports. Admin only."""
    from datetime import datetime, timedelta

    service = AdminService(db)
    stats = await service.get_platform_stats()

    # Revenue data (from invoices)
    from app.models.invoice import Invoice
    revenue_result = await db.execute(
        select(func.sum(Invoice.total_amount))
    )
    total_revenue = revenue_result.scalar() or 0

    # Monthly appointment trends (last 6 months)
    monthly_data = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        if i > 0:
            month_end = (now.replace(day=1) - timedelta(days=(i - 1) * 30)).replace(day=1)
        else:
            month_end = now

        result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.created_at >= month_start,
                Appointment.created_at < month_end,
            )
        )
        count = result.scalar() or 0
        monthly_data.append({
            "month": month_start.strftime("%b %Y"),
            "appointments": count,
        })

    # Top providers by appointments
    top_providers_result = await db.execute(
        select(
            ServiceProvider.specialization,
            ServiceProvider.location,
            func.count(Appointment.id).label("total"),
        )
        .join(Appointment, Appointment.provider_id == ServiceProvider.id)
        .group_by(ServiceProvider.id, ServiceProvider.specialization, ServiceProvider.location)
        .order_by(func.count(Appointment.id).desc())
        .limit(10)
    )
    top_providers = [
        {"name": row[0] or "Unknown", "service": row[1] or "N/A", "appointments": row[2]}
        for row in top_providers_result.all()
    ]

    # Category distribution
    category_dist_result = await db.execute(
        select(
            ServiceCategory.name,
            func.count(ServiceProvider.id).label("providers"),
        )
        .outerjoin(ServiceProvider, ServiceProvider.category_id == ServiceCategory.id)
        .group_by(ServiceCategory.id, ServiceCategory.name)
        .order_by(func.count(ServiceProvider.id).desc())
    )
    category_distribution = [
        {"category": row[0], "providers": row[1]}
        for row in category_dist_result.all()
    ]

    # User growth (new users per week for last 8 weeks)
    user_growth = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)
        result = await db.execute(
            select(func.count(User.id)).where(
                User.created_at >= week_start,
                User.created_at < week_end,
            )
        )
        count = result.scalar() or 0
        user_growth.append({
            "week": week_start.strftime("%b %d"),
            "new_users": count,
        })

    # Completion rate
    total_appts = stats.get("total_appointments", 0) if isinstance(stats, dict) else getattr(stats, "total_appointments", 0)
    completed_appts = stats.get("completed_appointments", 0) if isinstance(stats, dict) else getattr(stats, "completed_appointments", 0)
    completion_rate = (completed_appts / total_appts * 100) if total_appts > 0 else 0

    # Cancellation rate
    cancelled_appts = stats.get("cancelled_appointments", 0) if isinstance(stats, dict) else getattr(stats, "cancelled_appointments", 0)
    cancellation_rate = (cancelled_appts / total_appts * 100) if total_appts > 0 else 0

    return {
        "total_revenue": float(total_revenue),
        "completion_rate": round(completion_rate, 1),
        "cancellation_rate": round(cancellation_rate, 1),
        "monthly_appointments": monthly_data,
        "top_providers": top_providers,
        "category_distribution": category_distribution,
        "user_growth": user_growth,
        "stats": stats,
    }
