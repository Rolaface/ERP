import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const HolidayAPI = API.holidays;

/* 
   GET HOLIDAYS (Paginated)
 */
export async function getAllHolidays(page = 1, pageSize = 20): Promise<any> {
  const url = `${HolidayAPI.getAll}?page=${page}&page_size=${pageSize}`;

  const resp: AxiosResponse = await api.get(url);

  return resp.data;
}

/* 
   CREATE HOLIDAY
 */
export async function createHoliday(payload: {
  name: string;
  fromDate: string;
  toDate: string;
}): Promise<any> {
  const resp: AxiosResponse = await api.post(HolidayAPI.create, payload);

  return resp.data;
}

/* 
   UPDATE HOLIDAY
 */
export async function updateHoliday(payload: {
  id: number | string;
  name: string;
  fromDate: string;
  toDate: string;
}): Promise<any> {
  const resp: AxiosResponse = await api.put(HolidayAPI.update, payload);

  return resp.data;
}

/* 
   DELETE HOLIDAY
 */
export async function deleteHoliday(payload: {
  id: number | string;
}): Promise<any> {
  const resp: AxiosResponse = await api.delete(HolidayAPI.delete, {
    data: payload,
  });

  return resp.data;
}
