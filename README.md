# AI Robot Builder

**From Robot Idea to Working Machine**

A working full-stack industrial robotics planning application built with Next.js, TypeScript, Tailwind CSS, Zod, and Supabase.

## Features

- Robot project wizard with image upload
- AI analysis (Claude / OpenAI / Gemini adapters + mock fallback)
- BOM generation and inventory comparison
- Smart procurement (purchase only missing qty)
- Product screenshot scanner
- Product comparison
- Assembly + wiring guides
- Engineering safety checks
- Project costing and progress tracking
- Demo project: **4-Wheel AI Inspection Robot**
- **Robot Plan chart flow** (Hinglish): idea → image → stock → missing → 3D print → code → finish
- Hindi + English language toggle
- Mark inventory items as **USED** (इस्तेमाल)
- Storage bucket health + auto-ensure (`robot-images`, `product-scans`, `documents`)
- **DEMO MODE** when Supabase / AI keys are not configured

## Quick start (local)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The homepage (`/`) is the **AI ROBOT BUILDER** dashboard.

Locally, without Supabase, the app uses a writable JSON file at `data/store.json`.

## Production checks

```bash
npm install
npm run lint
npm run build
npm run start
```

## Deploy on Netlify (required settings)

This is a **Next.js** app. Do **not** publish `public/`, `data/`, or the repo root as a static site — that produces a broken file listing like `data - Zero KB` / `Open in...`.

### Site settings

| Setting | Value |
|--------|--------|
| Base directory | *(leave empty / repo root)* |
| Build command | `npm run build` |
| Publish directory | `.next` (handled by Next.js plugin; do not set `public`) |
| Node version | `22` (or `20`) |

`netlify.toml` in this repo already configures the Next.js plugin.

### Persistent data (recommended)

Netlify serverless functions **cannot** reliably write `/var/task/data`. For durable production data, use Supabase:

1. Create a Supabase project
2. Run migration `supabase/migrations/20260811165000_create_app_stores.sql` (or `supabase/netlify_setup.sql` / full `supabase/schema.sql`)
3. Create **public** Storage buckets: run `supabase/migrations/20260812234000_create_storage_buckets.sql` (or click **Ensure Storage Buckets** in Settings / Robot Plan)
4. Set Netlify env vars:

| Variable | Required for durable data |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `AI_PROVIDER` | Optional (`mock` default) |
| AI API keys | Optional |

5. Confirm `/api/health` reports `database_setup_required: false` and `app_stores` present

Without Supabase the app still opens in **DEMO MODE** using `/tmp` or in-memory storage (data may reset on cold start).

### Connect correctly

1. New site from Git → select this repository
2. Confirm build settings match `netlify.toml`
3. Deploy
4. Open the Netlify URL — you must see **AI ROBOT BUILDER**, not a file browser

## Data backends

| Backend | When used |
|---|---|
| **supabase** | Supabase env vars are set (durable Netlify/production) |
| **local** | Local dev with writable disk |
| **tmp** | Serverless without Supabase, `/tmp` writable |
| **memory** | Last-resort serverless fallback |

## Environment

See `.env.example`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
