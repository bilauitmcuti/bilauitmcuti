## Summary

<!-- What changed and why. Focus on the student-facing outcome when relevant. -->

## Related issue

<!-- Fixes #123, relates to #456, or "None / maintainer request" -->

## Type of change

- [ ] Bug fix
- [ ] Feature / enhancement
- [ ] UI / design (shadcn / Base UI)
- [ ] Chat / AI pipeline
- [ ] API / edge runtime / Cloudflare Pages
- [ ] Docs / repo housekeeping
- [ ] Refactor (no intended user-facing change)

## Area touched

<!-- Check all that apply — mirrors issue templates -->

- [ ] Calendar / dates
- [ ] Chat assistant
- [ ] UI / layout / mobile
- [ ] Performance
- [ ] Other (describe in Summary)

## Transparency note

This repository is **public for transparency**, not a fully community-run open source project. External PRs are reviewed case by case.

- [ ] I discussed this change in an issue or with the maintainer first (recommended for non-trivial work)
- [ ] I understand the maintainer may rewrite, defer, or close this PR

## Test plan

CI runs on every PR (`.github/workflows/ci.yml`):

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm run build:pages` (required for app / route changes)

**Local / manual checks** (check what you verified):

- [ ] `pnpm dev` — calendar loads, program/session filters work
- [ ] Chat — send a message, scroll transcript, thumbs feedback (if touched)
- [ ] Mobile layout — drawer, dropdowns, composer keyboard behavior (if UI touched)
- [ ] `pnpm preview` — edge runtime + Workers AI binding (if chat/API touched)

**Notes:**

<!-- e.g. Tested semester dropdown on Android Chrome; verified /chat streams on localhost with Llama -->

## Cloudflare / security checklist

<!-- Mark N/A if not applicable -->

- [ ] No secrets, webhook URLs, or `.env` values committed
- [ ] New/changed API routes export `export const runtime = 'edge'`
- [ ] Calendar traffic stays same-origin (`/api/v1/*` or proxy) — no upstream URL in client bundles
- [ ] Turnstile / rate-limit behavior considered for new user-facing forms or chat paths

## Screenshots / recordings

<!-- Required for visible UI changes. Otherwise write N/A -->
