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
  positional?: boolean;
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

export interface DocFieldMeta {
  fieldname: string;
  label: string;
  fieldtype: string;
  description?: string;
  hidden?: 0 | 1;
}

const DOCTYPE_META_URL = "/api/method/frappe.desk.form.load.getdoctype";
const CUSTOM_FIELD_DATA_URL =
  "/api/method/frappe.desk.query_report.get_data_for_custom_field";

export const NAME_FIELD = "name";
export const AMOUNT_FIELD_TYPES = ["Currency", "Float", "Int", "Percent"];
export const DATE_FIELD_TYPES = ["Date", "Datetime"];

export const isAmountType = (type?: string) =>
  !!type && AMOUNT_FIELD_TYPES.includes(type);

export const isDateType = (type?: string) =>
  !!type && DATE_FIELD_TYPES.includes(type);

const NO_VALUE_TYPES = [
  "Section Break",
  "Column Break",
  "Tab Break",
  "HTML",
  "Table",
  "Table MultiSelect",
  "Button",
  "Image",
  "Fold",
  "Heading",
];

const STANDARD_FIELDS: Record<string, [string, string]> = {
  [NAME_FIELD]: ["ID", "Data"],
  owner: ["Created By", "Data"],
  creation: ["Created On", "Datetime"],
  modified: ["Last Updated On", "Datetime"],
  modified_by: ["Last Updated By", "Data"],
};

const toColumn = (c: string | ReportColumn, i: number): ReportColumn => {
  if (typeof c !== "string") {
    return c.fieldname
      ? c
      : { ...c, fieldname: `col_${i}`, positional: true };
  }
  const [label, type = "", width] = c.split(":");
  const [fieldtype, options] = type.split("/");
  return {
    label,
    fieldname: `col_${i}`,
    fieldtype: fieldtype || "Data",
    options,
    width: width ? Number(width) : undefined,
    positional: true,
  };
};

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

export const getProjectOptions = () =>
  listResource(API.project.project.list, "project_name");

export const getEmployeeOptions = () =>
  listResource(API.employee.getAll, "employee_name");

export const getProjectTypeOptions = () =>
  listResource(API.project.project.projectType);

export const getDocFields = async (
  doctype: string,
): Promise<DocFieldMeta[]> => {
  const resp: AxiosResponse = await api.get(DOCTYPE_META_URL, {
    params: { doctype, with_parent: 1 },
  });

  const docs: any[] = resp.data?.docs ?? [];
  const main = docs.find((d) => d.name === doctype) ?? docs[0];
  if (!main) return [];

  const standard: DocFieldMeta[] = Object.entries(STANDARD_FIELDS)
    .filter(([fieldname]) => fieldname in main)
    .map(([fieldname, [label, fieldtype]]) => ({
      fieldname,
      label,
      fieldtype,
      description: "System field",
    }));

  const own: DocFieldMeta[] = (main.fields ?? [])
    .filter((f: any) => f.fieldname && !NO_VALUE_TYPES.includes(f.fieldtype))
    .map((f: any) => ({
      fieldname: f.fieldname,
      label: f.label || f.fieldname,
      fieldtype: f.fieldtype,
      hidden: f.hidden ? 1 : 0,
      description:
        f.description || (f.fetch_from ? `Fetched from ${f.fetch_from}` : ""),
    }));

  const seen = new Set<string>();
  return [...standard, ...own].filter(
    (f) => !seen.has(f.fieldname) && !!seen.add(f.fieldname),
  );
};

export const getCustomFieldData = async (
  doctype: string,
  field: string,
  names: string[],
): Promise<Record<string, any>> => {
  const resp: AxiosResponse = await api.post(CUSTOM_FIELD_DATA_URL, {
    doctype,
    field,
    names: JSON.stringify(names),
  });
  return resp.data?.message ?? {};
};