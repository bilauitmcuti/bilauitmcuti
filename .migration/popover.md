# popover

2026-07-05, golden pair via CLI + consumer trigger update.

## Changed

- [`components/ui/popover.tsx`](components/ui/popover.tsx): `@radix-ui/react-popover` → `@base-ui/react/popover` (Portal/Positioner/Popup).
- [`components/calendar-controls.tsx`](components/calendar-controls.tsx): `PopoverTrigger asChild` → `render={<Button .../>}`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- `openDelay`/`closeDelay` on Root → Trigger in Base UI if needed in future; not used in current call sites.

## Verify by hand

- Calendar settings gear: popover opens below trigger, switches work, closes on outside click.
