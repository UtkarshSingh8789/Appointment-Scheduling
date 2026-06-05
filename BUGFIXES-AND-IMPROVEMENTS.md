# AppointEase — 50 Critical Bug Fixes & Improvements

## Status: Implementation Progress

### IMPLEMENTED (by AI):
- [x] #1: Razorpay checkout modal opens on BookAppointment page
- [x] #2: Payment verification endpoint created (`/api/payments/verify`)
- [x] #3: Appointment created after payment success (or with "Payment Pending" on dismiss)
- [x] #11: OAuth callback tokens extracted from URL and stored in localStorage
- [x] #33: Reschedule button added to appointment detail page for customers
- [x] #36: Dark mode persistence already working via localStorage
- [x] #49: Rate limiting already applied globally via RateLimitMiddleware

### REQUIRES YOUR ACTION (external service config):
- [ ] Google OAuth: Add `http://localhost/api/auth/google/callback` to redirect URIs in Google Cloud Console
- [ ] Microsoft OAuth: Change app to "Multitenant + personal accounts" in Azure Portal, use secret VALUE not ID
- [ ] Email sending: Verify SMTP credentials work (current: your-smtp-user@example.com)
- [ ] Gemini API: Monitor quota usage at https://ai.google.dev (free tier: 1500 req/day)

## Priority: HIGH (Business-Critical)

| # | Category | Issue/Improvement |
|---|----------|-------------------|
| 1 | Payment | Razorpay checkout modal not opening on BookAppointment page — frontend needs to call `/api/payments/create-order` and open Razorpay modal before confirming booking |
| 2 | Payment | No payment verification after Razorpay success — need to call `/api/payments/verify` with signature before marking appointment as confirmed |
| 3 | Payment | Invoice not auto-generated after successful payment — backend should create invoice on payment verification |
| 4 | Wallet | Wallet balance not deductible during booking — need "Apply Wallet Balance" option on confirmation step |
| 5 | Wallet | Promo code redemption not reflecting in wallet points — coupon discount should be tracked |
| 6 | Booking | No email confirmation sent after successful booking — email_service exists but not triggered on booking |
| 7 | Booking | Double-booking possible if two users select same slot simultaneously — need optimistic locking or DB constraint |
| 8 | Provider | New provider signup gives full platform access immediately — should require profile completion + admin approval |
| 9 | Provider | Provider cannot set different slot durations for different days — only one global slot_duration_minutes |
| 10 | Admin | No way to view individual user's full activity (bookings, reviews, payments) from admin panel |

## Priority: MEDIUM (User Experience)

| # | Category | Issue/Improvement |
|---|----------|-------------------|
| 11 | Auth | OAuth callback doesn't store tokens in localStorage — user lands on dashboard URL with tokens in query params but app doesn't read them |
| 12 | Auth | No "Stay logged in" functionality — tokens expire after 30 min regardless of activity |
| 13 | Auth | Password reset email not actually sent — only logged to console in development |
| 14 | Search | Search results don't highlight matching text in provider names/specializations |
| 15 | Search | No "Recently Viewed Providers" section on customer dashboard |
| 16 | Booking | No appointment reminder emails/notifications sent 24h before appointment |
| 17 | Booking | Cannot book recurring appointments (e.g., weekly therapy sessions) |
| 18 | Booking | No waitlist notification when a cancelled slot becomes available |
| 19 | Reviews | Provider cannot respond to customer reviews — no reply functionality |
| 20 | Reviews | No review moderation — inappropriate content goes live immediately |

## Priority: MEDIUM (Data Integrity)

| # | Category | Issue/Improvement |
|---|----------|-------------------|
| 21 | Data | Appointment stats on customer dashboard use different field names than API returns (was showing 0) — partially fixed but needs end-to-end verification |
| 22 | Data | Provider rating not recalculated when a review is deleted — stale rating persists |
| 23 | Data | Loyalty points awarded on appointment completion but not revoked on cancellation after completion |
| 24 | Data | Invoice amount calculated from hourly_rate but doesn't account for actual slot duration variations |
| 25 | Data | No audit trail for admin actions (user deactivation, category changes) — audit_service exists but not consistently used |
| 26 | Data | Chat messages between customer and provider not encrypted — stored as plain text |
| 27 | Data | No data retention policy — old appointments and messages accumulate indefinitely |
| 28 | Data | Provider availability exceptions don't validate against existing confirmed appointments |
| 29 | Data | No timezone handling — all times stored as naive, breaks for users in different timezones |
| 30 | Data | Coupon usage not tracked per-user — same user can apply same coupon multiple times |

## Priority: MEDIUM (UI/UX)

| # | Category | Issue/Improvement |
|---|----------|-------------------|
| 31 | UI | Mobile bottom navigation overlaps with chatbot FAB button on small screens |
| 32 | UI | No loading skeleton on provider detail page — shows blank then jumps to content |
| 33 | UI | Appointment detail page has no "Reschedule" button for customers — only cancel is visible |
| 34 | UI | No confirmation dialog before accepting/rejecting appointment requests on provider side |
| 35 | UI | Category pills on Find Providers page overflow without scroll indicator on mobile |
| 36 | UI | Dark mode toggle doesn't persist across page reloads in some cases |
| 37 | UI | No "Back to top" button on long scrolling pages (provider listings, admin appointments) |
| 38 | UI | Notification panel doesn't show notification type icons (booking vs system vs reminder) |
| 39 | UI | No empty state illustration for admin dashboard when platform has zero data |
| 40 | UI | Settings page tabs not accessible via URL (can't deep-link to /settings/security) |

## Priority: LOW (Polish & Performance)

| # | Category | Issue/Improvement |
|---|----------|-------------------|
| 41 | Perf | Provider listings fetch all 165 providers on initial load — should lazy load with infinite scroll |
| 42 | Perf | No image optimization — Unsplash URLs load full-size images even for small avatars |
| 43 | Perf | No service worker for offline support — app shows blank on network loss |
| 44 | Perf | Redis caching not utilized for frequently accessed data (categories, provider stats) |
| 45 | Perf | No database query optimization — N+1 queries on appointment listing with provider+customer joins |
| 46 | SEO | No meta tags on public pages (landing, provider public profile) — poor social sharing |
| 47 | A11y | Form inputs missing aria-describedby for error messages |
| 48 | A11y | Color contrast insufficient on some badge variants (yellow "Pending" on white) | 
| 49 | Security | No rate limiting on AI chat endpoint — could be abused to exhaust Gemini API quota |
| 50 | Security | JWT refresh token stored in localStorage — vulnerable to XSS, should use httpOnly cookie |

---

## Implementation Priority Order

**Sprint 1 (Critical):** Items 1-10 — Payment flow, wallet integration, provider approval
**Sprint 2 (UX):** Items 11-20 — OAuth completion, reminders, search improvements
**Sprint 3 (Data):** Items 21-30 — Data integrity, timezone, audit trails
**Sprint 4 (Polish):** Items 31-50 — UI fixes, performance, security hardening
