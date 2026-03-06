import Swal from "sweetalert2";

const extractErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?._server_messages) {
    try {
      const serverMsgs = JSON.parse(error.response.data._server_messages);

      const parsed = JSON.parse(serverMsgs[0]);
      return parsed.message;
    } catch {
      return error.response.data._server_messages;
    }
  }

  if (error?.status === "error" && error?.message) {
    return error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const toUserFriendlyMessage = (message: string): string => {
  const m = (message ?? "").trim();
  if (!m) return "Something went wrong. Please try again.";

  const currencyFixed = m.replace(/\bZRA\b/g, "ZAR");
  const normalized = currencyFixed.toLowerCase();

  if (
    normalized.includes("httpconnectionpool") ||
    normalized.includes("read timed out") ||
    normalized.includes("timed out") ||
    normalized.includes("timeout") ||
    normalized.includes("max retries exceeded")
  ) {
    return "Request timed out while processing your request. Please try again.";
  }

  if (normalized.includes("destncountrycd") && normalized.includes("c1")) {
    return "Export To Country is required when using Tax Code C1.";
  }

  if (normalized.includes("destncountrycd")) {
    return currencyFixed
      .replace(/\(\s*destnCountryCd\s*\)/gi, "")
      .replace(/destnCountryCd/gi, "Export To Country")
      .trim();
  }

  return currencyFixed;
};

export const getUserFriendlyErrorMessage = (error: any) => {
  const rawMessage = extractErrorMessage(error);
  const cleanMessage = String(rawMessage ?? "").replace(/<[^>]+>/g, "");
  return toUserFriendlyMessage(cleanMessage);
};

export const showApiError = (error: any) => {
  const userMessage = getUserFriendlyErrorMessage(error);

  Swal.fire({
    icon: "error",
    title: "Operation Failed",
    text: userMessage,
    confirmButtonColor: "#ef4444",
  });
};

/*  Success  */
export const showSuccess = (message: string) => {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: message,
    confirmButtonColor: "#22c55e",
  });
};

/*  Loading  */
export const showLoading = (title = "Processing...") => {
  Swal.fire({
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
  Swal.close();
};
