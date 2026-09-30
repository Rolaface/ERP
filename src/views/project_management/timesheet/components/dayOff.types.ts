export type DayOffKind = "company_holiday" | "weekly_off" | "leave";

export interface DayOff {
  date: string; // YYYY-MM-DD
  kind: DayOffKind;
  label: string;
  employee?: string;
  employeeName?: string;
  halfDay?: boolean;
}

export interface DayOffLookup {
  holidayOn: (date: string) => DayOff | undefined;

  leaveOn: (date: string, employee?: string) => DayOff | undefined;
}