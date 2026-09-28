import type { AxiosResponse } from "axios";

import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { ERP_BASE, API } from "../../../config/api";

const api = createAxiosInstance(ERP_BASE);

export const ProjectAPI = API.project.project;

const PROJECT_FIELDS = [
  "name",
  "project_name",
  "status",
  "project_type",
  "percent_complete",
  "expected_start_date",
  "expected_end_date",
  "estimated_costing",
  "priority",
  "is_active",
];

export async function getAllProjects(
  search?: string,
): Promise<any[]> {
  const query = buildListParams({
    fields: PROJECT_FIELDS,
    search,
    searchFields: ["name", "project_name"],
  });

  const resp: AxiosResponse = await api.get(
    `${ProjectAPI.list}?${query}`,
  );

  return resp.data?.data ?? [];
}