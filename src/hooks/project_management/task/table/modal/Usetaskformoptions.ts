// → src/hooks/project_management/task/modal/form/useTaskFormOptions.ts
import { useEffect, useMemo, useState } from "react";
import type {
  TaskFormOptions,
  TaskSelectOption,
} from "../../../../../types/Project_Management/task/modal/Taskformmodal.types";
import { getAllProjects } from "../../../../../api/project/projectapi/project.api";
import { getAllTasks } from "../../../../../api/project/task/taskapi";
import { showApiError } from "../../../../../utils/alert";
// Activity types already come from the project form's options hook, so reuse it.
import { useProjectFormOptions } from "../../../project/modal/form/useProjectFormOptions";

export const useTaskFormOptions = (isOpen: boolean, project: string) => {
  const { options: projectOptions } = useProjectFormOptions(isOpen);
  const [projects, setProjects] = useState<TaskSelectOption[]>([]);
  const [parentTasks, setParentTasks] = useState<TaskSelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setIsLoading(true);
    getAllProjects()
      .then((list) => {
        if (!alive) return;
        setProjects(
          list.map((p) => ({ label: p.project_name || p.name, value: p.name })),
        );
      })
      .catch(showApiError)
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  // Only group tasks can be parents, and only within the selected project.
  useEffect(() => {
    setParentTasks([]);
    if (!isOpen || !project) return;
    let alive = true;
    getAllTasks(project, undefined, { pageSize: 500 })
      .then((list) => {
        if (!alive) return;
        setParentTasks(
          list
            .filter((t) => t.is_group === 1)
            .map((t) => ({ label: `${t.subject} (${t.name})`, value: t.name })),
        );
      })
      .catch(showApiError);
    return () => {
      alive = false;
    };
  }, [isOpen, project]);

  const activityTypes = useMemo<TaskSelectOption[]>(
    () =>
      projectOptions.activityTypes.map((a) => ({ label: a.name, value: a.name })),
    [projectOptions.activityTypes],
  );

  const options: TaskFormOptions = { projects, parentTasks, activityTypes };
  return { options, isLoading };
};