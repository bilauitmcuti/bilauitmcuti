# alert

2026-07-06, golden pair via CLI (`shadcn add alert --overwrite`), aligned with base-vega registry

## Changed

- [`components/ui/alert.tsx`](components/ui/alert.tsx): `AlertTitle` — removed `font-heading` (registry uses `font-medium` only)
- Leftover scan: clean (no radix imports)

## Left alone

- No app consumers import `Alert` yet (wrapper only)

## Behavior changes

- Alert titles no longer use heading font when `Alert` is adopted later

## Verify by hand

- N/A until `Alert` is used in UI
