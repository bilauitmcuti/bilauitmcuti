# textarea

2026-07-06, golden pair via CLI (`shadcn add textarea --overwrite`), React 19 ref-as-prop pattern

## Changed

- [`components/ui/textarea.tsx`](components/ui/textarea.tsx): removed `React.forwardRef`; plain function with `...props` spread to `<textarea>` (React 19 forwards `ref` via props)
- Leftover scan: clean (no radix imports)

## Left alone

- Native `<textarea>` element (no `@base-ui/react/textarea` in registry)

## Behavior changes

None flagged. Ref chain `InputGroupTextarea` → `Textarea` → DOM must be verified in chat composer.

## Verify by hand

- Chat composer: auto-grow height, mention `@` insert + caret restore via `textareaRef`
- Feedback form and engagement prompt textareas
