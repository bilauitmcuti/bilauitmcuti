# Project migration summary

2026-07-05, golden pair via shadcn CLI (`base-vega` + `--overwrite`), whole-project mode — migration complete.

## Dependency swap

- Added: `@base-ui/react@1.6.0`
- Removed: all `@radix-ui/react-*` packages and `radix-ui` meta package (10 packages)
- Updated: [`components.json`](components.json) `radix-vega` → `base-vega`
- Updated: [`next.config.mjs`](next.config.mjs) `optimizePackageImports` → `@base-ui/react`

## Wrappers migrated (13)

button, badge, card, bubble, marker, avatar, tooltip, tabs, popover, select, dropdown-menu, context-menu, dialog

## Intentionally untouched

- `drawer.tsx` (vaul — not Radix)
- `sonner.tsx` (sonner)
- Native wrappers: input, textarea, alert, empty, table, kbd, spinner, message, settings-switch-row, etc.

## Consumer sweep summary

| File | Changes |
|------|---------|
| `app/download/page.tsx` | CardTitle/Button `asChild` → `render` |
| `app/about/page.tsx` | CardTitle `asChild` → `render` |
| `app/not-found.tsx` | Button `asChild` → `render` |
| `components/feedback-form-page.tsx` | Select `onValueChange`, `position` → `alignItemWithTrigger`, CSS var, Button `render` |
| `components/calendar-controls.tsx` | DropdownMenuTrigger/PopoverTrigger `render`; removed `collisionPadding` |
| `components/chat/chat-composer.tsx` | DropdownMenuTrigger `render`; removed `collisionPadding` |
| `components/chat/chat-message-row.tsx` | ContextMenuTrigger `render` |
| `components/grid-view.tsx` | TooltipTrigger `render`; `TooltipProvider delay={0}`; removed `collisionPadding` and Radix CSS var |

Custom restorations after CLI overwrite:

- `dialog.tsx`: re-exported `responsiveDialogContentClassName` + drawer shell import
- `card.tsx`: added `render` prop to `CardTitle` via `useRender`

## Build result

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass (5 pre-existing warnings) |
| `pnpm build` | Pass |
| `pnpm run build:pages` | Failed — Windows/next-on-pages environment issue (pre-existing platform limitation, not migration-related) |

## Remaining Radix wrappers

**0** wrappers remain on Radix in `components/ui`.
