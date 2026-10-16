import { useCallback, useEffect, useRef, useState } from "react";
import { getAllProjects } from "../../../api/project/projectapi/project.api";
import { showApiError } from "../../../utils/alert";
import type { Column } from "../../../components/ui/Table/type";
import type { MultiSelectOption } from "../../../components/ui/modal/MultiSelectFilter";

type SortOrder = "asc" | "desc";
type Filter = [string, string, unknown];

export interface PmListConfig<T> {
  tableId: string;
  doctype: string;
  fields: string[];
  searchFields: string[];
  searchPlaceholder: string;
  columns: Column<T>[];
  defaultSort: string;
  defaultOrder?: SortOrder;
  baseFilters?: Filter[];
  statusField?: string;
  statusOptions?: MultiSelectOption[];
  /** Provide this for any doctype other than "Project" (Updates, Activity Type, ...) */
  fetchRows?: (search?: string) => Promise<T[]>;
}

const matchesFilter = (row: Record<string, any>, [field, op, value]: Filter) => {
  const v = row[field];
  const list = Array.isArray(value) ? value : [];
  switch (op) {
    case "=":
      return v === value;
    case "!=":
      return v !== value;
    case "in":
      return list.includes(v);
    case "not in":
      return !list.includes(v);
    case "<":
      return v != null && v < (value as any);
    case "<=":
      return v != null && v <= (value as any);
    case ">":
      return v != null && v > (value as any);
    case ">=":
      return v != null && v >= (value as any);
    case "is":
      return value === "not set" ? v == null || v === "" : v != null && v !== "";
    default:
      return true;
  }
};

export function usePmList<T>(config: PmListConfig<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(config.defaultSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    config.defaultOrder ?? "desc",
  );

  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestRef.current;
    setIsFetching(true);

    try {
      const search = searchTerm.trim() || undefined;
      let source: T[];

      if (config.fetchRows) {
        source = await config.fetchRows(search);
      } else if (config.doctype === "Project") {
        source = (await getAllProjects(search)) as T[];
      } else {
        throw new Error(
          `No data source for "${config.doctype}". Add fetchRows to its config.`,
        );
      }

      if (id !== requestRef.current) return;

      let filteredRows = source.filter((row) =>
        (config.baseFilters ?? []).every((f) =>
          matchesFilter(row as Record<string, any>, f),
        ),
      );

      if (config.statusField && statusFilter.length > 0) {
        filteredRows = filteredRows.filter((row) =>
          statusFilter.includes(
            String((row as Record<string, unknown>)[config.statusField!]),
          ),
        );
      }

      const total = filteredRows.length;
      const sortField = sortBy as keyof T;

      filteredRows = [...filteredRows].sort((a, b) => {
        const cmp = String(a[sortField] ?? "").localeCompare(
          String(b[sortField] ?? ""),
          undefined,
          { numeric: true, sensitivity: "base" },
        );
        return sortOrder === "asc" ? cmp : -cmp;
      });

      const start = (page - 1) * pageSize;
      setRows(filteredRows.slice(start, start + pageSize));
      setTotalItems(total);
    } catch (error) {
      if (id === requestRef.current) showApiError(error);
    } finally {
      if (id === requestRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [
    config.doctype,
    config.fetchRows,
    config.baseFilters,
    config.statusField,
    page,
    pageSize,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    void load();
    return () => {
      requestRef.current += 1;
    };
  }, [load]);

  const changeSearch = (query: string) => {
    setSearchTerm(query);
    setPage(1);
  };
  const changeStatusFilter = (values: string[]) => {
    setStatusFilter(values);
    setPage(1);
  };
  const changeSort = (field: string, order: SortOrder) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };
  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    rows,
    isInitialLoad,
    isFetching,
    reload: load,
    page,
    setPage,
    pageSize,
    changePageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    searchTerm,
    changeSearch,
    statusFilter,
    changeStatusFilter,
    sortBy,
    sortOrder,
    changeSort,
  };
}