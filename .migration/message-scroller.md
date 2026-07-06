# message-scroller

2026-07-06, golden pair via CLI (`shadcn add message-scroller --overwrite`), `@shadcn/react` primitive + lucide icon

## Changed

- [`components/ui/message-scroller.tsx`](components/ui/message-scroller.tsx):
  - Viewport: reverted to `scroll-fade` (from `scroll-fade-b`) — bottom-only mask could leave a visible line after theme switch; focus ring removed
  - Button: `inset-s-1/2`, RTL `translate-x-1/2`, simplified motion classes; `render` default without extra Button `className`
  - Kept `ArrowDownIcon` from `lucide-react` (matches project `iconLibrary`)
- [`app/globals.css`](app/globals.css): comment updated (`scroll-fade-b` on MessageScroller)
- [`components/ui/button.tsx`](components/ui/button.tsx): dependency install briefly stripped `data-variant`/`data-size` — **restored**
- Leftover scan: clean (no radix / IconPlaceholder)

## Left alone

- Chat consumers: [`chat-transcript.tsx`](components/chat/chat-transcript.tsx), [`chat-message-row.tsx`](components/chat/chat-message-row.tsx), [`chat-scroll-sync.tsx`](components/chat/chat-scroll-sync.tsx) — API unchanged

## Behavior changes

- Bottom edge fade uses `scroll-fade-b` (may look slightly different)
- Jump button: restored `left-1/2` + explicit `translate-x-[-50%]` on active states — registry `inset-s-1/2` + `translate-y-0` dropped horizontal centering in chat
- Scrollbar hidden during autoscroll via transparent thumb/track

## Verify by hand

- Chat transcript auto-scroll while streaming
- Scroll up → “Scroll to end” button appears and works
- Long transcript scroll performance (content-visibility items)
