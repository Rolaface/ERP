import { useEffect, useMemo, useRef, useState } from "react";
import { showApiError } from "../../../../utils/alert";
import { getAllProjects } from "../../../../api/project/projectapi/project.api";
import { getProjectAssignees } from "../../../../api/project/task/taskapi";
import type { ProjectOption } from "../../../../types/Project_Management/task/table/Task.types";
import { fetchUserOptions } from "../../../../views/project_management/task/components/Taskoptionfetchers";
import { useIsMounted } from "./Useismounted";

import type { FilterOption } from "../../../../views/project_management/task/components/Tasktoolbar";

export type { FilterOption };

interface Args {
  enabled: boolean;
  projectFilter: string[];
  assigneeFilter: string[];
  onPruneAssignees: (next: string[]) => void;
}

export const useTaskFilterOptions = ({
  enabled,
  projectFilter,
  assigneeFilter,
  onPruneAssignees,
}: Args) => {
  const mountedRef = useIsMounted();
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [userFilterOptions, setUserFilterOptions] = useState<FilterOption[]>(
    [],
  );

  const assigneeRef = useRef(assigneeFilter);
  assigneeRef.current = assigneeFilter;
  const pruneRef = useRef(onPruneAssignees);
  pruneRef.current = onPruneAssignees;

  useEffect(() => {
    getAllProjects()
      .then((data) => {
        if (!mountedRef.current) return;
        setProjectOptions(
          data.map((p) => ({ name: p.name, project_name: p.project_name })),
        );
      })
      .catch(showApiError);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        if (projectFilter.length === 0) {
          const users = await fetchUserOptions("");
          if (cancelled || !mountedRef.current) return;
          setUserFilterOptions(
            users.map((u) => ({ label: u.label, value: u.value })),
          );
          return;
        }

        const settled = await Promise.allSettled(
          projectFilter.map((project) => getProjectAssignees(project)),
        );
        if (cancelled || !mountedRef.current) return;

        const unique = new Map<string, FilterOption>();
        let hasFailure = false;

        settled.forEach((result) => {
          if (result.status === "rejected") {
            if (!hasFailure) showApiError(result.reason);
            hasFailure = true;
            return;
          }
          result.value.forEach((user) => {
            const value = user.email || user.user;
            if (!value) return;
            unique.set(value, { label: user.full_name || value, value });
          });
        });

        const options = Array.from(unique.values());
        setUserFilterOptions(options);

        if (!hasFailure) {
          const valid = new Set(options.map((o) => o.value));
          const current = assigneeRef.current;
          const next = current.filter((value) => valid.has(value));
          if (next.length !== current.length) pruneRef.current(next);
        }
      } catch (error) {
        if (cancelled || !mountedRef.current) return;
        showApiError(error);
        setUserFilterOptions([]);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, projectFilter]);

  const projectFilterOptions = useMemo(
    () =>
      projectOptions.map((p) => ({
        label: p.project_name || p.name,
        value: p.name,
      })),
    [projectOptions],
  );

  const projectNameMap = useMemo(
    () => new Map(projectOptions.map((p) => [p.name, p.project_name])),
    [projectOptions],
  );

  const getProjectDisplayName = (code: string | null): string => {
    if (!code) return "—";
    return projectNameMap.get(code) || code;
  };

  return {
    projectFilterOptions,
    userFilterOptions,
    getProjectDisplayName,
  };
};