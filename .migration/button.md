# button

2026-07-05, golden pair via CLI (`shadcn add button --overwrite`), migrated cleanly.

## Changed

- [`components/ui/button.tsx`](components/ui/button.tsx): Replaced `radix-ui` Slot/asChild with `@base-ui/react/button` primitive. Consumers use `render` prop instead of `asChild`.
- Leftover scan: clean (no `radix-ui` / `@radix-ui`).

## Left alone

- None.

## Behavior changes

- None flagged.

## Verify by hand

- Click buttons across calendar, chat, download page.
- Test `render={<Link/>}` / `render={<a/>}` links on download, not-found, feedback pages — navigation works, styles preserved.
