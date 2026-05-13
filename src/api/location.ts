import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE, API } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type LocationOption = {
  label: string;
  value: string;
};

export async function getLocationOptions(search?: string): Promise<LocationOption[]> {
  try {
    const params = new URLSearchParams();
    params.append("fields", JSON.stringify(["name"]));

    if (search?.trim()) {
      params.append("search", search.trim());
    }

    const resp: AxiosResponse = await api.get(
      `${API.frappeUtilsAPI.locationSearch}?${params.toString()}`
    );

    const raw = resp?.data?.data ?? [];

    return raw.map((item: any) => ({
      label: item.label,
      value: item.value,
    }));
  } catch {
    return [];
  }
}

export async function checkLocationExists(name: string): Promise<string | null> {
  const locationName = name.trim();
  if (!locationName) return null;

  try {
    const params = new URLSearchParams();
    params.append("fields", JSON.stringify(["name"]));
    params.append("search", locationName);

    const resp: AxiosResponse = await api.get(
      `${API.frappeUtilsAPI.locationSearch}?${params.toString()}`
    );

    const raw: any[] = resp?.data?.data ?? [];

    // Search API returns {value, label} — find exact case-insensitive match
    const match = raw.find(
      (item) =>
        (item.value ?? item.name ?? "").toLowerCase() ===
        locationName.toLowerCase()
    );

    return match ? (match.value ?? match.name) : null;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to check location"
    );
  }
}

export async function createLocation(name: string) {
  const locationName = name.trim();

  if (!locationName) {
    throw new Error("Location name is required");
  }

  try {
    const resp: AxiosResponse = await api.post(
      API.frappeUtilsAPI.createlocation,
      { location_name: locationName }
    );

    return resp.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to create location"
    );
  }
}