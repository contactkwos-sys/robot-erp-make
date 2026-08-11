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

## Quick start (local)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Locally, without Supabase, the app uses a writable JSON file at `data/store.json`.

## Netlify / production (required)

Netlify serverless functions **cannot** create `/var/task/data`. Production must use Supabase.

1. Create a Supabase project
2. Run `supabase/netlify_setup.sql` (or full `supabase/schema.sql`) in the SQL editor
3. Create **public** Storage buckets: `robot-images`, `product-scans`, `documents`
4. In Netlify → Site settings → Environment variables, set:

| Variable | Required |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server-side reads/writes) |
| `AI_PROVIDER` | Optional (`mock` default) |
| AI API keys | Optional |

5. Redeploy

`netlify.toml` is included for `@netlify/plugin-nextjs`.

## Data backends

| Backend | When used |
|---|---|
| **supabase** | Supabase env vars are set (Netlify/production) |
| **local** | Local dev with writable disk |
| **memory** | Serverless without Supabase (no crash, but data resets) |

## Environment

See `.env.example`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
