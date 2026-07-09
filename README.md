![Bila UiTM Cuti — academic calendar for UiTM](public/all-cover.png)

# Bila UiTM Cuti

Academic calendar for UiTM students. **Live:** [bilauitmcuti.com](https://bilauitmcuti.com)

[![Github Sponsor](https://img.shields.io/badge/Github_Sponsor-shahrulestar-ea4aaa?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/shahrulestar)

## What this is

Bila UiTM Cuti is a simple web app to check UiTM academic calendar, semester dates, and holidays in one place. Not affiliated with UiTM. It is built for the “just tell me the date” moment, so you do not have to juggle multiple PDFs.

## What you get

| Area | Highlights |
|------|------------|
| **Calendar** | Grid and list views; Foundation through PhD; Group A/B; regional dates (Kedah, Kelantan, Terengganu); filters and countdown |
| **AI chat** | Ask about dates or general UiTM info (English or Malay); SSE streaming; tool-calling agent on production Gemma; thumbs feedback |
| **PWA** | Installable via `/download`, offline-friendly service worker, light/dark theme |
| **Feedback** | [Feedback](/feedback) with Turnstile; optional Discord webhooks for ratings and chat thumbs |
| **Internship** | Footer link to [Find My Internship](/internship) for discovering opportunities across Malaysia |

Calendar data loads from **same-origin** routes (`/api/v1/meta`, `/api/v1/calendar`). The upstream API URL stays on the server (`CALENDAR_API_BASE`, default `https://api.bilauitmcuti.com`).

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **AI:** Cloudflare Workers AI — **Gemma 4** on `bilauitmcuti.com` and `*.pages.dev`; **Llama 3.2 3B** on localhost
- **AI Gateway:** chat inference routed through `bilauitmcuti-chat` (rate/spend limits at the edge)
- **Deploy:** Cloudflare Pages (`@cloudflare/next-on-pages`)
- **Analytics:** Cloudflare Zaraz → Google Analytics 4 (no `gtag.js` in the bundle)

## Quick start

**Prerequisites:** Node.js 18+, pnpm, Cloudflare account (Workers AI for chat)

```bash
git clone <your-repo-url>
cd bilauitmcuti
pnpm install
cp .env.example .env.local   # Turnstile keys if testing forms/chat locally
npx wrangler login           # once — needed for Workers AI in dev
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

If chat fails with an auth error, run `npx wrangler login` again. Calendar and UI work without AI; chat returns 503 until the Workers AI binding is available.

### Useful commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local dev (Workers AI via Wrangler dev platform) |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm build:pages` | Build for Cloudflare Pages |
| `pnpm preview` | Build + `wrangler pages dev` (full Pages runtime) |
| `pnpm pages:dev` | Preview last build only (run `build:pages` first) |

## Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| Workers AI binding `AI` | For chat | Pages → Bindings → Workers AI; local: `pnpm preview` or dev platform |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production forms/chat | Or `TURNSTILE_SITE_KEY` at runtime (`GET /api/turnstile/config`) |
| `TURNSTILE_SECRET_KEY` | With Turnstile | Server-only |
| `AI_GATEWAY_ID` | Production chat | Default `bilauitmcuti-chat`; set `off` or `SKIP_AI_GATEWAY=1` to bypass |
| `DISCORD_WEBHOOK_*` | Optional | Feedback ratings, chat thumbs — server-only, never commit URLs |
| `CALENDAR_API_BASE` | Optional | Default `https://api.bilauitmcuti.com` — server-only |
| `CHAT_USE_AGENT` | Optional | Set `0` to disable tool-calling agent (legacy full-context path) |

See [`.env.example`](.env.example) for samples. Full deployment and gateway setup: [`AGENTS.md`](AGENTS.md).

## Deploy to Cloudflare Pages

| Setting | Value |
|---------|--------|
| Build command | `pnpm run build:pages` or `npx @cloudflare/next-on-pages@1` |
| Output directory | `.vercel/output/static` |
| `NODE_VERSION` | `20` (or ≥18) |

After deploy: **Settings → Functions** → enable **`nodejs_compat`** (date ≥ `2022-11-30`). Add binding **Workers AI** named `AI` (production + preview).

- Health: `GET /api/health` (503 if AI binding missing)
- Edge runtime: dynamic routes need `export const runtime = 'edge'`

## Why I built this

PDFs are painful when you are on mobile and trying to plan your semester.

- PDFs are unreadable on mobile devices
- Students manually download 3–5 different PDFs per semester
- No consolidated source for academic schedules
- Students resort to sharing PDFs via WhatsApp/Telegram
- Mental calculation required for exam countdowns

## Contributing

This repo is public for transparency; direction and merges are maintainer-led. See [CONTRIBUTING.md](CONTRIBUTING.md). Agent and Cloudflare details: [AGENTS.md](AGENTS.md).

## License

Licensed under the [MIT License](LICENSE).
