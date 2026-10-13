import { useEffect, useState } from "react";
import {
  fetchNextProjectCode,
  fetchProjectFormOptions,
} from "../../../../../api/project/projectapi/projectFormApi";
import type { ProjectFormOptions } from "../../../../../types/Project_Management/project_modal/Projectformmodal";
import {
  EMPTY_OPTIONS,
  getErrorMessage,
} from "../../../../../utils/project_management/project/Projectformmodal.utils";
import { showApiError } from "../../../../../utils/alert";

export const useProjectFormOptions = (isOpen: boolean) => {
  const [options, setOptions] = useState<ProjectFormOptions>(EMPTY_OPTIONS);
  const [projectCode, setProjectCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoading(true);

    Promise.all([fetchProjectFormOptions(), fetchNextProjectCode()])
      .then(([loadedOptions, code]) => {
        if (!active) return;
        setOptions(loadedOptions);
        setProjectCode(code);
      })
      .catch((error) => showApiError(getErrorMessage(error)))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  return { options, projectCode, isLoading };
};
