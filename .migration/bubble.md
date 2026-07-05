# bubble

2026-07-05, golden pair via CLI, migrated cleanly.

## Changed

- [`components/ui/bubble.tsx`](components/ui/bubble.tsx): `BubbleContent` uses `useRender` + `render` instead of Slot/asChild.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None flagged.

## Verify by hand

- Chat message bubbles render; context menu on user messages still opens.
