import { AxiosResponse } from "axios";
import { API, ERP_BASE } from "../config/api";
import { createAxiosInstance } from "./axiosInstance";


const api = createAxiosInstance(ERP_BASE);
export const EmployeeAPI = API.employee;

export async function postEmployeeAttendance(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(EmployeeAPI.employeeCheckInOut, payload);
  return resp.data;
}

export async function getEmployeeByEmployeeId(id: string): Promise<any> {
   const queryParams = new URLSearchParams({
    filters: JSON.stringify({ employee: id }),
    fields: JSON.stringify(["*"]),
    order_by: "time asc",          
   }).toString();

  const url = `${EmployeeAPI.employeeCheckInOut}?${queryParams}`;
  const resp: AxiosResponse = await api.get(url);
  
  return resp.data;
}