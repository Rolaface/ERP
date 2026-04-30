import { createAxiosInstance } from "../api/axiosInstance";
import { ERP_BASE, API } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

/* ─────────────────────────────
   EMPLOYEE RESOLVER
───────────────────────────── */

export async function resolveEmployeeName(id: string): Promise<string> {
  if (!id) return "";

  try {
    const resp = await api.get(
      `${API.frappeUtilsAPI.getemployeeforAssetMovement}?search=${id}`
    );

    const list = resp?.data?.data ?? [];

    const found = list.find((emp: any) => emp.value === id);

    return found?.label || id;
  } catch (err) {
    console.error("resolveEmployeeName error:", err);
    return id;
  }
}

/* ─────────────────────────────
   BULK RESOLVER (OPTIONAL)
───────────────────────────── */

export async function resolveEmployeeMap(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  const result: Record<string, string> = {};

  await Promise.all(
    uniqueIds.map(async (id) => {
      result[id] = await resolveEmployeeName(id);
    })
  );

  return result;
}