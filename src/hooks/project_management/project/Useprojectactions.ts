import { createElement, useCallback, type ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { ACTION_ICONS } from "../../../components/UI_Utils/statusActionIcons";
import { showApiError } from "../../../utils/alert";
import type { ActionMenu } from "../../../components/ui/Table/ActionButton";

type MenuProps = ComponentProps<typeof ActionMenu>;

/** What a row shows: icon buttons in the row + a three-dot menu for the rest */
export interface RowActions {
  onView?: () => void;
  onEdit?: () => void;
  menu?: MenuProps;
}

const PM_BASE_PATH = "/project-management";

type Row = { name: string; status: string };

/** TODO: replace these stubs with your real project API calls. */
const api = {
  setStatus: async (_name: string, _status: "Completed" | "Cancelled") => {},
  remove: async (_name: string) => {},
};

export const useProjectActions = () => {
  const navigate = useNavigate();

  return useCallback(
    (row: Row, { reload }: { reload: () => void }): RowActions => {
      const run = async (fn: () => Promise<unknown>, confirmText?: string) => {
        // TODO: swap window.confirm for your confirm modal
        if (confirmText && !window.confirm(confirmText)) return;
        try {
          await fn();
          reload();
        } catch (e) {
          showApiError(e);
        }
      };

      const isOpen = row.status === "Open";

      return {
        onView: () => navigate(`${PM_BASE_PATH}/projects/${row.name}`),
        onEdit: () => navigate(`${PM_BASE_PATH}/projects/${row.name}/edit`),
        menu: {
          customActions: isOpen
            ? [
                {
                  label: "Mark completed",
                  icon: ACTION_ICONS.COMPLETE,
                  onClick: () => run(() => api.setStatus(row.name, "Completed")),
                },
                {
                  label: "Cancel project",
                  icon: ACTION_ICONS.CANCEL,
                  danger: true,
                  onClick: () =>
                    run(
                      () => api.setStatus(row.name, "Cancelled"),
                      `Cancel project ${row.name}?`,
                    ),
                },
              ]
            : [],
          onDelete: () =>
            run(
              () => api.remove(row.name),
              `Delete project ${row.name}? This can't be undone.`,
            ),
        },
      };
    },
    [navigate],
  );
};