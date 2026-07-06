# dialog

2026-07-06, manual merge from base-vega golden pair, migrated `@radix-ui/react-dialog` → `@base-ui/react/dialog`

## Changed

- [`components/ui/dialog.tsx`](components/ui/dialog.tsx): Overlay→Backdrop, Content→Popup; `asChild` on Close → `render`; preserved `responsiveDialogContentClassName`, `font-heading`, lucide `XIcon`
- Leftover scan: clean

## Left alone

- [`components/ui/responsive-overlay-shell.tsx`](components/ui/responsive-overlay-shell.tsx) — uses dialog on desktop only; no API change

## Behavior changes

None flagged.

## Verify by hand

- Mention picker on desktop (dialog path in responsive overlay shell)
