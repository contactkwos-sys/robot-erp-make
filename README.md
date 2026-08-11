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
- Demo project: **4-Wheel AI Inspection Robot**

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase/AI keys the app uses a local JSON store (`data/store.json`) and the mock AI provider so the full workflow remains usable.

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
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
