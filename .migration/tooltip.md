# tooltip

2026-07-05, golden pair via CLI + consumer updates.

## Changed

- [`components/ui/tooltip.tsx`](components/ui/tooltip.tsx): `@radix-ui/react-tooltip` → `@base-ui/react/tooltip`. `delayDuration` on Provider → `delay`.
- [`components/grid-view.tsx`](components/grid-view.tsx): `TooltipTrigger asChild` → `render={calendarCell}`; `TooltipProvider delay={0}`; removed `collisionPadding` and `--radix-tooltip-content-transform-origin` style hack.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- `collisionPadding` removed — tooltip may clip differently near viewport edges.
- Radix `disableHoverableContent` had no equivalent (not used here).
- Animation uses Base UI `data-open` / `data-[state=delayed-open]` classes from registry.

## Verify by hand

- Desktop mini-calendar: hover a day with activities; tooltip appears immediately (delay=0), content readable, pointer events work inside tooltip.
