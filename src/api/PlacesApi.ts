import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, CODES_BASE } from "../config/api";
const api = createAxiosInstance(CODES_BASE);
export const PlacesAPI = API.places;

export async function getCountry(q: string = ""): Promise<any> {
  const resp: AxiosResponse = await api.get(PlacesAPI.getCountry, {
    params: { q },
  });
  return resp.data;
}

export async function getProvinces(q: string) {
  const resp = await api.get(PlacesAPI.getProvinces, {
    params: { q },
  });
  return resp.data;
}

export async function getTowns(q: string) {
  const resp = await api.get(PlacesAPI.getTown, {
    params: { q },
  });
  return resp.data;
}
