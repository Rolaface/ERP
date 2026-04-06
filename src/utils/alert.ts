import Swal from "sweetalert2";
import { closeManagedSwal, fireManagedSwal } from "./swalManager";

const extractErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;

if (error?.response?.data?.message) {
  const msg = error.response.data.message;

  if (typeof msg === "string") return msg;

  if (typeof msg === "object" && msg?.message) {
    return String(msg.message);
  }

  return JSON.stringify(msg);
}

  if (error?.response?.data?._server_messages) {
    try {
      const serverMsgs = JSON.parse(error.response.data._server_messages);
      const parsed = JSON.parse(serverMsgs[0]);
      return String(parsed.message);
    } catch {
      return String(error.response.data._server_messages);
    }
  }

  if (error?.status === "error" && error?.message) {
    return String(error.message);
  }

  if (error?.message) {
    return String(error.message);
  }

  return "Something went wrong. Please try again.";
};

const toUserFriendlyMessage = (message: string): string => {
  const m = (message ?? "").trim();
  if (!m) return "Something went wrong. Please try again.";

  const normalized = m.toLowerCase();

  if (normalized.includes("destncountrycd") && normalized.includes("c1")) {
    return "Export To Country is required when using Tax Code C1.";
  }

  if (normalized.includes("destncountrycd")) {
    return m
      .replace(/\(\s*destnCountryCd\s*\)/gi, "")
      .replace(/destnCountryCd/gi, "Export To Country")
      .trim();
  }

  return m;
};
export const showValidationError = (message: string) => {
  fireManagedSwal({
    icon: "warning",
    title: "Validation Error",
    text: message,
    confirmButtonColor: "#f59e0b",
  });
};

export const showApiError = (error: any) => {
  const rawMessage = extractErrorMessage(error);

  // Strip HTML tags (clean version)
  const cleanMessage = String(rawMessage).replace(/<[^>]+>/g, "");
  const userMessage = toUserFriendlyMessage(cleanMessage);

  fireManagedSwal({
    icon: "error",
    title: "Operation Failed",
    text: userMessage,
    confirmButtonColor: "#ef4444",
  });
};

/*  Success  */
export const showSuccess = (message: string) => {
  fireManagedSwal({
    icon: "success",
    title: "Success",
    text: message,
    confirmButtonColor: "#22c55e",
  });
};

/*  Loading  */
export const showLoading = (title = "Processing...") => {
  fireManagedSwal({
    title,
    text: "Please wait while we complete your request.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/*  Close  */
export const closeSwal = () => {
  closeManagedSwal();
};


export const showConfirm = async (
  message: string,
  options?: {
    title?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
  }
) => {
  const result = await fireManagedSwal({
    icon: "warning",
    title: options?.title ?? "Are you sure?",
    text: message,
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText ?? "Yes",
    cancelButtonText: options?.cancelButtonText ?? "Cancel",
    confirmButtonColor: options?.confirmButtonColor ?? "#ef4444",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });

  return result.isConfirmed;
};
export const showPOConflictDialog = async (
  existingCount: number,
  poNumber?: string
): Promise<"keep" | "replace" | "cancel"> => {
  const result = await fireManagedSwal({
    icon: "question",
    title: "Add PO Items?",
    text: `You have ${existingCount} item${existingCount > 1 ? "s" : ""} already added. Do you want to import items from ${poNumber ?? "this PO"} or replace them?`,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Import",
    denyButtonText: "Replace",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#22c55e",
    denyButtonColor: "#f59e0b",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });

  if (result.isConfirmed) return "keep";
  if (result.isDenied) return "replace";
  return "cancel";
};
