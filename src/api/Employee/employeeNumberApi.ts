import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);
export const EmployeeNumberAPI = API.employee;

// ── Types ────────────────────────────────────────────────────────

export type EmployeeNumberAvailability = {
  employee_number: string;
  is_available: boolean;
  existing_employee_id: string | null;
  existing_employee_number: string | null;
};

// ── API calls ────────────────────────────────────────────────────

export async function getNextEmployeeNumber(): Promise<any> {
  const resp: AxiosResponse = await api.get(EmployeeNumberAPI.getNextEmployeeNumber);
  return resp.data;
}

export async function checkEmployeeNumberAvailability(
  employeeNumber: string,
  excludeEmployeeId?: string,
): Promise<any> {
  const resp = await api.get(EmployeeNumberAPI.checkEmployeeNumber, {
    params: {
      employee_number: employeeNumber,
      ...(excludeEmployeeId
        ? { exclude_employee_id: excludeEmployeeId }
        : {}),
    },
  });

  return resp.data;
}