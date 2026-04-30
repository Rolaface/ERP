import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE, API } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

/* ───────────────────────────────────────────── */
/* TYPES */
/* ───────────────────────────────────────────── */

export type AssetMovementOption = {
  label: string;
  value: string;
};

/* ───────────────────────────────────────────── */
/* CREATE ASSET MOVEMENT */
/* ───────────────────────────────────────────── */

export async function createAssetMovement(payload: any) {
  const resp: AxiosResponse = await api.post(
    API.Assets.Movement,
    { data: payload }
  );

  return resp.data;
}
/* ───────────────────────────────────────────── */
/* GET ALL MOVEMENTS */
/* ───────────────────────────────────────────── */

export async function getAssetMovements(paramsObj?: {
  fields?: string[];
  filters?: any[];
  search?: string;
  page?: number;
  page_size?: number;
}) {
  try {
    const params = new URLSearchParams();

    if (paramsObj?.fields?.length) {
      params.append("fields", JSON.stringify(paramsObj.fields));
    }

    if (paramsObj?.filters?.length) {
      params.append("filters", JSON.stringify(paramsObj.filters));
    }

    if (paramsObj?.search?.trim()) {
      params.append("search", paramsObj.search.trim());
    }

    if (paramsObj?.page && paramsObj?.page_size) {
      const start = (paramsObj.page - 1) * paramsObj.page_size;
      params.append("limit_start", String(start));
      params.append("limit_page_length", String(paramsObj.page_size));
    }

    const url = params.toString()
      ? `${API.Assets.Movement}?${params.toString()}`
      : API.Assets. Movement;

    const resp: AxiosResponse = await api.get(url);

    return resp?.data?.data ?? [];
  } catch (error) {
    console.error("GET ASSET MOVEMENT ERROR:", error);
    return [];
  }
}

/* ───────────────────────────────────────────── */
/* GET BY ID */
/* ───────────────────────────────────────────── */

export async function getAssetMovementById(name: string) {
  try {
    const resp: AxiosResponse = await api.get(
      `${API.Assets.Movement}/${name}`
    );

    return resp?.data?.data;
  } catch (error: any) {
    throw error;
  }
}

/* ───────────────────────────────────────────── */
/* UPDATE */
/* ───────────────────────────────────────────── */

export async function updateAssetMovement(name: string, payload: any) {
  try {
    const resp: AxiosResponse = await api.put(
      `${API.Assets.Movement}/${name}`,
      payload
    );

    return resp.data;
  } catch (error: any) {
    throw error;
  }
}

/* ───────────────────────────────────────────── */
/* DELETE */
/* ───────────────────────────────────────────── */

export async function deleteAssetMovement(name: string) {
  try {
    const resp: AxiosResponse = await api.delete(
      `${API.Assets.Movement}/${name}`,
      {
        data: {
          doctype: "Asset Movement",
          name,
        },
      }
    );

    return resp.data;
  } catch (error: any) {
    throw error;
  }
}

export type EmployeeOption = {
  label: string;
  value: string;
};

export async function getEmployeeOptions(search?: string): Promise<EmployeeOption[]> {
  try {
    const params = new URLSearchParams();

    if (search?.trim()) {
      params.append("search", search.trim());
    }

    const resp: AxiosResponse = await api.get(
      `${API.frappeUtilsAPI.getemployeeforAssetMovement}?${params.toString()}`
    );

    const raw = resp?.data?.data ?? [];

    return raw.map((item: any) => ({
  label: item.label,   
  value: item.value,   
}));
  } catch (error) {
    console.error("GET EMPLOYEE OPTIONS ERROR:", error);
    return [];
  }
}