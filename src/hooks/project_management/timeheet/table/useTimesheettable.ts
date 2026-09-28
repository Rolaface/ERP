import { useCallback, useEffect, useState } from "react";
import {
  getAllTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheetById,
  submitTimesheet,

  cancelTimesheet,
} from "../../../../api/project/timesheet/timesheet.api";
import type { TimesheetEntry, TimesheetFilters } from"../../../../types/Project_Management/Timesheet/Table/timesheet.types";

// ── List ─────────────────────────────────────────────────────────

export function useTimesheetList(filters: TimesheetFilters) {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimesheets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllTimesheets(
        filters.page,
        filters.pageSize,
        filters.statuses.length ? filters.statuses : undefined,
        filters.search,
        filters.sortBy,
        filters.sortOrder,
      );
      setTimesheets(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load timesheets",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.page,
    filters.pageSize,
    filters.statuses,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
  ]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  return { timesheets, total, isLoading, error, refresh: loadTimesheets };
}

// ── Single record ────────────────────────────────────────────────

export function useTimesheetDetail(id?: string) {
  const [timesheet, setTimesheet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimesheet = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTimesheetById(id);
      setTimesheet(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load timesheet",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTimesheet();
  }, [loadTimesheet]);

  return { timesheet, isLoading, error, refresh: loadTimesheet };
}

// ── Mutations (create / update / submit / approve / cancel) ───────

export function useTimesheetActions() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setIsSaving(true);
      setError(null);
      try {
        return await fn();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Action failed",
        );
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const create = useCallback(
    (payload: any) => runAction(() => createTimesheet(payload)),
    [runAction],
  );

  const update = useCallback(
    (payload: any) => runAction(() => updateTimesheetById(payload)),
    [runAction],
  );

  const submit = useCallback(
    (id: string) => runAction(() => submitTimesheet(id)),
    [runAction],
  );



  const cancel = useCallback(
    (id: string) => runAction(() => cancelTimesheet(id)),
    [runAction],
  );

  return { create, update, submit, approve, cancel, isSaving, error };
}