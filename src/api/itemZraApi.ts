import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const LookupAPI = API.lookup;
export const RolaLookupAPI = API.rolaLookup;
// Generic function to avoid repeating code
export async function fetchList(endpoint: string): Promise<any> {
  const resp: AxiosResponse = await api.get(endpoint);
  return resp.data;
}

export const getPackagingUnits = () => fetchList(LookupAPI.getPackagingUnits);
export const getCountries = () => fetchList(LookupAPI.getCountries);
export const getUOMs = () => fetchList(LookupAPI.getUnitOfMeasure);
export const getItemClasses = () => fetchList(LookupAPI.getItemClasses);

export const getRolaPackagingUnits = () =>
  fetchList(RolaLookupAPI.getPackagingUnits);
export const getRolaCountries = () => fetchList(RolaLookupAPI.getCountries);
export const getRolaUOMs = () => fetchList(RolaLookupAPI.getUnitOfMeasure);
export const getRolaItemClasses = () => fetchList(RolaLookupAPI.getItemClasses);
