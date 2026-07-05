# dropdown-menu

2026-07-05, golden pair via CLI.

## Changed

- [`components/ui/dropdown-menu.tsx`](components/ui/dropdown-menu.tsx): Migrated to `@base-ui/react/menu`. CSS vars `--radix-*` → `--anchor-width`, `--available-height`, `--transform-origin`.
- [`components/calendar-controls.tsx`](components/calendar-controls.tsx): `DropdownMenuTrigger asChild` → `render`; removed `collisionPadding` from `DropdownMenuSubContent` (no Base UI equivalent).
- [`components/chat/chat-composer.tsx`](components/chat/chat-composer.tsx): Same trigger/subecontent updates.
- Leftover scan: clean.

## Left alone

- cmdk, vaul, sonner — N/A.

## Behavior changes

- `collisionPadding` removed from submenu content — flagged; edge collision may differ near viewport bounds.
- Menu checkbox/radio items: Base UI `closeOnClick` defaults false (not used in this project).

## Verify by hand

- Calendar program dropdown: open, keyboard nav, session submenu opens to the right.
- Chat composer program dropdown: same flow on mobile/desktop widths.
