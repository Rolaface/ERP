// ─── useLeavePolicies.ts ─────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";

import {
  getAllLeavePolicies,
  type LeavePolicy,
} from "../../../../../api/leaveConfigApi";
import { showApiError } from "../../../../../utils/alert";
import { parseFrappeError } from "./parseFrappeError";

export function useLeavePolicies() {
  const [rows, setRows] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllLeavePolicies(); 
      
      const filtered = search
        ? data.filter((r) =>
            r.title?.toLowerCase().includes(search.toLowerCase()) || 
            r.name?.toLowerCase().includes(search.toLowerCase())
          )
        : data;
        
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(parseFrappeError(err) ||"Failed to load leave policies");
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