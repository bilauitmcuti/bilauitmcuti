# dialog

2026-07-05, golden pair via CLI + manual restoration of project customizations.

## Changed

- [`components/ui/dialog.tsx`](components/ui/dialog.tsx): Migrated to `@base-ui/react/dialog` (Backdrop, Popup, Close with `render`). Restored `responsiveDialogContentClassName` export and `responsiveShellBgClassName` import from drawer.
- [`components/ui/responsive-overlay-shell.tsx`](components/ui/responsive-overlay-shell.tsx): No code change; import of `responsiveDialogContentClassName` works again.
- Leftover scan: clean.

## Left alone

- [`components/ui/drawer.tsx`](components/ui/drawer.tsx): vaul-based; not part of Radix migration.

## Behavior changes

- Base UI `initialFocus` / `finalFocus` differ from Radix `onOpenAutoFocus` / `onCloseAutoFocus` if used in future; no call sites currently use those props.

## Verify by hand

- Open engagement prompt / mention picker on desktop (dialog path in ResponsiveOverlayShell).
- Close via overlay click and Escape; confirm focus returns sensibly.
- Dialog with X button (other dialog usages): close button works.
