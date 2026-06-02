![Bila UiTM Cuti — academic calendar for UiTM](public/all-cover.png)

# Bila UiTM Cuti
Academic calendar for UiTM students. **Live:** [bilauitmcuti.com](https://bilauitmcuti.com)

## What this is
Bila UiTM Cuti is a simple web app to check UiTM academic calendar, semester dates, and holidays in one place. Not affiliated with UiTM. It’s built for the “just tell me the date” moment, so you don’t have to juggle multiple PDFs.

## Stack
- Next.js (App Router)
- Cloudflare Pages
- Cloudflare Workers + Workers AI (chat)
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI

## Data sources
The calendar content comes from the upstream API configured by `CALENDAR_API_BASE` (default `https://api.bilauitmcuti.com`). The browser only calls same-origin API routes, while the server proxies the upstream (so the client doesn’t need to know the upstream URL).

## Why I built this
PDFs are just painful when you’re on mobile and trying to plan your semester.

- PDFs are unreadable on mobile devices
- Students manually download 3-5 different PDFs per semester
- No consolidated source for academic schedules
- Students resort to sharing PDFs via WhatsApp/Telegram
- Mental calculation required for exam countdowns

## License
Licensed under the [MIT License](LICENSE).
