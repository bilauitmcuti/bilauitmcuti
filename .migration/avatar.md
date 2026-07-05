# avatar

2026-07-05, golden pair via CLI; custom extensions preserved in registry variant.

## Changed

- [`components/ui/avatar.tsx`](components/ui/avatar.tsx): `@radix-ui/react-avatar` → `@base-ui/react/avatar`. Kept `size`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- `Avatar.Image delayMs` → `delay` if used in future; no call sites use delay today.

## Verify by hand

- Calendar settings avatar in calendar-controls: image loads, fallback shows on error.
