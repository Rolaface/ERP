import { useCallback, useEffect, useState } from "react";
import { getAllShiftTypes, type ShiftTypePayload } from "../../../../../api/shiftTypeApi";
import { showApiError } from "../../../../../utils/alert";

export interface ShiftType extends Partial<ShiftTypePayload> {
  name?: string; 
}

export function useShiftTypes() {
  const [rows, setRows] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllShiftTypes(); 
      
      const data = Array.isArray(response) ? response : (response?.data || []);
      
      const filtered = search
        ? data.filter((r: ShiftType) =>
            r.name?.toLowerCase().includes(search.toLowerCase())
          )
        : data;
        
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load shift types");
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