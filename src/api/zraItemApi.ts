import { API, ERP_BASE } from "../config/api";
import { createAxiosInstance } from "./axiosInstance";

const api = createAxiosInstance(ERP_BASE);
export const SELECT_RRP_ITEMS_PATH = API.getZraMTVAPI;


export interface ZraRrpItem {
  itemCd: string;
  itemClsCd: string;
  itemTyCd: string;
  itemNm: string;
  itemDesc: string;
  orgnNatCd: string;
  pkgUnitCd: string;
  qtyUnitCd: string;
  rrp: number;
  useYn: string;
  regrId?: string;
  regrNm?: string;
  modrNm?: string;
  modrId?: string;
  tax?: {
    name: string;
    title: string;
  };
}

interface ZraRrpItemsResponse {
  message?: {
    tpin?: string;
    bhfId?: string;
    data?: {
      itemList?: ZraRrpItem[];
    };
  };
}

export async function getZraRrpItems(
  manufacturerTpin: string,
): Promise<ZraRrpItem[]> {
  const params = new URLSearchParams({
    mfg_tpin: manufacturerTpin,
  });

  const response = await api.get<ZraRrpItemsResponse>(
    `${SELECT_RRP_ITEMS_PATH.getRrpItem}?${params.toString()}`
  );
  return response.data?.message?.data?.itemList ?? [];
}