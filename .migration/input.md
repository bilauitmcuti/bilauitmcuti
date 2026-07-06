# input

2026-07-06, golden pair via CLI (`shadcn add input --overwrite`), migrated to `@base-ui/react/input`

## Changed

- [`components/ui/input.tsx`](components/ui/input.tsx): native `<input>` → `InputPrimitive` from `@base-ui/react/input`; CSS classes unchanged
- Leftover scan: clean (no radix imports)

## Left alone

- [`components/ui/input-group.tsx`](components/ui/input-group.tsx) — updated separately; imports `Input` from this wrapper

## Behavior changes

None flagged. Base UI Input renders a native `<input>`; `InputGroupAddon` `querySelector("input")` focus delegation unchanged.

## Verify by hand

- Chat composer input group focus when clicking addon area
- Feedback form text fields if any use raw `Input`
