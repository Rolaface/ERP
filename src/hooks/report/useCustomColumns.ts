import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCustomFieldData,
  NAME_FIELD,
  type DocFieldMeta,
  type ReportColumn,
} from "../../api/project/report/report.api";
import { useReportColumnsStore } from "../../hooks/useReportColumnsStore";

type Row = Record<string, any>;

export interface CustomColumnDef {
  key: string;
  linkField: string;
  doctype: string;
  field: string;
  after: string;
  column: ReportColumn;
}

const EMPTY_DEFS: CustomColumnDef[] = [];
const EMPTY_ORDER: string[] = [];

export const makeCustomKey = (linkField: string, field: string) =>
  `__custom_${linkField}_${field}`;

const normalize = (s: string) => s.trim().toLowerCase();

export const isFieldInReport = (
  field: DocFieldMeta,
  baseColumns: ReportColumn[],
) =>
  field.fieldname === NAME_FIELD ||
  baseColumns.some(
    (c) =>
      c.fieldname === field.fieldname ||
      (!!c.positional && normalize(c.label) === normalize(field.label)),
  );

export function useCustomColumns(
  baseColumns: ReportColumn[],
  baseData: Row[],
  storageKey: string,
) {
  const defs =
    useReportColumnsStore((s) => s.reports[storageKey]?.defs) ?? EMPTY_DEFS;
  const order =
    useReportColumnsStore((s) => s.reports[storageKey]?.order) ?? EMPTY_ORDER;
  const storeAddDefs = useReportColumnsStore((s) => s.addDefs);
  const storeSetOrder = useReportColumnsStore((s) => s.setOrder);
  const storeReset = useReportColumnsStore((s) => s.reset);

  const [values, setValues] = useState<Record<string, Record<string, any>>>({});
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<Record<string, string>>({});

  const linkColumns = useMemo(
    () => baseColumns.filter((c) => c.fieldtype === "Link" && c.options),
    [baseColumns],
  );

  const activeDefs = useMemo(
    () =>
      baseColumns.length === 0
        ? EMPTY_DEFS
        : defs.filter((d) =>
            baseColumns.some((c) => c.fieldname === d.linkField),
          ),
    [defs, baseColumns],
  );

  useEffect(() => {
    if (!baseData.length) return;
    activeDefs.forEach((d) => {
      const names = [
        ...new Set(baseData.map((r) => r[d.linkField]).filter(Boolean)),
      ] as string[];
      const signature = names.join("|");
      if (fetchedRef.current[d.key] === signature) return;

      fetchedRef.current[d.key] = signature;
      getCustomFieldData(d.doctype, d.field, names)
        .then((result) => {
          if (fetchedRef.current[d.key] !== signature) return;
          setValues((p) => ({ ...p, [d.key]: result }));
        })
        .catch(() => {
          delete fetchedRef.current[d.key];
          setError(`Failed to load ${d.column.label}.`);
        });
    });
  }, [activeDefs, baseData]);

  const data = useMemo(
    () =>
      activeDefs.length === 0
        ? baseData
        : baseData.map((r) => {
            const extra: Row = {};
            activeDefs.forEach((d) => {
              extra[d.key] = values[d.key]?.[r[d.linkField]];
            });
            return { ...r, ...extra };
          }),
    [baseData, activeDefs, values],
  );

  const allColumns = useMemo(() => {
    const cols = [...baseColumns];
    activeDefs.forEach((d) => {
      const idx = cols.findIndex((c) => c.fieldname === d.after);
      cols.splice(idx >= 0 ? idx + 1 : cols.length, 0, d.column);
    });
    return cols;
  }, [baseColumns, activeDefs]);

  const addDefs = useCallback(
    (next: CustomColumnDef[]) => {
      setError(null);
      storeAddDefs(storageKey, next);
    },
    [storeAddDefs, storageKey],
  );

  const setOrder = useCallback(
    (next: string[]) => storeSetOrder(storageKey, next),
    [storeSetOrder, storageKey],
  );

  const reset = useCallback(() => {
    storeReset(storageKey);
    setValues({});
    setError(null);
    fetchedRef.current = {};
  }, [storeReset, storageKey]);

  return {
    defs: activeDefs,
    order,
    setOrder,
    linkColumns,
    allColumns,
    data,
    error,
    addDefs,
    reset,
  };
}