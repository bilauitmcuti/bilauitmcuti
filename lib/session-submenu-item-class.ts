import { cn } from '@/lib/utils';

/** Session rows in program dropdown: no accent hover/focus on label spans (overrides DropdownMenuItem focus:**:text-accent-foreground). */
export function sessionSubmenuItemClass(isSelected: boolean) {
  return cn(
    'relative cursor-pointer items-start pl-8 bg-transparent',
    'focus:bg-transparent focus-visible:bg-transparent data-[highlighted]:bg-transparent',
    'focus:[&_*]:!text-inherit data-[highlighted]:[&_*]:!text-inherit',
    isSelected
      ? 'text-primary focus:text-primary data-[highlighted]:text-primary'
      : 'text-foreground focus:text-foreground data-[highlighted]:text-foreground'
  );
}
