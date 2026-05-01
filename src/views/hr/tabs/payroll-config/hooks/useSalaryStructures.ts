import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAllSalaryComponents,
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
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [allComponents, setAllComponents] = useState<SalaryComponent[]>([]);

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
      const [structures, components] = await Promise.all([
        getAllSalaryStructures(),
        getAllSalaryComponents(),
      ]);
      setAllComponents(components);

      const filtered = search
        ? structures.filter((r) =>
            r.name?.toLowerCase().includes(search.toLowerCase()),
          )
        : structures;
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load salary structures");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

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
  };
}
