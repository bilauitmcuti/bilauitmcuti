# tabs

2026-07-05, golden pair via CLI; custom `tabsListVariants` preserved.

## Changed

- [`components/ui/tabs.tsx`](components/ui/tabs.tsx): `@radix-ui/react-tabs` → `@base-ui/react/tabs`. `data-[state=active]` → `data-active` per class-mapping.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- Base UI defaults to manual tab activation (similar to Radix default). No `activationMode` call sites in project.

## Verify by hand

- Download page tabs: switch PWA / Bookmark tabs; active state and content update.
