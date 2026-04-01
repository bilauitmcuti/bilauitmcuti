export interface PublicHolidayOption {
  value: string;
  label: string;
}

export interface PublicHolidayMeta {
  apiVersion: string;
  baseUrl: string;
  defaultYear: number;
  yearOptions: PublicHolidayOption[];
  scopeOptions: PublicHolidayOption[];
  stateOptions: PublicHolidayOption[];
}

export interface PublicHolidayItem {
  id: string;
  name: string;
  date: string;
  day: string;
  /** `both` when federal + state rows were merged for the same name and date */
  scope: "federal" | "state" | "both";
  states: string[];
  isSubjectToChange: boolean;
}

export interface PublicHolidayResponse extends PublicHolidayMeta {
  query?: {
    state: string | null;
    scope: string | null;
  };
  total: number;
  holidays: PublicHolidayItem[];
}

export interface PublicHolidayRouteSelection {
  scope: "all" | "federal" | "state";
  state: string | null;
}
