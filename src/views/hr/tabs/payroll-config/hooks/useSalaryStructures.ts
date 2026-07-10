import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getSalaryComponentOptions,
  getAllSalaryStructures,
  getSalaryStructure,
  type SalaryComponent,
  type SalaryStructure,
} from "../../../../../api/payrollConfigApi";
import { showApiError } from "../../../../../utils/alert";

export function useSalaryStructures() {
  const [rows, setRows] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [allComponents, setAllComponents] = useState<SalaryComponent[]>([]);

 
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const earningComponents = useMemo(
    () =>
      allComponents
        .filter((c) => c.type === "Earning")
        .map((c) => c.salary_component),
    [allComponents],
  );
  const deductionComponents = useMemo(
    () =>
      allComponents
        .filter((c) => c.type === "Deduction")
        .map((c) => c.salary_component),
    [allComponents],
  );

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const start = (page - 1) * pageSize;
      const [response, components] = await Promise.all([
        getAllSalaryStructures(start, pageSize, search, sortBy, sortOrder), 
        getSalaryComponentOptions(),
      ]);
      setAllComponents(components);
      setRows(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load salary structures");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize, sortBy, sortOrder]); 

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchDetail = useCallback(async (name: string) => {
    try {
      return await getSalaryStructure(name);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load structure details");
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
    earningComponents,
    deductionComponents,
    fetchAll,
    fetchDetail,
    sortBy,      
    setSortBy,     
    sortOrder,      
    setSortOrder,   
  };
}