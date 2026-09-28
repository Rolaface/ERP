import type { AxiosResponse } from "axios";

import { createAxiosInstance } from "../../../axiosInstance";
import { buildListParams } from "../../../../api/utils/queryBuilder";
import { ERP_BASE, API } from "../../../../config/api";

const api = createAxiosInstance(ERP_BASE);

export const ActivityTypeAPI = API.project.activityType;

const ACTIVITY_TYPE_FIELDS = [
  "name",
  "activity_type",
  "costing_rate",
  "billing_rate",
  "disabled",
];

export async function getAllActivityTypes(
  search?: string,
): Promise<any[]> {
  const query = buildListParams({
    fields: ACTIVITY_TYPE_FIELDS,
    search,
    searchFields: ["name", "activity_type"],
  });

  const resp: AxiosResponse = await api.get(
    `${ActivityTypeAPI.list}?${query}`,
  );

  return resp.data?.data ?? [];
}