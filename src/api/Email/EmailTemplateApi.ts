import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  template_name?: string;
  subject: string;
  message: string;
}

interface EmailTemplateResponse {
  message: EmailTemplate;
}

interface EmailTemplateListResponse {
  status_code: number;
  status: string;
  message: string;
  data: {
    data: EmailTemplate[];
    pagination: {
      page: number;
      page_size: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

export interface CreateEmailTemplateParams {
  template_name: string;
  subject: string;
  message: string;
}

export interface UpdateEmailTemplateParams {
  id: string;
  subject: string;
  message: string;
}

// ── Cleaned up: only id is needed ──
export interface GetEmailTemplateParamsById {
  id: string;
}

interface EmailTemplateByIdResponse {
  status_code: number;
  status: string;
  message: string;      
  data: EmailTemplate;    
}

export interface DeleteEmailTemplateParams {
  name: string;
  doctype: string;
}

export interface GetEmailTemplateParams {
  search?: string;
  page: number;
  pageSize: number;
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export async function createEmailTemplate(
  params: CreateEmailTemplateParams,
): Promise<EmailTemplate> {
  const formData = new FormData();
  formData.append("template_name", params.template_name);
  formData.append("subject", params.subject);
  formData.append("message", params.message);

  const resp: AxiosResponse<EmailTemplateResponse> = await api.post(
    API.Email.create_email_template,
    formData,
  );
  return resp.data.message;
}

export async function getEmailTemplateById(
  params: GetEmailTemplateParamsById,
): Promise<EmailTemplate> {
  const resp: AxiosResponse<EmailTemplateByIdResponse> = await api.get(
    API.Email.get_email_template_by_id,
    {
      params: {
        id: params.id,
      },
    },
  );
  return resp.data.data;
}

export async function updateEmailTemplate(
  params: UpdateEmailTemplateParams,
): Promise<EmailTemplate> {
  const formData = new FormData();
  formData.append("id", params.id);
  formData.append("subject", params.subject);
  formData.append("message", params.message);

  const resp: AxiosResponse<EmailTemplateResponse> = await api.put(
    API.Email.update_email_template,
    formData,
  );
  return resp.data.message;
}

export async function deleteEmailTemplates(
  params: DeleteEmailTemplateParams,
): Promise<void> {
  const formData = new FormData();
  formData.append("name", params.name);
  formData.append("doctype", params.doctype);

  await api.delete(API.Email.delete_email_template, { data: formData });
}

export async function getEmailTemplates(
  params: GetEmailTemplateParams,
): Promise<{ data: EmailTemplate[]; total: number; totalPages: number }> {
  const resp: AxiosResponse<EmailTemplateListResponse> = await api.get(
    API.Email.get_email_templates,
    {
      params: {
        search: params.search ?? "",
        page: params.page,
        page_size: params.pageSize,
      },
    },
  );
  return {
    data: resp.data.data.data,
    total: resp.data.data.pagination.total,
    totalPages: resp.data.data.pagination.total_pages,
  };
}