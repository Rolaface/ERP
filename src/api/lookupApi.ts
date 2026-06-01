import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
import { useParams } from "react-router-dom";
const api = createAxiosInstance(ERP_BASE);
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
export async function getRolaUnitOfMeasureList(
  limitStart: number = 0,
  limitLength: number = 500,
): Promise<any[]> {
  const resp = await api.get(API.rolaLookup.getUnitOfMeasure, {
    params: {
      limit_start: limitStart,
      limit_page_length: limitLength,
    },
  });

  return resp.data?.data || [];
}

export async function getRolaItemClassList(): Promise<any> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getItemClasses);
  return resp.data || [];
}

export async function getRolaPackagingUnitCodes(): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getPackagingUnits);
  return resp.data?.message?.data || [];
}

export async function getRolaCountryList(): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getCountries);
  return resp.data?.data || [];
}

interface SearchApiParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export async function getCompanyPayableAccounts(params: SearchApiParams = {}): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getCompanyPayableAccounts, { params });
  return resp.data.message?.data || resp.data?.data || [];
}

export async function getCompanyRecievableAccounts(params: SearchApiParams = {}): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getCompanyRecievableAccounts, { params });
  return resp.data.message?.data || resp.data?.data || [];
}

export async function getCompanyCostCenters(params: SearchApiParams = {}): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getCompanyCostCenter, { params });
  return resp.data.message?.data || resp.data?.data || [];
}

export async function getCustomerList(params: SearchApiParams = {}): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getCustomer, { params });
  return resp.data.message?.data || resp.data?.data || [];
}

export async function getCustomerListJe(params: SearchApiParams = {}): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getCustomer, { params });
  return resp.data?.data || [];
}

export async function getSupplierList(params: SearchApiParams = {}): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getSupplier, { params });
  return resp.data.message?.data || resp.data?.data || [];
}

export async function getCurrencyList(params: SearchApiParams = {}): Promise<any[]> {
  const resp = await api.get(RolaLookupAPI.getCurrency, { params });
  return resp.data?.data || [];
}

export async function getItemGroupList(params: SearchApiParams = {}): Promise<any[]> {
  const resp: AxiosResponse = await api.get(RolaLookupAPI.getItemGroups, { params });
  return resp.data.message?.data || [];
}