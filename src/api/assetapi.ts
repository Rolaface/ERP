import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
import { buildListParams } from "../api/utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);

/* ───────────────────────────────────────────── */
/* TYPES */
/* ───────────────────────────────────────────── */

export type AssetOption = {
  label: string;
  value: string;
};

export interface CreateAssetPayload {
  asset_name: string;
  item_code: string;
  asset_category: string;
  location: string;
  asset_type: string;

  maintenance_required: 0 | 1;
  calculate_depreciation: 0 | 1;

  purchase_receipt: string;
  net_purchase_amount: number;
  purchase_invoice: string;
  asset_quantity: number;
  available_for_use_date: string;

  cost_center?: string;

  asset_owner: string;
  asset_owner_company: string;

  policy_number?: string;
  insurance_start_date?: string;
  insurer?: string;
  insurance_end_date?: string;
  insured_value?: number;
  comprehensive_insurance?: 0 | 1;

  status: string;
  custodian?: string;
  department?: string;
}

/* ───────────────────────────────────────────── */
/* CREATE ASSET */
/* ───────────────────────────────────────────── */

export async function createAsset(payload: CreateAssetPayload) {
  try {
    const resp: AxiosResponse = await api.post(
      API.Assets.create,
      payload
    );

    return resp.data;
  } catch (error: any) {
  throw error;
}
}

/* ───────────────────────────────────────────── */
/* GET ALL ASSETS */
/* ───────────────────────────────────────────── */

export async function getAssets(paramsObj?: {
  fields?: string[];
  filters?: any[];
  search?: string;
  page?: number;
  page_size?: number;
}) {
  try {
    const start = paramsObj?.page && paramsObj?.page_size
      ? (paramsObj.page - 1) * paramsObj.page_size
      : undefined;

    const query = buildListParams({
      fields: paramsObj?.fields ?? ["name"],
      start,
      pageSize: paramsObj?.page_size,
      search: paramsObj?.search,
      searchFields: ["name", "asset_category", "location"],
    });

    const resp: AxiosResponse = await api.get(`${API.Assets.getall}?${query}`);
    return resp?.data?.data ?? [];
  } catch (error) {
    console.error("GET ASSETS ERROR:", error);
    return [];
  }
}

/* ───────────────────────────────────────────── */
/* DELETE ASSET */
/* ───────────────────────────────────────────── */

export async function deleteAsset(name: string) {
  try {
    const resp: AxiosResponse = await api.delete(
      API.Assets.delete,
      {
        data: {
          doctype: "Asset",
          name,
        },
      }
    );

    return resp.data;
  } 
   catch (error: any) {
  throw error;
}
}

/* ───────────────────────────────────────────── */
/* GET ASSET OPTIONS (dropdown) */
/* ───────────────────────────────────────────── */

export async function getAssetOptions(search?: string): Promise<AssetOption[]> {
  try {
    const params = new URLSearchParams();

    params.append("fields", JSON.stringify(["name"]));

    if (search?.trim()) {
      params.append("search", search.trim());
    }

    const resp: AxiosResponse = await api.get(
      `${API.Assets.getall}?${params.toString()}`
    );

    const raw = resp?.data?.data ?? [];

    return raw.map((item: any) => ({
      label: item.name,
      value: item.name,
    }));
  } catch {
    return [];
  }
}
/* ───────────────────────────────────────────── */
/* GET ITEM CODE OPTIONS (for Fixed Asset) */
/* ───────────────────────────────────────────── */

export type ItemOption = {
  label: string;
  value: string;
};

export async function getItemCodeOptions(search?: string): Promise<ItemOption[]> {
  try {
    const params = new URLSearchParams();

    if (search?.trim()) {
      params.append("search", search.trim());
    }

    
    params.append("is_fixed_asset", "1");

    const resp: AxiosResponse = await api.get(
      `${API.frappeUtilsAPI.getitemcodeforFaixedAsset}?${params.toString()}`
    );

    const raw = resp?.data?.data ?? [];

    return raw.map((item: any) => ({
      label: `${item.label} (${item.value})`,
      value: item.value,
    }));
  } catch (error) {
    console.error("GET ITEM CODE ERROR:", error);
    return [];
  }
}
/* ───────────────────────────────────────────── */
/* GET ASSET BY ID */
/* ───────────────────────────────────────────── */

export async function getAssetById(name: string) {
  try {
    const resp: AxiosResponse = await api.get(
      `${API.Assets.getall}/${name}`
    );

    return resp?.data?.data;
  } catch (error: any) {
    throw error;
  }
}
/* ───────────────────────────────────────────── */
/* UPDATE ASSET */
/* ───────────────────────────────────────────── */

export async function updateAsset(name: string, payload: any) {
  try {
    const resp: AxiosResponse = await api.put(
      `${API.Assets.getall}/${name}`,
      payload
    );

    return resp.data;
  } catch (error: any) {
    throw error;
  }
}

export async function updateAssetStatus(
  name: string,
  docstatus: 0 | 1 | 2
) {
  try {
    const resp: AxiosResponse = await api.put(
      `${API.Assets.getall}/${name}`,
      {
        docstatus,
      }
    );

    return resp.data;
  } catch (error: any) {
    throw error;
  }
}
export const submitAsset = (name: string) =>
  updateAssetStatus(name, 1);

export const cancelAsset = (name: string) =>
  updateAssetStatus(name, 2);

