import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);

export interface ContactOption {
  value: string;       // email address
  label: string;       // email address
  description: string; // contact / party name
}

interface GetContactListResponse {
  message: ContactOption[];
}

export async function getContactList(txt: string): Promise<ContactOption[]> {
  const resp: AxiosResponse<GetContactListResponse> = await api.get(
    API.Email.get_contact_list,
    { params: { txt } },
  );
  return resp.data?.message ?? [];
}


export interface SendEmailParams {
  recipients: string;
  name: string;
  content: string;
  send_me_a_copy: "0" | "1";
  subject: string;
  cc?: string;
  bcc?: string;
   doctype: string;
   attachmentNames?: string[];
  // --- hardcoded fields ---
  // doctype      : "Sales Invoice"
  // send_email   : "1"
  // print_format : "Standard"
  // print_language: "en"
  // add_css      : "1"
  // attachments  : "[]"
}

export interface SendEmailResponse {
  message: unknown; // Frappe returns various shapes; callers only check success
}

export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResponse> {
  const formData = new FormData();
  formData.append("recipients", params.recipients);
  formData.append("doctype", params.doctype); 
  formData.append("name", params.name);
  formData.append("subject", params.subject);
  formData.append("send_email", "1");
  formData.append("content", params.content);
  formData.append("send_me_a_copy", params.send_me_a_copy);
  if (params.cc) formData.append("cc", params.cc);
  if (params.bcc) formData.append("bcc", params.bcc);
  formData.append("print_format", "Standard");
  formData.append(
    "attachments",
    JSON.stringify(params.attachmentNames ?? []),
  );
  formData.append("print_language", "en");
  formData.append("add_css", "1");


  const resp: AxiosResponse<SendEmailResponse> = await api.post(
    API.Email.send_email,
    formData,
  );
  return resp.data;
}



export interface UploadedAttachment {
  name: string;
  file_name: string;
  file_url: string;
  is_private: number;
}

interface UploadFileResponse {
  message: UploadedAttachment;
}


export async function uploadFile(
  file: File,
  invoiceNumber: string,
  doctype: string,
): Promise<UploadedAttachment> {
  const formData = new FormData();
  formData.append("file", file, file.name);   
  formData.append("is_private", "0");
  formData.append("folder", "Home/Attachments");
  formData.append("doctype", doctype);
  formData.append("docname", invoiceNumber);

  const resp: AxiosResponse<UploadFileResponse> = await api.post(
    API.Email.upload_file,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" }, 
    },
  );
  return resp.data.message;
}
export async function removeAttachment(
  fid: string,
  invoiceNumber: string,
  doctype: string,
): Promise<void> {
  const formData = new FormData();
  formData.append("fid", fid);
  formData.append("dt", doctype);   
  formData.append("dn", invoiceNumber);

  await api.post(API.Email.remove_attachments, formData);
}


export interface MakeEmailTemplateParams {
  id: string;
  doc_type: string;
  doc_type_name: string;
}

export interface MakeEmailTemplateResult {
  subject: string;
  message: string;
}

interface MakeEmailTemplateResponse {
  status_code: number;
  status: string;
  message: MakeEmailTemplateResult;  
}

export async function makeEmailTemplate(
  params: MakeEmailTemplateParams,
): Promise<MakeEmailTemplateResult> {
  const query = new URLSearchParams({
    id: params.id,
    doc_type: params.doc_type,
    doc_type_name: params.doc_type_name,
  }).toString();

  const resp: AxiosResponse<MakeEmailTemplateResponse> = await api.post(
    `${API.Email.make_email_template}?${query}`,
  );
  return resp.data.message;
}

