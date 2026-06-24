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
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

const fetchAll = useCallback(async () => {
  try {
    setLoading(true);

    const start = (page - 1) * pageSize;

    const response = await getAllSalaryComponents(start, pageSize, search);

    setRows(response.data);
    setTotalItems(response.pagination.total);
    setTotalPages(response.pagination.total_pages);

  } catch (err: any) {
    showApiError(err?.message ?? "Failed to load salary components");
  } finally {
    setLoading(false);
  }
}, [page, pageSize, search]);

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
