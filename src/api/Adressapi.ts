import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const AddressAPI = API.Address;

export interface Address {
  id: string;
  title: string;
  type: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  email: string | null;
  phone: string | null;
  addressType: string;
}

export async function getAddressList(options: {
  company?: boolean;
  supplierId?: string;
  customerId?: string;
  addressType?: string;
}): Promise<Address[]> {
  try {
    let params: any = {};

    if (options.company === true) {
      params = { company: true };
    } 
    else if (options.customerId) {
      params = {
        customer: options.customerId,
        addressType: options.addressType || "",
      };
    } 
    else if (options.supplierId) {
      params = {
        supplier: options.supplierId,
        addressType: options.addressType || "",
      };
    } 
    else {
      return [];
    }

    const resp: AxiosResponse = await api.get(AddressAPI.getaddress, {
      params,
    });

    return resp.data?.data ?? [];
  } catch (error) {
    console.error("getAddressList error:", error);
    return [];
  }
}

// export async function getAddressById(id: string): Promise<Address | null> {
//   try {
//     const resp: AxiosResponse = await api.get(`${AddressAPI.getById}?id=${id}`);
//     return resp.data?.data ?? null;
//   } catch (error) {
//     console.error("getAddressById error:", error);
//     return null;
//   }
// }
