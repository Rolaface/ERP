import { showApiError } from "../../../../utils/alert";
import { getalluser } from "../../../../api/utils/frappeUtilsApi";
import { getAllProjects } from "../../../../api/project/projectapi/project.api";
import { getProjectAssignees } from "../../../../api/project/task/taskapi";
import type { Option } from "../../../../components/selects/tabelselect/MultiSearchSelect";

export const fetchUserOptions = async (q: string): Promise<Option[]> => {
  try {
    const res: any = await getalluser(q || undefined);

    const raw = res?.data ?? res?.message ?? res;
    const list: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : [];

    const seen = new Set<string>();
    const options: Option[] = [];

    list.forEach((u) => {
      const value = u?.value ?? u?.email ?? u?.name;
      if (!value || seen.has(value)) return;
      seen.add(value);

      options.push({
        label: u.label || u.full_name || u.name || value,
        value,
        subLabel: u.description || u.email || undefined,
      });
    });

    return options;
  } catch (error) {
    showApiError(error);
    return [];
  }
};

export const fetchProjectOptions = async (q: string): Promise<Option[]> => {
  try {
    const list = await getAllProjects(q || undefined);
    return list.map((p) => ({
      label: p.project_name || p.name,
      value: p.name,
      subLabel:
        p.project_name && p.project_name !== p.name ? p.name : undefined,
    }));
  } catch (error) {
    showApiError(error);
    return [];
  }
};

export const fetchProjectAssigneeOptions = async (
  project: string,
  q: string,
): Promise<Option[]> => {
  if (!project) return [];

  try {
    const users = await getProjectAssignees(project);
    const search = q.trim().toLowerCase();

    return users
      .filter((u) => {
        if (!search) return true;
        return (
          u.full_name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.user?.toLowerCase().includes(search)
        );
      })
      .map((u) => ({
        label: u.full_name || u.email || u.user,
        value: u.email || u.user,
        subLabel: u.email || u.user,
      }));
  } catch (error) {
    showApiError(error);
    return [];
  }
};