# CampusOS AI — Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Next.js Client)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │ Landing  │  │ Login/   │  │ Dashboard│  │  Admin/TPO  │   │
│  │   Page   │  │ Signup   │  │  Pages   │  │             │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘   │
└───────┼──────────────┼──────────────┼──────────────┼──────────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js App Router (Server)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    API Routes                            │ │
│  │   /api/auth/*    /api/resume/*    /api/jobs/*            │ │
│  │   /api/skills/*   /api/interview/*  /api/hackathons/*    │ │
│  │   /api/mentors/*  /api/portfolio/* /api/profile/*        │ │
│  └────────────────────────────────────────────────────────┘ │
└────────┬────────────────┬──────────────────┬──────────────────┘
         │                │                  │
         ▼                ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────────┐
│   Auth Layer    │ │  AI Layer    │ │   Data Layer       │
│                 │ │              │ │                    │
│ • JWT (jose)    │ │ • OpenAI     │ │ • Prisma ORM       │
│ • bcryptjs      │ │ • Anthropic  │ │ • SQLite (default) │
│ • HTTP-only     │ │ • Demo mode  │ │ • Postgres (prod)  │
│   cookies       │ │   (heuristic)│ │                    │
└─────────────────┘ └──────────────┘ └────────────────────┘
```

## Module Map

### `src/app/` — Next.js App Router
- **Public routes**: `/`, `/login`, `/signup`
- **Auth-required** (redirect to login): `/dashboard/*`, `/admin`
- **API routes**: 13 endpoints under `/api/*`

### `src/components/`
- `ui/` — Button, Card, Badge, Input, Progress, Toaster (all design-system primitives)
- `theme-provider.tsx` — next-themes wrapper
- `theme-toggle.tsx` — Sun/Moon toggle button

### `src/lib/`
- `ai.ts` — Unified AI layer. Resume analyzer, skill gap, mock interview, job matching, hackathon ideas, mentor data.
- `auth.ts` — JWT signing/verification + bcrypt password hashing + cookie session.
- `storage.ts` — Prisma client + async storage API (users, resumes, interviews, saved jobs, hackathon teams, mentor bookings, portfolios).
- `types.ts` — Shared TypeScript interfaces.
- `utils.ts` — `cn()`, formatters, score colors.

### `prisma/`
- `schema.prisma` — 8 models (User, Resume, Interview, SavedJob, JobApplication, MentorBooking, HackathonTeam, Portfolio).
- `dev.db` — Auto-created SQLite database.

## Data Models

```
User ────┬── Resume (history)
         ├── Interview
         ├── SavedJob ── JobApplication
         ├── MentorBooking
         ├── HackathonTeam (created)
         └── Portfolio
```

## Request Flow Example: Resume Analysis

```
1. User pastes resume text in ResumeAnalyzer.tsx
2. POST /api/resume/analyze { text }
3. Route handler → getCurrentUser() (JWT verification)
4. analyzeResume() in ai.ts:
   ├── If AI_PROVIDER=openai + key set → callOpenAI()
   ├── If AI_PROVIDER=anthropic + key set → callAnthropic()
   └── Otherwise → analyzeResumeHeuristic() (deterministic)
5. storage.saveResumeScore() → Prisma writes to SQLite
6. Response: { analysis: ResumeAnalysis }
7. Client renders ScoreCircle, strengths, weaknesses, suggestions
```

## Authentication

```
Signup:   POST /api/auth/signup
          → hash password (bcrypt)
          → storage.createUser() → Prisma insert
          → signSessionToken() → JWT
          → setSessionCookie() (HTTP-only, 7-day)

Login:    POST /api/auth/login
          → getUserByEmail() → verify password (bcrypt)
          → signSessionToken() → setSessionCookie()

Protected: middleware (in getCurrentUser())
          → cookies().get('campusos_session')?.value
          → verifySessionToken()
          → storage.getUser()
```

## Theme System

`next-themes` with `attribute="class"` toggles `<html class="dark">` based on user preference (system/light/dark).

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <Toaster />
  {children}
</ThemeProvider>
```

## Production Deployment

For production scale, swap SQLite for Postgres:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then `DATABASE_URL=postgresql://...` in environment. Same Prisma queries, no code changes needed.

Recommended hosts:
- **Vercel** (Next.js) + **Supabase / Neon / Railway** (Postgres)
- **Self-hosted**: Docker image + managed Postgres

## Security

- Passwords: bcrypt (10 rounds)
- Sessions: HS256 JWT, 7-day expiry, HTTP-only cookies
- CSRF: Same-Site=Lax cookies + POST-only mutations
- Input validation: All API routes validate inputs before Prisma calls
- SQL Injection: Impossible (Prisma uses parameterized queries)
- XSS: React auto-escapes; we never use `dangerouslySetInnerHTML`
