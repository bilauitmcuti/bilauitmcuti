# drawer

2026-07-06, golden pair via shadcn CLI + manual merge of custom exports, migrated vaul → `@base-ui/react/drawer`

## Changed

- [`components/ui/drawer.tsx`](components/ui/drawer.tsx): full rewrite to Base UI Drawer; preserved `KeyboardAwareDrawer`, all exported className constants, `keyboardAware` prop on `DrawerContent`
- Selector migration: `data-[vaul-drawer-direction=*]` → `data-[swipe-direction=*]` / `group-data-[swipe-direction=*]/drawer-popup`
- `data-vaul-no-drag` → `data-slot="drawer-no-drag"` in consumers
- [`components/engagement-prompt.tsx`](components/engagement-prompt.tsx): open-drawer detector → `[data-slot="drawer-popup"][data-open]`
- Leftover scan: no `radix-ui`, `@radix-ui`, or `vaul` imports in drawer.tsx (comments mention vaul compat only)

## Left alone

- [`lib/use-visual-viewport-offset.ts`](lib/use-visual-viewport-offset.ts) — reused as-is for keyboard-aware drawers

## Behavior changes

- Swipe/dismiss animation differs from vaul; `repositionInputs` (vaul) has no direct equivalent
- `handleOnly` maps to `showSwipeHandle`; full handle-only drag semantics may differ slightly

## Verify by hand

- Open activity drawer on mobile grid; swipe to dismiss
- Navigate dates in drawer header; scroll activity list
- Open engagement prompt / mention picker drawer with keyboard visible
- Confirm engagement prompt does not open over an active drawer
