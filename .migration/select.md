# select

2026-07-05, golden pair via CLI + consumer updates.

## Changed

- [`components/ui/select.tsx`](components/ui/select.tsx): `@radix-ui/react-select` → `@base-ui/react/select`. `SelectPrimitive.Icon asChild` → `render`. Kept `size` on `SelectTrigger`.
- [`components/feedback-form-page.tsx`](components/feedback-form-page.tsx): `position="popper"` → `alignItemWithTrigger={false}`; `onValueChange` widened for `string | null`; CSS var `--radix-select-trigger-width` → `w-(--anchor-width)`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- `onValueChange` signature gains optional `eventDetails` second arg; single-arg setters wrapped with null guard.

## Verify by hand

- Feedback form: open Who and Category selects, pick values, submit still validates.
