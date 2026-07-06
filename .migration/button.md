# button

2026-07-06, golden pair + preserved `data-variant`/`data-size`, migrated to `@base-ui/react/button`

## Changed

- [`components/ui/button.tsx`](components/ui/button.tsx): `Slot.Root` / `asChild` → `ButtonPrimitive` from `@base-ui/react/button`; consumers use `render` prop
- Leftover scan: clean (no radix imports)

## Left alone

- `buttonVariants` cva definitions unchanged

## Behavior changes

None flagged.

## Verify by hand

- Link buttons on About, Download, 404, feedback sponsor links
- Icon buttons in calendar controls and grid drawer
