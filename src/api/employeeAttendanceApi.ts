import { AxiosResponse } from "axios";
import { API, ERP_BASE } from "../config/api";
import { createAxiosInstance } from "./axiosInstance";


const api = createAxiosInstance(ERP_BASE);
export const EmployeeAPI = API.employee;

export async function postEmployeeAttendance(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(EmployeeAPI.employeeCheckInOut, payload);
  return resp.data;
}

// export async function getEmployeeByEmployeeId(id: string): Promise<any> {
//    const queryParams = new URLSearchParams({
//     filters: JSON.stringify({ employee: id }),
//     fields: JSON.stringify(["*"]),
//     order_by: "time asc",          
//    }).toString();

//   const url = `${EmployeeAPI.employeeCheckInOut}?${queryParams}`;
//   const resp: AxiosResponse = await api.get(url);
  
//   return resp.data;
// }
export async function getEmployeeByEmployeeId(id: string, customFilters?: any[]): Promise<any> {
   // Use custom filters if provided, otherwise default to just the employee ID
   const filtersToUse = customFilters && customFilters.length > 0 
     ? customFilters 
     : [["employee", "=", id]];

   const queryParams = new URLSearchParams({
    filters: JSON.stringify(filtersToUse),
    fields: JSON.stringify(["*"]),
    order_by: "time asc",          
   }).toString();

  const url = `${EmployeeAPI.employeeCheckInOut}?${queryParams}`;
  const resp: AxiosResponse = await api.get(url);
  
  return resp.data;
}

// export async function getAllEmployee(): Promise<any> {
//    const queryParams = new URLSearchParams({
//     fields: JSON.stringify(["*"]),
//     order_by: "time asc",          
//    }).toString();

//   const url = `${EmployeeAPI.employeeCheckInOut}?${queryParams}`;
//   const resp: AxiosResponse = await api.get(url);
  
//   return resp.data;
// }

export async function getAllEmployee(customFilters?: any[]): Promise<any> {
   const params: any = {
    fields: JSON.stringify(["*"]),
    order_by: "time asc",          
   };

   // Append filters if they are provided
   if (customFilters && customFilters.length > 0) {
     params.filters = JSON.stringify(customFilters);
   }

   const queryParams = new URLSearchParams(params).toString();

  const url = `${EmployeeAPI.employeeCheckInOut}?${queryParams}`;
  const resp: AxiosResponse = await api.get(url);
  
  return resp.data;
}