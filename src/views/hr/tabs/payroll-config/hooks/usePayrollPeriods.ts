import { useCallback, useEffect, useState } from "react";
import { getAllPayrollPeriods, getPayrollPeriod, type PayrollPeriod } from "../../../../../api/payrollConfigApi";
import { showApiError } from "../../../../../utils/alert";

export function usePayrollPeriods() {
  const [rows, setRows] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const start = (page - 1) * pageSize;
      const response = await getAllPayrollPeriods(
        start,
        pageSize,
        search,
        sortBy,      
        sortOrder,     
      );
      setRows(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load payroll periods");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize, sortBy, sortOrder]); 

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchDetail = useCallback(async (name: string) => {
    try {
      return await getPayrollPeriod(name);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load payroll period details");
      return null;
    }
  }, []);

  return {
    rows, loading, search, setSearch,
    page, setPage, pageSize, setPageSize,
    totalPages, totalItems, fetchAll, fetchDetail,
    sortBy, setSortBy, sortOrder, setSortOrder,   
  };
}