import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, CODES_BASE } from "../config/api";
const api = createAxiosInstance(CODES_BASE);
export const LookupAPI = API.lookup;
export const RolaLookupAPI = API.rolaLookup;

export async function getUnitOfMeasureList(): Promise<any> {
  const resp: AxiosResponse = await api.get(LookupAPI.getUnitOfMeasure);
  return resp.data || [];
}

export async function getItemClassList(): Promise<any> {
  const resp: AxiosResponse = await api.get(LookupAPI.getItemClasses);
  return resp.data || [];
}

export async function getPackagingUnitCodes(): Promise<any> {
  const resp: AxiosResponse = await api.get(LookupAPI.getPackagingUnits);
  return resp.data || [];
}

export async function getCountryList(): Promise<any> {
  const resp: AxiosResponse = await api.get(LookupAPI.getCountries);
  return resp.data || [];
}

// ROLAFACE LOOKUPS
export async function getRolaUnitOfMeasureList(): Promise<any> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getUnitOfMeasure);
  return resp.data || [];
}

export async function getRolaItemClassList(): Promise<any> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getItemClasses);
  return resp.data || [];
}

export async function getRolaPackagingUnitCodes(): Promise<any> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getPackagingUnits);
  return resp.data || [];
}

export async function getRolaCountryList(): Promise<any> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getCountries);
  return resp.data || [];
}
