import { useCallback, useEffect, useState } from "react";
import { showApiError } from "../../../../utils/alert";
import { getMyAssignedTasks } from "../../../../api/project/todo/todo.api";
import { useIsMounted } from "./Useismounted";

export const useAssignedTaskNames = (
  enabled: boolean,
  currentUserEmail?: string,
) => {
  const mountedRef = useIsMounted();
  const [assignedNames, setAssignedNames] = useState<string[]>([]);

  const reload = useCallback(async () => {
    if (!enabled || !currentUserEmail) return;

    try {
      const names = await getMyAssignedTasks(currentUserEmail, true);
      if (!mountedRef.current) return;
      setAssignedNames((prev) =>
        prev.length === names.length && prev.every((n, i) => n === names[i])
          ? prev
          : names,
      );
    } catch (error) {
      showApiError(error);
    }
  }, [enabled, currentUserEmail]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { assignedNames, reload };
};