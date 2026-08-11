# AI Robot Builder

**From Robot Idea to Working Machine**

A working full-stack industrial robotics planning application built with Next.js, TypeScript, Tailwind CSS, Zod, and Supabase-ready architecture.

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
- Project demo: **4-Wheel AI Inspection Robot**
- **DEMO MODE** when Supabase / AI keys are not configured

## Quick start (local)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The homepage (`/`) is the **AI ROBOT BUILDER** dashboard.

Without Supabase/AI keys the app uses an in-memory / local JSON store and the mock AI provider so the full workflow remains usable.

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

`netlify.toml` in this repo already configures:

- `command = "npm run build"`
- `publish = ".next"`
- `@netlify/plugin-nextjs`

### Environment variables (optional)

Set in Netlify → Site configuration → Environment variables:

- `AI_PROVIDER=mock` (default — keeps DEMO MODE)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (when ready)
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_AI_API_KEY` (optional)

If these are missing, the app still opens normally in **DEMO MODE**.

### Connect correctly

1. New site from Git → select this repository
2. Confirm build settings match `netlify.toml`
3. Deploy
4. Open the Netlify URL — you must see **AI ROBOT BUILDER**, not a file browser

## Environment

See `.env.example` for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_AI_API_KEY`
- `AI_PROVIDER` (`mock` | `claude` | `openai` | `gemini`)

## Supabase

1. Create a project
2. Run `supabase/schema.sql` in the SQL editor
3. Create storage buckets: `robot-images`, `product-scans`, `documents`
4. Fill Supabase env vars

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
