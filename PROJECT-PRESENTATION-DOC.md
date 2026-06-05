# Appointment Scheduling Platform — Full Project Documentation

Last updated: June 3, 2026

This document is written for presentation use. It explains what the application does, how each major flow works, which technologies are used, how the AI chatbot works, and how the work can be divided across 4 team members.

---

## 1) What This Application Is About

This project is an appointment scheduling platform where:

- customers search for service providers,
- book appointments,
- pay online,
- receive wallet/refund handling,
- track their appointment history,
- and use a built-in AI chatbot for help and navigation.

The platform also gives:

- providers a dashboard to manage availability, appointments, reviews, and earnings,
- admins a control panel to approve providers, manage users, and monitor the platform,
- and an AI assistant that answers questions using the user’s live account data.

In short, this is a full booking ecosystem, not just a simple calendar app.

---

## 2) Main User Roles

### Customer
Customers can:

- browse providers,
- book appointments,
- pay through Razorpay,
- view upcoming and past bookings,
- cancel or reschedule appointments,
- use loyalty points and coupons,
- earn rewards and achievements,
- receive refunds into the wallet,
- and chat with the AI assistant.

### Provider
Providers can:

- create a profile and onboarding application,
- wait for admin approval,
- set working hours and availability,
- manage appointments,
- cancel appointments before the meeting time,
- complete appointments after the meeting time buffer,
- see reviews, ratings, and earnings,
- and view their schedule.

### Admin
Admins can:

- approve or reject new providers,
- activate or deactivate users,
- view all appointments,
- manage categories,
- see reports and analytics,
- inspect audit logs,
- and monitor the full platform.

---

## 3) Tech Stack Used

### Frontend

- **React 18** — builds the user interface as a single-page application.
- **TypeScript** — adds type safety so the app is less error-prone.
- **React Router v6** — handles page navigation without full reloads.
- **Zustand** — stores auth state, notifications, and UI state simply.
- **Tailwind CSS** — makes responsive styling fast and consistent.
- **Axios** — sends API requests to the backend.
- **React Hook Form + Zod** — handles forms and validation cleanly.
- **Framer Motion** — adds smooth animations and transitions.
- **Lucide React** — provides icons.
- **date-fns / Day.js** — handles dates and time formatting.
- **React Hot Toast** — shows success and error notifications.

### Backend

- **FastAPI** — the main backend framework.
- **Python** — powers business logic and APIs.
- **SQLAlchemy ORM** — connects Python to the database.
- **PostgreSQL** — stores users, appointments, provider profiles, payments, etc.
- **Pydantic v2** — validates request and response data.
- **JWT** — handles login sessions using access and refresh tokens.
- **bcrypt** — hashes passwords securely.
- **Uvicorn** — runs the FastAPI server.

### Infrastructure

- **Docker + Docker Compose** — makes the project easy to run consistently.
- **Nginx** — acts as the reverse proxy in front of the app.
- **Redis** — used for supporting platform features like rate limiting and caching-related infrastructure.

### External Integrations

- **Razorpay** — for online payments.
- **Google OAuth** — for social login.
- **Google Calendar** — for calendar event links/integration.
- **Gemini / Grok** — for the AI chatbot.

---

## 4) Why This Stack Was Chosen

### Why React + TypeScript?

- React keeps the UI modular.
- TypeScript helps catch mistakes early.
- Together they are great for a large, multi-role dashboard app.

### Why FastAPI?

- FastAPI is fast and modern.
- It supports async code well.
- It automatically generates API docs.
- It works well for a structured backend with lots of endpoints.

### Why PostgreSQL?

- The app has relational data: users, providers, appointments, invoices, reviews, wallets, and notifications.
- PostgreSQL is reliable for this kind of structured data.

### Why SQLAlchemy?

- It simplifies database access.
- It keeps database code organized and readable.
- It makes joins and relationships manageable.

### Why Zustand?

- The app needs lightweight global state for auth, theme, notifications, and user data.
- Zustand is simpler than heavy state libraries.

### Why Tailwind CSS?

- Many dashboard screens need quick consistent design.
- Tailwind speeds up UI development.

### Why Docker?

- The project has frontend, backend, database, and proxy services.
- Docker ensures the same setup works on every machine.

---

## 5) High-Level Architecture

```text
Browser / Frontend (React + TypeScript)
        |
        |  Axios API calls
        v
FastAPI Backend
  - authentication
  - booking logic
  - provider logic
  - admin logic
  - AI chatbot
        |
        v
PostgreSQL Database
        |
        +--> Redis support
        +--> Razorpay
        +--> Google OAuth / Google Calendar
        +--> Gemini or Grok AI
```

The frontend only shows the interface.

The backend is the source of truth for:

- payment amounts,
- appointment status,
- provider approval,
- cancellation rules,
- refund rules,
- and chatbot account data.

This is important because it prevents the UI from showing the wrong result.

---

## 6) How the Application Works End to End

### A) Sign Up / Login

1. A user registers or logs in.
2. The backend validates credentials.
3. If login is successful, the backend returns:
   - an access token,
   - a refresh token,
   - and user details.
4. The frontend stores these tokens in localStorage.
5. The app uses those tokens for all future API calls.

### B) Role-Based Access

After login, the user is routed based on role:

- customer → customer dashboard,
- provider → provider dashboard or onboarding/pending page,
- admin → admin dashboard.

Protected pages check the role before showing content.

### C) Booking Flow

1. Customer searches for a provider.
2. The customer selects date and time.
3. The backend checks provider availability and prevents double booking.
4. The backend calculates the final amount.
5. Customer pays through Razorpay.
6. After successful payment, the appointment is created in the backend.
7. The appointment appears as upcoming/confirmed, not waiting for provider approval.
8. Notifications are sent.

### D) Cancellation Flow

There are two cancellation paths:

- **Provider cancels before the appointment time**  
  The customer receives a full refund to wallet.

- **Customer cancels manually**  
  A fixed cancellation fee of ₹50 is deducted, and the remaining amount is refunded to the wallet.

### E) Completion Flow

1. When the appointment time passes, the appointment can no longer be rescheduled.
2. After the appointment time plus the allowed buffer, the system marks it as completed.
3. Providers can only mark complete when the meeting time has passed.

### F) Admin Provider Approval Flow

1. A new provider completes onboarding.
2. The provider is shown as pending until reviewed by an admin.
3. Admin reviews the provider application.
4. Admin can approve or reject.
5. Approved providers get access to the provider dashboard.
6. Rejected providers stay blocked from provider access.

---

## 7) Booking, Pricing, and Payment Flow

The final payable amount is calculated in the backend so the customer and Razorpay always see the same price.

### Price formula

```text
Final Price = Base Price + GST - Redeemed Points / Coupon Discounts
```

### What happens during booking

1. The app reads the provider’s hourly rate.
2. The backend calculates the base charge for the selected slot.
3. GST is added.
4. Redeemed points or discounts are deducted.
5. Razorpay checkout opens using the final amount.
6. Once payment succeeds, the booking is confirmed.

### Why backend pricing matters

If the price was calculated only on the frontend, it could be changed by the browser.
By calculating it in the backend:

- payment is consistent,
- history matches the actual amount paid,
- and refunds are correct.

---

## 8) Appointment Status Flow

The platform uses these appointment statuses:

- **Pending** — waiting for action in older flows or before confirmation logic,
- **Confirmed** — active/upcoming appointment,
- **Completed** — appointment happened and was finished,
- **Cancelled** — appointment was cancelled,
- **Rejected** — provider declined in flows where rejection is used.

For the current booking flow:

- successful payment creates the appointment as confirmed/upcoming,
- the provider does not need to manually approve the new booking,
- cancellation rules depend on who cancelled,
- and rescheduling is not allowed after completion or cancellation.

---

## 9) How The AI Chatbot Works

This is the part people usually call “RAG chatbot,” but in this project it is best explained as a **context-augmented AI assistant**.

It does not use a separate vector database in the current codebase.
Instead, it uses:

- live user account data from PostgreSQL,
- role-based rules,
- a large system prompt with platform knowledge,
- and then sends that context to an LLM.

### Why it feels like RAG

The chatbot “retrieves” useful data before answering, such as:

- the user’s appointment counts,
- loyalty points,
- wallet/invoice counts,
- provider stats,
- revenue and rating information for admins,
- and platform categories.

Then it combines that retrieved data with the user’s question.

That is why it behaves like a RAG-style assistant even though it is not using embeddings or a vector search engine.

### Data used by the chatbot

#### For customers

It fetches:

- total appointments,
- upcoming confirmed appointments,
- pending appointments,
- completed appointments,
- cancelled appointments,
- loyalty points and tier,
- invoice count.

#### For providers

It fetches:

- provider profile,
- total appointments,
- pending requests,
- confirmed appointments,
- completed appointments,
- average rating,
- review count,
- total revenue.

#### For admins

It fetches:

- total users,
- total customers,
- total appointments,
- active providers,
- total categories,
- platform revenue,
- average rating.

### How the answer is generated

1. The user sends a message.
2. The backend reads the current logged-in user.
3. The backend builds a role-specific context from the database.
4. The backend creates a system prompt that tells the LLM what it is allowed to say.
5. The backend sends:
   - the user message,
   - recent conversation history,
   - retrieved context,
   - and the system prompt
   to the model.
6. The model returns a reply.
7. The backend also generates quick suggestion buttons based on the user’s role and message.

### Which LLM is used?

The backend supports two model APIs:

- **Primary: Gemini 2.5 Flash** through the Google Generative Language API
- **Fallback: Grok** through the xAI API

### When Gemini is used

If `GEMINI_API_KEY` exists, the backend calls:

- `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

### When Grok is used

If Gemini is not configured, the backend calls:

- `https://api.x.ai/v1/chat/completions`

### Why the chatbot is useful

The chatbot helps users without making them search menus manually.
It can answer things like:

- “How many appointments do I have?”
- “How do I reschedule?”
- “What is my wallet balance?”
- “What is my provider rating?”
- “How can an admin approve providers?”

### Role security

The chatbot is restricted by role:

- customers cannot see admin revenue or other users’ private info,
- providers cannot access admin panels,
- admins can see everything.

That keeps answers useful and safe.

---

## 10) Important Business Rules

These rules are core to the project:

- appointment booking is paid,
- prices are calculated in the backend,
- GST is included,
- redeemed points affect the final amount,
- bookings become upcoming/confirmed after payment,
- provider approval is required for provider access,
- completed appointments can generate rewards/reviews,
- cancellations trigger wallet refunds,
- and rescheduling is blocked after completion or cancellation.

---

## 11) Important Backend APIs

You do not need to memorize every endpoint for the presentation, but these are the most important groups.

### Authentication

- register
- login
- refresh token
- get current profile
- Google OAuth login

### Customers

- list providers
- view provider details
- book appointment
- reschedule appointment
- cancel appointment
- view appointments
- leave reviews
- manage favorites
- manage wallet
- view invoices

### Providers

- create provider profile
- manage availability
- view appointments
- update profile
- view earnings
- view schedule

### Admin

- list users
- activate/deactivate users
- view user details
- view provider approvals
- approve/reject providers
- manage categories
- view appointments
- view reports
- view audit logs
- send broadcasts

### AI

- send a message to the AI assistant
- receive a role-aware response with suggestions

### Payments

- Razorpay order / checkout flow
- payment success handling
- refund handling

---

## 12) Database Design In Simple Words

The database stores:

- users,
- provider profiles,
- availability schedules,
- appointments,
- notifications,
- reviews,
- invoices,
- loyalty accounts,
- achievements,
- favorites,
- coupons,
- waitlist entries,
- and payment-related records.

The important thing is that every booking and every refund is tied back to stored records.

This means the app can:

- show booking history,
- show payment history,
- calculate refunds,
- and keep admin reports accurate.

---

## 13) Key Screens In The Frontend

### Customer screens

- landing page
- login/register
- dashboard
- provider search/listing
- provider detail
- booking page
- my appointments
- appointment detail
- reschedule page
- rewards
- wallet
- coupons
- invoices
- favorites
- settings

### Provider screens

- onboarding
- pending approval
- dashboard
- appointments
- schedule
- availability manager
- profile

### Admin screens

- admin dashboard
- user management
- provider approvals
- categories
- appointments
- reports
- user details

### Shared UI

- header
- sidebar
- mobile navigation
- notification center
- command palette
- theme toggle

---

## 14) Why The Project Looks Professional

This project is presentation-friendly because it has:

- role-based access,
- clean dashboards,
- payment integration,
- wallet/refund logic,
- admin approval flows,
- AI assistance,
- charts and analytics,
- responsive UI,
- and polished interactions.

So the project is not just functional — it looks like a real product.

---

## 15) Suggested Team Division For 4 Members

Below is a balanced split so every team member has both backend and frontend parts to explain.

### Member 1 — Authentication, Landing, and Customer Booking

**Owns:**

- login and registration
- Google OAuth
- protected routes
- customer dashboard
- provider browsing
- booking page
- appointment creation flow

**What to explain in presentation:**

- how a user signs in,
- how tokens are stored,
- how customers search and book,
- how booking becomes confirmed after payment,
- how the system prevents double booking.

**Good demo flow:**

1. Open landing page
2. Register / log in
3. Search provider
4. Go to booking page
5. Show final price and payment flow

---

### Member 2 — Provider Module and Scheduling

**Owns:**

- provider onboarding
- pending approval page
- provider profile
- availability management
- schedule calendar
- provider appointments page
- provider dashboard

**What to explain in presentation:**

- how a provider submits onboarding details,
- why admin approval is needed,
- how availability is configured,
- how appointment requests and confirmed bookings are managed,
- how schedule and calendar views work.

**Good demo flow:**

1. Register as provider
2. Show pending approval
3. Show provider dashboard after approval
4. Open availability and schedule

---

### Member 3 — Admin Panel, Analytics, and User Control

**Owns:**

- admin dashboard
- user management
- provider approvals
- categories
- all appointments
- reports
- audit logs
- broadcasts

**What to explain in presentation:**

- how admins approve or reject providers,
- how users are activated/deactivated,
- how platform metrics are calculated,
- how reports help monitor the business,
- how admin analytics make decisions easier.

**Good demo flow:**

1. Open admin dashboard
2. Open user management
3. Show pending provider approvals
4. Show reports/charts

---

### Member 4 — AI Chatbot, Payments, Wallet, Rewards, and Notifications

**Owns:**

- AI chatbot
- Razorpay payment flow
- refund logic
- wallet
- loyalty points
- achievements and rewards
- notifications
- invoices

**What to explain in presentation:**

- how the chatbot uses live account data,
- which LLM is used,
- how payment amount is calculated,
- how refunds are sent to wallet,
- how loyalty and achievements motivate repeat usage,
- how notifications keep users informed.

**Good demo flow:**

1. Ask chatbot a question
2. Show wallet / rewards
3. Show invoice or payment record
4. Show notification panel

---

## 16) What Each Member Should Say In Simple Terms

### Member 1
“I handled user login, registration, and booking. Customers can search for providers, pick a slot, pay, and get a confirmed appointment.”

### Member 2
“I handled provider onboarding and scheduling. Providers can set availability and manage their appointments after admin approval.”

### Member 3
“I handled the admin side. Admins can approve providers, manage users, and monitor platform analytics and reports.”

### Member 4
“I handled payments, refunds, rewards, notifications, and the AI chatbot. The chatbot answers using live account data and the selected language model.”

---

## 17) Simple Presentation Flow

If you want a smooth presentation, follow this order:

1. Explain the problem statement
2. Show the main user roles
3. Explain the tech stack
4. Walk through customer booking
5. Walk through provider onboarding and schedule
6. Walk through admin approval and analytics
7. Explain the AI chatbot
8. Explain payments, wallet, and refunds
9. End with team division and future scope

---

## 18) Future Scope

If asked about future improvements, you can mention:

- better vector search for the chatbot,
- more advanced AI memory,
- push notifications,
- mobile app version,
- video meeting integration,
- smarter recommendation engine,
- richer provider verification checks,
- and stronger analytics exports.

---

## 19) Short Summary For Presentation

This platform is a full appointment scheduling system with:

- customer booking,
- provider onboarding,
- admin approval,
- payment handling,
- refunds and wallet support,
- loyalty and rewards,
- notifications,
- analytics,
- and an AI chatbot that uses live user data and an LLM.

The main goal is to make booking simple for customers, manageable for providers, and controllable for admins.

