# card

2026-07-05, golden pair via CLI + `CardTitle` render support added.

## Changed

- [`components/ui/card.tsx`](components/ui/card.tsx): Migrated to base-vega (no Slot on Card root). Added `useRender` to `CardTitle` for `render` prop.
- [`app/download/page.tsx`](app/download/page.tsx), [`app/about/page.tsx`](app/about/page.tsx): `CardTitle asChild` → `render={<h1|h2 />}`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None flagged.

## Verify by hand

- Download and about page headings: correct semantic h1/h2, styles intact.
