import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const ShiftTypeAPI = API.shiftType


export interface ShiftTypePayload {
  name: string;
  start_time: string;
  end_time: string;
  color?: string;
  enable_auto_attendance?: number | boolean;
  determine_check_in_and_check_out?: string;
  working_hours_calculation_based_on?: string;
  begin_check_in_before_shift_start_time?: number;
  allow_check_out_after_shift_end_time?: number;
  mark_auto_attendance_on_holidays?: number | boolean;
  working_hours_threshold_for_half_day?: number;
  working_hours_threshold_for_absent?: number;
  process_attendance_after?: string; // YYYY-MM-DD
  last_sync_of_checkin?: string; // YYYY-MM-DD HH:mm:ss
  auto_update_last_sync?: number | boolean;
  enable_late_entry_marking?: number | boolean;
  late_entry_grace_period?: number;
  enable_early_exit_marking?: number | boolean;
  early_exit_grace_period?: number;
  allow_overtime?: number | boolean;
  overtime_type?: string;
}

export async function createShiftType(payload: ShiftTypePayload): Promise<any> {
  const url = ShiftTypeAPI.create || ShiftTypeAPI.create;
  const resp: AxiosResponse = await api.post(url, payload);
  return resp.data;
}

export async function getAllShiftTypes(): Promise<any> {
  const url = ShiftTypeAPI.getAll || ShiftTypeAPI.getAll;
  const params = {
    fields: JSON.stringify(["name", "start_time", "end_time"])
  };
  const resp: AxiosResponse = await api.get(url, { params });
  return resp.data;
}

export async function getShiftTypeByName(name: string): Promise<any> {
  const baseUrl = ShiftTypeAPI.getByName || ShiftTypeAPI.getByName;
  const url = `${baseUrl}/${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data;
}

export async function updateShiftType(
  name: string,
  payload: Partial<ShiftTypePayload>
): Promise<any> {
  const baseUrl = ShiftTypeAPI.update || ShiftTypeAPI.update;
  const url = `${baseUrl}/${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data;
}

export async function deleteShiftType(name: string): Promise<any> {
  const baseUrl = ShiftTypeAPI.delete || ShiftTypeAPI.delete;
  const url = `${baseUrl}/${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}