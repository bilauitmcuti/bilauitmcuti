# dropdown-menu

2026-07-06, golden pair via shadcn CLI (`base-vega`), migrated `@radix-ui/react-dropdown-menu` → `@base-ui/react/menu`

## Changed

- [`components/ui/dropdown-menu.tsx`](components/ui/dropdown-menu.tsx): Menu anatomy `Portal > Positioner > Popup`; CSS vars `--radix-*` → `--available-height`, `--anchor-width`, `--transform-origin`
- Added `data-slot="dropdown-menu-positioner"` for mobile submenu CSS
- Forwarded `collisionPadding` to Positioner
- Consumers: `DropdownMenuTrigger asChild` → `render` in calendar-controls, chat-composer
- [`app/globals.css`](app/globals.css): submenu positioning uses `--available-width`
- Leftover scan: clean

## Left alone

- cmdk, sonner — N/A

## Behavior changes

- Menu items with `onSelect` + `preventDefault` kept; Base UI may differ on auto-close (flag for manual QA on calendar submenus)

## Verify by hand

- Program/session dropdown desktop + mobile submenus Group A/B
- Chat composer program dropdown
