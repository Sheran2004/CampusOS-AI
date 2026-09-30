# Production Deployment Guide

CampusOS AI is designed to deploy anywhere Next.js runs. This guide covers the most popular
options: **Vercel** (recommended), **Railway**, and **self-hosted**.

---

## Quick Decision Matrix

| Provider          | Pros                                            | Cons                  | Best for              |
| ----------------- | ----------------------------------------------- | --------------------- | --------------------- |
| **Vercel**        | One-click, free tier, edge functions, autoscale | DB add-on costs extra | Public launch         |
| **Railway**       | Includes Postgres, simple pricing               | No edge               | Quick full-stack      |
| **Self-hosted**   | Full control, cheap on VPS                      | You maintain infra    | Budget / privacy      |

---

## 1. Vercel + Postgres (Recommended)

### 1.1 Create a Postgres database

Use one of:

- **Vercel Postgres** — Built-in. Console → Storage → Create Database → Postgres
- **Neon** (https://neon.tech) — Free tier, fast
- **Supabase** — Free tier, generous
- **Railway** — Free trial

Copy the connection string. It looks like:
```
postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/campusos?sslmode=require
```

### 1.2 Switch Prisma to Postgres

```bash
# From your project root
cp prisma/schema.prisma prisma/schema.sqlite.prisma   # backup
cp prisma/schema.postgres.prisma prisma/schema.prisma # switch

# Install & generate
npm install
npx prisma generate
npx prisma db push                                  # creates tables
```

### 1.3 Deploy to Vercel

```bash
# Option A: GitHub integration (best)
# 1. Push your repo to GitHub
# 2. vercel.com → New Project → Import your repo
# 3. Vercel auto-detects Next.js

# Option B: CLI
npm i -g vercel
vercel
```

### 1.4 Set environment variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

| Key                       | Value                                 | Required |
| ------------------------- | ------------------------------------- | -------- |
| `DATABASE_URL`            | `postgresql://...`                    | ✅ Yes   |
| `JWT_SECRET`              | Random 32+ char string                | ✅ Yes   |
| `AI_PROVIDER`             | `openai` / `anthropic` / `demo`       | No       |
| `OPENAI_API_KEY`          | `sk-...`                              | If AI    |
| `ANTHROPIC_API_KEY`       | `sk-ant-...`                          | If AI    |
| `RAZORPAY_KEY_ID`         | `rzp_live_...`                        | No       |
| `RAZORPAY_KEY_SECRET`     | Live secret                           | No       |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay webhook settings        | No       |
| `RESEND_API_KEY`          | `re_...`                              | No       |
| `EMAIL_FROM`              | `CampusOS <hi@yourdomain.com>`        | No       |
| `NEXT_PUBLIC_APP_URL`     | `https://your-app.vercel.app`         | No       |

### 1.5 Configure Razorpay webhook (optional)

In Razorpay Dashboard → Settings → Webhooks → New Webhook:
- **URL:** `https://your-app.vercel.app/api/payments/webhook`
- **Events:** `payment.captured`, `payment.failed`
- Copy the webhook secret → add as `RAZORPAY_WEBHOOK_SECRET` env var

### 1.6 Done!

Vercel will give you a URL like `https://campusos-ai.vercel.app`. Test:
- `/` — landing page
- `/login` → click "Try Demo" — instant login
- `/dashboard/upgrade` — Pro upgrade flow

---

## 2. Railway (full-stack with DB)

1. https://railway.app → New Project → Deploy from GitHub
2. Add **Postgres** plugin → auto-sets `DATABASE_URL`
3. Add **Variables** (same table as above)
4. Set **Build Command:** `npx prisma generate && npx next build`
5. Set **Start Command:** `npx next start`
6. Switch Prisma schema to Postgres (same as section 1.2)

---

## 3. Self-Hosted (Docker)

```dockerfile
# Dockerfile (save at project root)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npx", "next", "start"]
```

```bash
docker build -t campusos-ai .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  campusos-ai
```

---

## 4. Pre-flight Checklist

Before going live:

- [ ] Changed `JWT_SECRET` to a random 32+ char string
- [ ] Set `AI_PROVIDER` (demo for free, openai/anthropic for quality)
- [ ] Switched Prisma to Postgres (`prisma/schema.postgres.prisma`)
- [ ] Ran `npx prisma db push` against prod DB
- [ ] Added Razorpay live keys (or accepted demo mode)
- [ ] Added Resend API key for real emails (or accepted console log mode)
- [ ] Tested signup → login → resume analyze → mock interview
- [ ] Tested upgrade flow end-to-end (use Razorpay test card `4111 1111 1111 1111`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your real domain

---

## 5. Cost Estimates (India / 2026)

| Service           | Free tier            | Cost beyond free            |
| ----------------- | -------------------- | --------------------------- |
| Vercel hosting    | 100 GB bandwidth     | $20/mo Pro                  |
| Vercel Postgres   | 256 MB               | $0.10/GB/mo                 |
| Neon Postgres     | 0.5 GB               | $19/mo Pro                  |
| Razorpay          | Free                | 2% per transaction          |
| Resend email      | 100/day              | $20/mo for 50k              |
| OpenAI            | $5 credit            | ~$0.002/resume analyze      |
| Anthropic Claude  | $5 credit            | ~$0.003/interview feedback  |

**Realistic ₹1500/mo for 1000 users** if you optimize AI calls aggressively and stay on free tiers.

---

## 6. Monitoring (Optional)

- **Vercel Analytics** — built-in, free
- **Sentry** — `npm i @sentry/nextjs`, add `SENTRY_DSN`
- **PostHog** — open-source product analytics
- **UptimeRobot** — ping your `/api/health` every 5 min

---

## Need Help?

Open an issue on GitHub with:
1. The deployment method you tried
2. Full error message + stack trace
3. Output of `npx prisma db push`
4. Node version (`node -v`)

We'll respond within 24h.