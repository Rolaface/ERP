import { useCallback } from "react";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE, API } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type Option = { label: string; value: string };

export function useAccountSearch() {
  const fetchAccounts = useCallback(async (q: string): Promise<Option[]> => {
    try {
      const filters: any[] = [["is_group", "=", "0"]];

      if (q && q.length >= 2) {
        filters.push(["name", "like", `%${q}%`]);
      }

      const params = new URLSearchParams();
      params.append("filters", JSON.stringify(filters));

      const resp = await api.get(
        `${API.Account.getAccountsResource}?${params.toString()}`
      );

      const raw = resp?.data?.data ?? [];

      return raw.map((item: any) => ({
        label: item.name,
        value: item.name,
      }));
    } catch {
      return [];
    }
  }, []);

  return { fetchAccounts };
}
