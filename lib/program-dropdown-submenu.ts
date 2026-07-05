import type { Dispatch, SetStateAction } from "react";

export type SubmenuSetter = Dispatch<SetStateAction<string | null>>;

/** Switch submenu without briefly clearing active id when sibling closes. */
export function handleSubmenuOpenChange(
  id: string,
  open: boolean,
  setActiveSubmenu: SubmenuSetter
) {
  if (open) {
    setActiveSubmenu(id);
    return;
  }
  setActiveSubmenu((prev) => (prev === id ? null : prev));
}

/** Eagerly activate submenu on pointer/focus before sibling onOpenChange(false). */
export function activateSubmenu(id: string, setActiveSubmenu: SubmenuSetter) {
  setActiveSubmenu(id);
}
