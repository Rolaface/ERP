import type { AxiosResponse } from "axios";

import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { ERP_BASE, API } from "../../../config/api";
import type {
  CreatedProject,
  ProjectPayload,
} from "../../../types/Project_Management/project_modal/Projectformmodal";

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
  "customer",
  // "estimated_costing",
  "priority",
  "is_active",
];

export async function getAllProjects(
  search?: string,
    customer?: string,
): Promise<any[]> {
  const query = buildListParams({
    fields: PROJECT_FIELDS,
    search,
    searchFields: ["name", "project_name"],
  });

  let url = `${ProjectAPI.list}?${query}`;
  if (customer) {
    url += `&filters=${encodeURIComponent(
      JSON.stringify([["customer", "=", customer]]),
    )}`;
  }

  const resp: AxiosResponse = await api.get(url);

  return resp.data?.data ?? [];
}

export const getProjectById = async (projectId: string) => {
  const res = await api.get(`${ProjectAPI.list}/${encodeURIComponent(projectId)}`);
  return res.data; // { data: { name, project_name, users: [...], ... } }
};

export const createProject = async (
  payload: ProjectPayload,
): Promise<CreatedProject> => {
  const res = await api.post(ProjectAPI.list, payload);
  return { name: res.data?.data?.name ?? "" };
};