import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const EmployeeAPI = API.employeeDocumnet;



export async function getEmployeeDocuments(employeeId: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${EmployeeAPI.getDocuments}?id=${employeeId}`
  );
  return resp.data;
}


// 2. GET SINGLE DOCUMENT
export async function getEmployeeDocumentById(fileId: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${EmployeeAPI.getDocumentById}?file_id=${fileId}`
  );
  return resp.data;
}


// 3. UPLOAD DOCUMENT (NEW CLEAN API)
export async function uploadEmployeeDocument(
  employeeId: string,
  documentName: string,
  file: File
): Promise<any> {
  const formData = new FormData();

  formData.append("document_name", documentName);
  formData.append("file", file);

  const resp: AxiosResponse = await api.post(
    EmployeeAPI.uploadDocument, 
    formData,
    {
      params: { id: employeeId },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return resp.data;
}

// 4. UPDATE DOCUMENT
export async function updateEmployeeDocument(
  fileId: string,
  documentName?: string,
  file?: File
): Promise<any> {
  const formData = new FormData();

  formData.append("file_id", fileId);

  if (documentName) formData.append("document_name", documentName);
  if (file) formData.append("file", file);

  const resp: AxiosResponse = await api.put(
    EmployeeAPI.updateDocument,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return resp.data;
}


// 5. DELETE DOCUMENT
export async function deleteEmployeeDocument(fileId: string): Promise<any> {
  const formData = new FormData();
  formData.append("file_id", fileId);

  const resp: AxiosResponse = await api.delete(
    EmployeeAPI.deleteDocument,
    { data: formData }
  );

  return resp.data;
}