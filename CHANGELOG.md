# Changelog

All notable changes to CampusOS AI will be documented here.

## [1.1.0] - 2026-09-29

### Added
- **🎙️ Voice Mock Interview** — Web Speech API (browser-native, free). AI reads questions aloud via TTS, you answer via mic with live transcript. Works in Chrome/Edge.
- **💬 Live Mentor Chat** — Real-time polling-based chat with your booked mentors. AI auto-replies contextually based on keywords. Typing indicators, unread badges.
- **🔔 Notification Bell** — Header dropdown with unread count, polls every 10s. Click → deep-links to the relevant page (e.g. mentor chat). Mark-all-read action.
- **💳 Razorpay Payments** — Full upgrade flow with order creation, signature verification, and webhook handler. Demo mode auto-activates Pro when no keys set. Pro status surfaced in Settings.
- **📧 Email Notifications** — Resend integration with 4 HTML templates (welcome, resume analyzed, mentor booked, payment receipt). Fires on signup, resume upload, booking, payment. Falls back to console.log when RESEND_API_KEY not set.
- **🗄️ PostgreSQL Production Schema** — `prisma/schema.postgres.prisma` with full type hints, indexes, and proper string lengths. One-file swap to deploy on Vercel/Railway/RDS.
- **📘 Production Deployment Guide** — `docs/DEPLOYMENT.md` covers Vercel, Railway, Docker, with cost estimates and pre-flight checklist.

### Added (Database)
- 3 new Prisma models: `ChatMessage`, `Notification`, `Payment`
- `isPro` and `proExpiresAt` fields on `User`
- 13 new storage methods for chat, notifications, payments
- 6 new API endpoints: chat, notifications, payments/{create-order,verify,webhook}

## [1.0.0] - 2026-09-28

### Added
- **Real Database** — SQLite via Prisma (production-grade, swap to Postgres in 1 line)
- **34 Real Jobs** from top Indian companies (Razorpay, Zerodha, Google, Microsoft, Amazon, Swiggy, Cred, PhonePe, Meesho, Flipkart, Groww, Atlassian, Paytm, Salesforce, Zoho, etc.)
- **8 Real Hackathons** with team formation + AI idea generator (Amazon, Flipkart, Google, Microsoft, Razorpay, Smart India Hackathon)
- **12 Real Mentors** from Google, Razorpay, Microsoft, Cred, PhonePe, with 1-on-1 booking system
- **Portfolio Builder** with auto-generation + GitHub Pages / LinkedIn / HTML export
- **Resume Analyzer v2** — strict, real scoring. ATS-grade (cap 95 to force continued improvement)
- **Dark / Light / System theme** with persistent preference
- **PDF Upload** for resume with real `pdf-parse` integration
- **Toast notifications** (sonner) across all flows
- **Error boundaries** (global + per-page)
- **Custom 404 page**
- **Strict resume scoring** — most resumes now correctly score 40-70, only well-tailored ones reach 80+

### Improved
- Resume scoring is now strict (max 95 not 100) — meaningful differentiation
- Job matching uses real Indian jobs with accurate salaries + apply URLs
- Mock interview feedback clamps scores 0-100
- Skill gap analysis clamped to realistic 0-100 percentages

### Tech
- Next.js 14 (App Router)
- TypeScript strict
- Prisma + SQLite (Postgres-ready)
- Tailwind CSS + class-variance-authority
- next-themes (theme switching)
- sonner (toasts)
- pdf-parse (resume PDFs)
- bcryptjs + JWT (auth)
- Real OpenAI / Anthropic support with smart heuristic fallback
