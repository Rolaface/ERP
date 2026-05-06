import { useCallback, useEffect, useState } from "react";

import {
  getAllSalaryComponents,
  type SalaryComponent,
} from "../../../../../api/payrollConfigApi";
import { showApiError } from "../../../../../utils/alert";

export function useSalaryComponents() {
  const [rows, setRows] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSalaryComponents();
      const filtered = search
        ? data.filter(
            (r) =>
              r.salary_component
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
              r.salary_component_abbr
                ?.toLowerCase()
                .includes(search.toLowerCase()),
          )
        : data;
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load salary components");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    rows,
    loading,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    fetchAll,
  };
}
