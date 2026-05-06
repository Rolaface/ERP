import { useCallback, useEffect, useState } from "react";

import {
  getAllTaxConfigs,
  getTaxConfig,
  type TaxConfig,
} from "../../../../../api/payrollConfigApi";
import { showApiError } from "../../../../../utils/alert";

export function useTaxConfigs() {
  const [rows, setRows] = useState<TaxConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTaxConfigs();
      const filtered = search
        ? data.filter((r) =>
            r.name?.toLowerCase().includes(search.toLowerCase()),
          )
        : data;
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load tax configurations");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchDetail = useCallback(async (name: string) => {
    try {
      return await getTaxConfig(name);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load tax configuration details");
      return null;
    }
  }, []);

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
    fetchDetail,
  };
}
