import {
  closeSwal,

  showApiError,
  showLoading,
  showSuccess,
} from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";


interface ConfirmDeleteOptions {
  title?: string;
  text: string;
  loadingText?: string;
  successMessage?: string;
  action: () => Promise<void>;
}

export const confirmDelete = async ({
  title = "Are you sure?",
  text,
  loadingText = "Deleting...",
  successMessage = "Deleted successfully.",
  action,
}: ConfirmDeleteOptions) => {
  const confirm = await fireManagedSwal({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
  });

  if (!confirm.isConfirmed) {
    return false;
  }

  try {
    showLoading(loadingText);

    await action();

    closeSwal();
    showSuccess(successMessage);

    return true;
  } catch (error) {
    closeSwal();

    showApiError(error);

    return false;
  }
};