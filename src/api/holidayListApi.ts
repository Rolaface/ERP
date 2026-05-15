import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const HolidayListAPI = API.holidayList;

// --- Interfaces ---
export interface WeeklyOff {
  weekday: string;
  is_half_day?: boolean;
}

export interface Holiday {
  holiday_date: string;
  description: string;
  is_half_day?: boolean;
}

export interface HolidayListPayload {
  holiday_list_name: string;
  from_date: string; // YYYY-MM-DD
  to_date: string;   // YYYY-MM-DD
  country?: string;
  weekly_offs?: WeeklyOff[];
  holidays?: Holiday[];
}

// --- API Methods ---

export async function createHolidayList(payload: HolidayListPayload): Promise<any> {
  const resp: AxiosResponse = await api.post(HolidayListAPI.create, payload);
  return resp.data;
}

export async function getAllHolidayLists(): Promise<any> {
  const resp: AxiosResponse = await api.get(HolidayListAPI.getAll);
  return resp.data;
}

export async function getHolidayListByName(name: string): Promise<any> {
  const url = `${HolidayListAPI.getByName}?name=${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data;
}

export async function updateHolidayList(
  name: string,
  payload: Partial<HolidayListPayload>
): Promise<any> {
  const url = `${HolidayListAPI.update}?name=${encodeURIComponent(name)}`;
  // Using PUT or PATCH as defined in your python whitelist ["PUT", "PATCH"]
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data;
}

export async function deleteHolidayListByName(name: string): Promise<any> {
  const url = `${HolidayListAPI.delete}?name=${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

export async function assignDefaultHolidayListToCompany(payload: {
  company?: string;
  holiday_list: string;
}): Promise<any> {
  const resp: AxiosResponse = await api.post(
    HolidayListAPI.assignToCompany,
    payload
  );
  return resp.data;
}