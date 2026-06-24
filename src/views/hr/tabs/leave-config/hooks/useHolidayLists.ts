// src/views/hr/tabs/leave-config/hooks/useHolidayLists.ts
import { useCallback, useEffect, useState } from "react";

import {
  getAllHolidayLists,
  type HolidayListPayload,
} from "../../../../../api/holidayListApi";
import { showApiError } from "../../../../../utils/alert";

export interface HolidayList extends HolidayListPayload {
  name?: string; 
}

export function useHolidayLists() {
  const [rows, setRows] = useState<HolidayList[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllHolidayLists(); 
      
      // Extract the array from the backend's wrapper object
      // Fallback to empty array if response.data is undefined
      const data = Array.isArray(response) ? response : (response?.data || []);
      
      const filtered = search
        ? data.filter((r: HolidayList) =>
            r.holiday_list_name?.toLowerCase().includes(search.toLowerCase()) || 
            r.name?.toLowerCase().includes(search.toLowerCase())
          )
        : data;
        
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load holiday lists");
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