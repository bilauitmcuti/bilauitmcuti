# Project migration summary

2026-07-06, whole-project golden-pair + manual merge, **complete — 0 Radix wrappers remain**

## Changed

- [`components.json`](components.json): `radix-vega` → `base-vega`
- [`next.config.mjs`](next.config.mjs): `optimizePackageImports` → `@base-ui/react`
- [`package.json`](package.json): added `@base-ui/react`, removed all `@radix-ui/*`, `radix-ui`, `vaul`
- 14 UI wrappers migrated under [`components/ui/`](components/ui/)
- Consumer sweep: `asChild` → `render`, CSS vars `--radix-*` → Base UI vars, drawer/vaul selectors
- [`app/globals.css`](app/globals.css): mobile submenu rules retargeted to `[data-slot="dropdown-menu-positioner"]` + `--available-width`

## Left alone

- API routes, middleware, chat handler, calendar proxy — no changes
- `sonner`, `message-scroller` (`@shadcn/react`), input/textarea/alert/table — not Radix

## Behavior changes

- Drawer swipe physics differ slightly from vaul (Base UI `@base-ui/react/drawer`)
- Menu `closeOnClick` defaults may differ for checkbox/radio items (not used in this app)
- `handleOnly` / `dismissible` vaul props mapped to `showSwipeHandle` / `disablePointerDismissal` on drawer

## Verify by hand

- Calendar program/session dropdown + mobile submenus
- Grid tooltips + activity drawer (keyboard-aware)
- Chat context menu + mention picker responsive shell
- Feedback form selects
- Engagement prompt vs open drawer detection
- About/Download/404 link buttons

## Build result

- `pnpm typecheck` — pass
- `pnpm lint` — pass (5 pre-existing warnings)
- `pnpm build` — pass
- `pnpm build:pages` — failed on Windows (next-on-pages/Vercel CLI env limitation; not migration-related)

## Wrappers remaining on Radix

**0**
