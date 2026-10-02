import { useEffect, useMemo, useRef, useState } from "react";
import { showApiError } from "../../../utils/alert";
import { useAuth } from "../../../context/AuthContext";
import { useCompanyDefaultsStore } from "../../../store/Companydefaultsstore";
import {
  getHolidayDayOffs,
  getLeaveDayOffs,
} from "../../../views/project_management/timesheet/components/dayOff.api";
import type {
  DayOff,
  DayOffLookup,
} from "../../../views/project_management/timesheet/components/dayOff.types";

type DayOffMap = Map<string, DayOff>;

interface LoadedRange {
  from: string;
  to: string;
  scope: string;
}

const OWN = "_";
const ALL_SCOPE = "all";
const EMPTY: DayOffMap = new Map();
const holidayCache = new Map<string, DayOffMap>();

const yearBounds = (from: string, to: string) => ({
  from: `${from.slice(0, 4)}-01-01`,
  to: `${to.slice(0, 4)}-12-31`,
});

const indexLeaves = (items: DayOff[], canViewAll: boolean): DayOffMap => {
  const map: DayOffMap = new Map();
  items.forEach((i) => {
    if (!canViewAll) {
      map.set(`${OWN}|${i.date}`, i);
      return;
    }
    if (i.employee) map.set(`${i.employee}|${i.date}`, i);
    if (i.employeeName) map.set(`${i.employeeName}|${i.date}`, i);
  });
  return map;
};

export const useDayOffs = (
  from: string,
  to: string,
  canViewAll: boolean,
): DayOffLookup => {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
  const listName = useCompanyDefaultsStore(
    (s) => s.defaults?.default_holiday_list,
  );
  const fetchDefaults = useCompanyDefaultsStore((s) => s.fetchDefaults);
  const [holidays, setHolidays] = useState<DayOffMap>(EMPTY);
  const [leaves, setLeaves] = useState<DayOffMap>(EMPTY);
  const loaded = useRef<LoadedRange | null>(null);

  useEffect(() => {
    fetchDefaults();
  }, [fetchDefaults]);

  useEffect(() => {
    if (!listName) {
      setHolidays(EMPTY);
      return;
    }
    const cached = holidayCache.get(listName);
    if (cached) {
      setHolidays(cached);
      return;
    }
    let cancelled = false;
   getHolidayDayOffs(listName)
  .then((items) => {
    if (cancelled) return;
    console.log(
      "HOLIDAY DEBUG",
      listName,
      "weekly:",
      items.filter((i) => i.kind === "weekly_off").length,
      "holidays:",
      items.filter((i) => i.kind === "company_holiday").length,
      "sat 2026-09-05:",
      items.find((i) => i.date === "2026-09-05"),
    );
    const map: DayOffMap = new Map(items.map((i) => [i.date, i]));
        holidayCache.set(listName, map);
        setHolidays(map);
      })
      .catch(showApiError);
    return () => {
      cancelled = true;
    };
  }, [listName]);

  useEffect(() => {
    if (!canViewAll && !employeeId) return;
    const scope = canViewAll ? ALL_SCOPE : (employeeId as string);
    const prev = loaded.current;
    if (prev && prev.scope === scope && from >= prev.from && to <= prev.to) {
      return;
    }
    const bounds = yearBounds(from, to);
    let cancelled = false;
    getLeaveDayOffs(bounds.from, bounds.to, canViewAll ? undefined : employeeId)
      .then((items) => {
        if (cancelled) return;
        loaded.current = { ...bounds, scope };
        setLeaves(indexLeaves(items, canViewAll));
      })
      .catch(showApiError);
    return () => {
      cancelled = true;
    };
  }, [from, to, canViewAll, employeeId]);

  return useMemo<DayOffLookup>(
    () => ({
      holidayOn: (date) => holidays.get(date),
      leaveOn: (date, employee) => leaves.get(`${employee ?? OWN}|${date}`),
    }),
    [holidays, leaves],
  );
};