import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../../axiosInstance";
import { API, ERP_BASE } from "../../../config/api";

const api = createAxiosInstance(ERP_BASE);

export const ReportAPI = API.project.report;

export interface ReportColumn {
  label: string;
  fieldname: string;
  fieldtype?: string;
  options?: string;
  width?: number;
  hidden?: number;
}

export interface ReportResponse {
  columns: ReportColumn[];
  data: Record<string, any>[];
}

export interface ResourceOption {
  name: string;
  title?: string;
}

export interface FetchReportOptions {
  isTree?: boolean;
}

const toColumn = (c: string | ReportColumn, i: number): ReportColumn => {
  if (typeof c !== "string") return { ...c, fieldname: c.fieldname ?? `col_${i}` };
  const [label, type = "", width] = c.split(":");
const [fieldtype, options] = type.split("/");
return {
  label,
  fieldname: `col_${i}`,
  fieldtype: fieldtype || "Data",
  options,
  width: width ? Number(width) : undefined,
};
};

export const getProjectOptions = () =>
  listResource(API.project.project.list, "project_name");

export async function fetchReport(
  reportName: string,
  filters: Record<string, unknown>,
  options: FetchReportOptions = {},
): Promise<ReportResponse> {
  const resp: AxiosResponse = await api.get(ReportAPI.run, {
    params: {
      report_name: reportName,
      filters: JSON.stringify(filters),
      ignore_prepared_report: false,
      is_tree: !!options.isTree,
      are_default_filters: false,
    },
  });

  const msg = resp.data?.message ?? {};
  const columns: ReportColumn[] = (msg.columns ?? []).map(toColumn);
  const data: Record<string, any>[] = (msg.result ?? []).map((row: any) =>
    Array.isArray(row)
      ? Object.fromEntries(columns.map((c, i) => [c.fieldname, row[i]]))
      : row,
  );

  return { columns, data };
}
const listResource = async (
  url: string,
  titleField?: string,
): Promise<ResourceOption[]> => {
  const resp: AxiosResponse = await api.get(url, {
    params: {
      limit_page_length: 0,
      ...(titleField && {
        fields: JSON.stringify(["name", titleField]),
        order_by: `${titleField} asc`,
      }),
    },
  });
  const rows: Record<string, any>[] = resp.data?.data ?? [];
  return rows.map((r) => ({
    name: r.name,
    title: titleField ? r[titleField] : undefined,
  }));
};

export const getEmployeeOptions = () =>
  listResource(API.employee.getAll, "employee_name");

export const getProjectTypeOptions = () =>
  listResource(API.project.project.projectType, );

export const emailReport ={}