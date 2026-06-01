import {
  showLoading,
  showSuccess,
  showApiError,
  closeSwal,
} from "../utils/alert";

import { fireManagedSwal } from "../utils/swalManager";

interface StatusConfig {
  entityName: string;
  action: "active" | "inactive";
  updateFn: (id: string, status: "active" | "inactive") => Promise<any>;
  onSuccess?: () => void;
}

export const updateEntityStatus = async (
  id: string,
  config: StatusConfig,
) => {
  const { entityName, action, updateFn, onSuccess } = config;

  const isEnable = action === "active";

  const result = await fireManagedSwal({
    title: `${isEnable ? "Enable" : "Disable"} ${entityName}?`,
    text: `${entityName} will be marked as ${
      isEnable ? "active" : "inactive"
    }.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: `Yes, ${isEnable ? "Enable" : "Disable"}`,
  });

  if (!result.isConfirmed) return;

  try {
    showLoading(
      `${isEnable ? "Enabling" : "Disabling"} ${entityName}...`,
    );

    await updateFn(id, action);

    closeSwal();

    showSuccess(
      `${entityName} ${
        isEnable ? "enabled" : "disabled"
      } successfully.`,
    );

    onSuccess?.();
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
};