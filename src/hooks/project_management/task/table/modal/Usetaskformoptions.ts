import { useEffect, useMemo, useState } from "react";
import type {
  TaskFormOptions,
  TaskSelectOption,
} from "../../../../../types/Project_Management/task/modal/Taskformmodal.types";
import { getAllProjects } from "../../../../../api/project/projectapi/project.api";
import { getAllTasks } from "../../../../../api/project/task/taskapi";
import { getAllDepartments } from "../../../../../api/utils/frappeUtilsApi";
import { showApiError } from "../../../../../utils/alert";
import { useProjectFormOptions } from "../../../project/modal/form/useProjectFormOptions";

export const useTaskFormOptions = (isOpen: boolean, project: string) => {
  const { options: projectOptions } = useProjectFormOptions(isOpen);
  const [projects, setProjects] = useState<TaskSelectOption[]>([]);
  const [departments, setDepartments] = useState<TaskSelectOption[]>([]);
  const [parentTasks, setParentTasks] = useState<TaskSelectOption[]>([]);
  const [dependencyTasks, setDependencyTasks] = useState<TaskSelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setIsLoading(true);
    Promise.all([getAllProjects(), getAllDepartments()])
      .then(([projectList, departmentList]) => {
        if (!alive) return;
        setProjects(
          projectList.map((p) => ({
            label: p.project_name || p.name,
            value: p.name,
          })),
        );
        setDepartments(
          departmentList.map((d) => ({ label: d.label, value: d.value })),
        );
      })
      .catch(showApiError)
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    setParentTasks([]);
    setDependencyTasks([]);
    if (!isOpen || !project) return;
    let alive = true;
    getAllTasks(project, undefined, { pageSize: 500 })
      .then((list) => {
        if (!alive) return;
        const toOption = (t: (typeof list)[number]): TaskSelectOption => ({
          label: `${t.subject} (${t.name})`,
          value: t.name,
        });
        setParentTasks(list.filter((t) => t.is_group === 1).map(toOption));
        setDependencyTasks(list.map(toOption));
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

  const options: TaskFormOptions = {
    projects,
    parentTasks,
    dependencyTasks,
    activityTypes,
    departments,
  };

  return { options, isLoading };
};