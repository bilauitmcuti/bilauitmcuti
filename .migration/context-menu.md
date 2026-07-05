# context-menu

2026-07-05, golden pair via CLI + consumer trigger update.

## Changed

- [`components/ui/context-menu.tsx`](components/ui/context-menu.tsx): `@radix-ui/react-context-menu` → `@base-ui/react/context-menu`.
- [`components/chat/chat-message-row.tsx`](components/chat/chat-message-row.tsx): `ContextMenuTrigger asChild` → `render={<Bubble .../>}`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- Radix `modal` on Root removed in Base UI (not used in project).
- Menu items default `closeOnClick` false on checkbox/radio variants (not used here).

## Verify by hand

- Chat: right-click (or long-press) user message bubble; context menu opens; copy action works.
