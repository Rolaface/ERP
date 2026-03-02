import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const CompanyAPI = API.company;

export async function createCompany(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(CompanyAPI.create, payload);
  return resp.data;
}

export async function getAllCompanies(): Promise<any> {
  const resp: AxiosResponse = await api.get(CompanyAPI.getAll);
  return resp.data || [];
}

export async function getCompanyById(id: string): Promise<any> {
  const url = `${CompanyAPI.getById}?custom_company_id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data ?? null;
}

export async function updateCompanyById(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(CompanyAPI.updateById, payload);

  return resp.data;
}

export async function deleteCompanyById(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.delete(CompanyAPI.delete, {
    data: payload,
  });
  return resp.data;
}

export async function updateAccountsCompany(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.put(CompanyAPI.updateAccounts, payload);
  return resp.data;
}
/**
 * Update company files (logo and signature)
 */
export async function updateCompanyFiles(
  companyId: string,
  logoFile?: File | null,
  signatureFile?: File | null
): Promise<any> {
  const formData = new FormData();
  
  
  formData.append("id", companyId);
  
 
  if (logoFile) {
    formData.append("documents[companyLogoUrl]", logoFile);
  }
  

  if (signatureFile) {
    formData.append("documents[authorizedSignatureUrl]", signatureFile);
  }
  
  
  const resp: AxiosResponse = await api.patch(
    CompanyAPI.updateCompanyFiles,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  
  return resp.data;
}
export async function deleteCompanyBankAccount(
  companyId: string,
  bankAccountId: string | number
): Promise<any> {
  const resp: AxiosResponse = await api.delete(
    CompanyAPI.deleteCompanyBankAccount,
    {
      data: {
        companyId: companyId,
        accountId: bankAccountId,
      },
    }
  );

  return resp.data;
}