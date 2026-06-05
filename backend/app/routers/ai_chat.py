"""AI chatbot router with retrieval-augmented context."""

from __future__ import annotations

import logging
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.appointment import Appointment, AppointmentStatus
from app.models.invoice import Invoice
from app.models.loyalty import LoyaltyAccount
from app.models.provider import ServiceProvider
from app.models.review import Review
from app.models.service_category import ServiceCategory
from app.models.user import User, UserRole
from app.services.ai_chat_service import AIChatRetrievalService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai-chat", tags=["AI Chat"])


class AIChatAction(BaseModel):
    """Structured action the frontend can render."""

    label: str
    value: str
    type: Literal["provider", "date", "slot", "confirm", "cancel", "suggestion", "link"]
    data: dict = Field(default_factory=dict)


class AIChatRequest(BaseModel):
    """Request body for AI chat."""

    message: str
    conversation_history: list[dict] = Field(default_factory=list)


class AIChatResponse(BaseModel):
    """Response body for AI chat."""

    reply: str
    suggestions: list[str] = Field(default_factory=list)
    actions: list[AIChatAction] = Field(default_factory=list)


async def _get_user_context(db: AsyncSession, user: User) -> str:
    """Build role-specific live data context."""
    context_parts = [
        f"User: {user.full_name}, Role: {user.role.value}, Email: {user.email}",
    ]

    if user.role == UserRole.CUSTOMER:
        result = await db.execute(
            select(func.count(Appointment.id)).where(Appointment.customer_id == user.id)
        )
        total_appointments = result.scalar() or 0

        result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.customer_id == user.id,
                Appointment.status == AppointmentStatus.CONFIRMED,
            )
        )
        upcoming = result.scalar() or 0

        result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.customer_id == user.id,
                Appointment.status == AppointmentStatus.COMPLETED,
            )
        )
        completed = result.scalar() or 0

        result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.customer_id == user.id,
                Appointment.status == AppointmentStatus.PENDING,
            )
        )
        pending = result.scalar() or 0

        result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.customer_id == user.id,
                Appointment.status == AppointmentStatus.CANCELLED,
            )
        )
        cancelled = result.scalar() or 0

        loyalty_result = await db.execute(
            select(LoyaltyAccount).where(LoyaltyAccount.user_id == user.id)
        )
        loyalty = loyalty_result.scalar_one_or_none()
        points = loyalty.points if loyalty else 0
        tier = loyalty.tier if loyalty else "bronze"

        invoice_result = await db.execute(
            select(func.count(Invoice.id)).where(Invoice.customer_id == user.id)
        )
        invoice_count = invoice_result.scalar() or 0

        context_parts.append(
            f"Customer Stats: {total_appointments} total appointments, "
            f"{upcoming} upcoming confirmed, {pending} pending, {completed} completed, "
            f"{cancelled} cancelled. Loyalty: {points} points, {tier} tier. "
            f"Invoices: {invoice_count} total."
        )

    elif user.role == UserRole.PROVIDER:
        provider_result = await db.execute(
            select(ServiceProvider).where(ServiceProvider.user_id == user.id)
        )
        provider = provider_result.scalar_one_or_none()

        if provider:
            result = await db.execute(
                select(func.count(Appointment.id)).where(Appointment.provider_id == provider.id)
            )
            total = result.scalar() or 0

            result = await db.execute(
                select(func.count(Appointment.id)).where(
                    Appointment.provider_id == provider.id,
                    Appointment.status == AppointmentStatus.PENDING,
                )
            )
            pending = result.scalar() or 0

            result = await db.execute(
                select(func.count(Appointment.id)).where(
                    Appointment.provider_id == provider.id,
                    Appointment.status == AppointmentStatus.CONFIRMED,
                )
            )
            confirmed = result.scalar() or 0

            result = await db.execute(
                select(func.count(Appointment.id)).where(
                    Appointment.provider_id == provider.id,
                    Appointment.status == AppointmentStatus.COMPLETED,
                )
            )
            completed = result.scalar() or 0

            result = await db.execute(
                select(func.avg(Review.rating)).where(Review.provider_id == provider.id)
            )
            avg_rating = result.scalar() or 0

            result = await db.execute(
                select(func.count(Review.id)).where(Review.provider_id == provider.id)
            )
            review_count = result.scalar() or 0

            revenue_result = await db.execute(
                select(func.sum(Invoice.total_amount)).where(Invoice.provider_id == provider.id)
            )
            revenue = revenue_result.scalar() or 0

            context_parts.append(
                f"Provider Profile: {provider.specialization} in {provider.location}. "
                f"Provider Stats: {total} total appointments, {pending} pending, {confirmed} confirmed, "
                f"{completed} completed, average rating {avg_rating:.1f}/5 from {review_count} reviews, "
                f"total revenue ₹{revenue:.0f}."
            )

    elif user.role == UserRole.ADMIN:
        result = await db.execute(select(func.count(User.id)))
        total_users = result.scalar() or 0

        result = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.CUSTOMER)
        )
        total_customers = result.scalar() or 0

        result = await db.execute(select(func.count(Appointment.id)))
        total_appointments = result.scalar() or 0

        result = await db.execute(
            select(func.count(ServiceProvider.id)).where(ServiceProvider.is_verified.is_(True))
        )
        active_providers = result.scalar() or 0

        result = await db.execute(select(func.count(ServiceCategory.id)))
        total_categories = result.scalar() or 0

        revenue_result = await db.execute(select(func.sum(Invoice.total_amount)))
        total_revenue = revenue_result.scalar() or 0

        avg_result = await db.execute(select(func.avg(Review.rating)))
        avg_rating = avg_result.scalar() or 0

        context_parts.append(
            f"Platform Stats: {total_users} users ({total_customers} customers), "
            f"{active_providers} active providers, {total_appointments} total appointments, "
            f"{total_categories} categories, total revenue ₹{total_revenue:.0f}, "
            f"average rating {avg_rating:.1f}/5."
        )

    cat_result = await db.execute(
        select(ServiceCategory.name).where(ServiceCategory.is_active.is_(True)).limit(20)
    )
    categories = [row[0] for row in cat_result.all()]
    if categories:
        context_parts.append(f"Active Categories: {', '.join(categories)}")

    return "\n".join(context_parts)


def _build_system_prompt(user_context: str, user_role: str, retrieval_bundle: dict) -> str:
    """Build a compact prompt around retrieved context."""
    role_boundaries = {
        "customer": (
            "CUSTOMER ACCESS: You can discuss booking, rescheduling, cancelling, loyalty, wallet, invoices, "
            "favorites, reviews, provider discovery, and navigation. Do not reveal admin-only data, other users' "
            "private information, provider management tools, or platform-wide revenue."
        ),
        "provider": (
            "PROVIDER ACCESS: You can discuss availability, schedule, ratings, revenue, profile, invoices, "
            "onboarding, and appointment management. Do not reveal admin-only data, other providers' private data, "
            "or platform-wide statistics."
        ),
        "admin": (
            "ADMIN ACCESS: You can discuss platform-wide stats, approvals, users, categories, appointments, reports, "
            "and analytics."
        ),
    }

    return f"""
You are the AppointEase AI Assistant.
Use the retrieved live data and retrieved project knowledge below.
Never invent providers, counts, prices, policies, or routes.
If something is not present in the retrieved context, say so clearly.
Keep answers short and practical.
If the user asks how booking works internally, explain that Gemini/Grok generates wording, while AppointEase APIs and the database handle booking logic and persistence.

{role_boundaries.get(user_role, role_boundaries["customer"])}

USER LIVE CONTEXT:
{user_context}

{retrieval_bundle["provider_context"]}

{retrieval_bundle["knowledge_context"]}
""".strip()


def _get_role_suggestions(user_role: str, message: str, retrieval_bundle: dict) -> list[str]:
    """Generate contextual follow-up suggestions."""
    q = message.lower()
    suggestions: list[str]

    if user_role == "customer":
        if retrieval_bundle["provider_matches"]:
            top_name = retrieval_bundle["provider_matches"][0].provider.user.full_name
            suggestions = [
                f"Book appointment with {top_name}",
                f"Show details for {top_name}",
                "Find providers near me",
            ]
        elif "refund" in q or "wallet" in q:
            suggestions = ["Show my wallet balance", "Explain my refund", "Recent wallet transactions"]
        elif "loyalty" in q or "points" in q or "reward" in q:
            suggestions = ["How do I earn more points?", "What tier am I?", "How to redeem points?"]
        elif "cancel" in q:
            suggestions = ["Will I get a refund?", "Show my appointments", "How do I rebook?"]
        elif "invoice" in q or "billing" in q:
            suggestions = ["Show my invoices", "How is GST calculated?", "Download invoice"]
        else:
            suggestions = ["Book an appointment", "Show my upcoming appointments", "What are my loyalty points?"]

    elif user_role == "provider":
        if "availability" in q or "schedule" in q:
            suggestions = ["How to block a date?", "View my schedule", "Set weekly hours"]
        elif "review" in q or "rating" in q:
            suggestions = ["My average rating", "How to improve ratings?", "View all reviews"]
        else:
            suggestions = ["Pending appointment requests", "My schedule today", "My ratings & reviews"]

    elif user_role == "admin":
        if "revenue" in q or "report" in q:
            suggestions = ["Platform revenue", "Top providers", "Growth metrics"]
        elif "approval" in q or "provider" in q:
            suggestions = ["Pending provider approvals", "Approve or reject a provider", "View onboarding submissions"]
        else:
            suggestions = ["Platform overview", "Today's stats", "View reports"]

    else:
        suggestions = ["Help me navigate", "What can you do?", "Platform features"]

    return suggestions[:3]


def _build_actions(user_role: str, retrieval_bundle: dict) -> list[AIChatAction]:
    """Build structured actions for the frontend."""
    actions: list[AIChatAction] = []
    matches = retrieval_bundle["provider_matches"]

    if not matches or user_role != UserRole.CUSTOMER.value:
        return actions

    if retrieval_bundle["booking_intent"]:
        for match in matches[:3]:
            provider = match.provider
            actions.append(
                AIChatAction(
                    label=(
                        f"{provider.user.full_name} — {provider.specialization} "
                        f"({provider.location}) ★{provider.rating:.1f}"
                    ),
                    value=str(provider.id),
                    type="provider",
                    data={"name": provider.user.full_name},
                )
            )
        return actions

    if retrieval_bundle["provider_detail_intent"]:
        for match in matches[:3]:
            provider = match.provider
            actions.append(
                AIChatAction(
                    label=f"Open {provider.user.full_name}",
                    value=f"/providers/{provider.id}",
                    type="link",
                    data={"provider_id": str(provider.id)},
                )
            )
        return actions

    return actions


async def _generate_llm_reply(
    message: str,
    conversation_history: list[dict],
    system_prompt: str,
) -> str:
    """Generate an LLM reply using Gemini or Grok."""
    if settings.GEMINI_API_KEY:
        gemini_contents = []
        for msg in conversation_history[-10:]:
            gemini_contents.append(
                {
                    "role": "user" if msg.get("role") == "user" else "model",
                    "parts": [{"text": msg.get("content", "")}],
                }
            )
        gemini_contents.append({"role": "user", "parts": [{"text": message}]})

        api_url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        )
        payload = {
            "contents": gemini_contents,
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 700,
                "topP": 0.9,
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                api_url,
                headers={"Content-Type": "application/json"},
                json=payload,
            )

        if response.status_code != 200:
            logger.error("Gemini API error: %s - %s", response.status_code, response.text)
            raise HTTPException(status_code=502, detail="AI service temporarily unavailable")

        result = response.json()
        candidates = result.get("candidates", [])
        if not candidates:
            raise HTTPException(status_code=502, detail="No response from AI")

        return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()

    if settings.GROK_API_KEY:
        messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation_history[-10:]:
            messages.append(
                {
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                }
            )
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROK_MODEL,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 700,
                },
            )

        if response.status_code != 200:
            logger.error("Grok API error: %s - %s", response.status_code, response.text)
            raise HTTPException(status_code=502, detail="AI service temporarily unavailable")

        result = response.json()
        return result["choices"][0]["message"]["content"].strip()

    raise HTTPException(status_code=503, detail="AI service not configured")


@router.post("", response_model=AIChatResponse)
async def ai_chat(
    data: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return a retrieval-augmented chatbot response."""
    retrieval_service = AIChatRetrievalService(db)

    try:
        user_context = await _get_user_context(db, current_user)
        retrieval_bundle = await retrieval_service.build_bundle(
            data.message,
            current_user.role.value,
        )
        actions = _build_actions(current_user.role.value, retrieval_bundle)
        suggestions = _get_role_suggestions(current_user.role.value, data.message, retrieval_bundle)

        reply = retrieval_service.build_direct_reply(
            data.message,
            retrieval_bundle,
            current_user.role.value,
        )

        if not reply and (settings.GEMINI_API_KEY or settings.GROK_API_KEY):
            system_prompt = _build_system_prompt(
                user_context,
                current_user.role.value,
                retrieval_bundle,
            )
            try:
                reply = await _generate_llm_reply(
                    data.message,
                    data.conversation_history,
                    system_prompt,
                )
            except HTTPException:
                logger.warning("LLM request failed; falling back to retrieval-only response.")

        if not reply:
            reply = retrieval_service.build_fallback_reply(
                retrieval_bundle,
                user_context,
                current_user.role.value,
            )

        return AIChatResponse(reply=reply, suggestions=suggestions, actions=actions)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timeout")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI chat error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to get AI response")
