# input-group

2026-07-06, golden pair via CLI (`shadcn add input-group --overwrite`), depends on migrated `input` + `textarea`

## Changed

- [`components/ui/input-group.tsx`](components/ui/input-group.tsx): `InputGroupTextarea` — removed `forwardRef`; `InputGroupButton` — tightened `type` prop typing; formatting aligned with registry
- [`components/ui/button.tsx`](components/ui/button.tsx): shadcn dependency install briefly removed `data-variant`/`data-size` — **restored** (prior migration customization)
- Leftover scan: clean (no radix imports)

## Left alone

- [`components/chat/chat-composer.tsx`](components/chat/chat-composer.tsx) — no import changes; still passes `ref={textareaRef}` to `InputGroupTextarea`

## Behavior changes

None flagged. React 19 ref-as-prop should preserve composer ref behavior.

## Verify by hand

- Chat composer: focus, auto-resize, mention picker, send button
- Input group addon click focuses inner input
