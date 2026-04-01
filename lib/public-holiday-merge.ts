import type { PublicHolidayItem } from "@/lib/public-holiday-types";

function mergeKey(item: PublicHolidayItem): string {
  return `${item.date}|${item.name.trim()}`;
}

/**
 * Merges API rows that share the same holiday name and date (e.g. separate federal + state
 * entries) into a single item with combined `states` and `scope` metadata.
 */
export function mergePublicHolidaysByNameAndDate(
  holidays: PublicHolidayItem[]
): PublicHolidayItem[] {
  const groups = new Map<string, PublicHolidayItem[]>();
  for (const item of holidays) {
    const key = mergeKey(item);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const merged: PublicHolidayItem[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]!);
      continue;
    }

    const statesSet = new Set<string>();
    let hasFederal = false;
    let hasState = false;
    for (const row of group) {
      if (row.scope === "federal") hasFederal = true;
      if (row.scope === "state") hasState = true;
      row.states.forEach((s) => statesSet.add(s));
    }

    const states = Array.from(statesSet).sort((a, b) => a.localeCompare(b));
    const base = group[0]!;
    const scope: PublicHolidayItem["scope"] =
      hasFederal && hasState ? "both" : hasFederal ? "federal" : "state";

    merged.push({
      ...base,
      id: group
        .map((g) => g.id)
        .sort()
        .join("|"),
      states,
      scope,
      isSubjectToChange: group.some((g) => g.isSubjectToChange),
    });
  }

  merged.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.name.localeCompare(b.name);
  });

  return merged;
}
