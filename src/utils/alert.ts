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
// ─────────────────────────────────────────────────────────────────────────────
// ADD these two functions to your existing alert.ts
// Everything else in alert.ts stays exactly the same.
// ─────────────────────────────────────────────────────────────────────────────


// ── Show a non-closable loading Swal with a custom HTML message ───────────────
// Used for staged steps: "Creating employee…", "Uploading photo…"
export const showStepLoader = (title: string, html: string) => {
  fireManagedSwal({
    title,
    html,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
};

// ── Final result after employee creation + photo upload ───────────────────────
// Shows all collected info: success message, welcome email, warnings.
export const showEmployeeCreationResult = async (options: {
  employeeId: string;
  successMessage: string;
  welcomeMessage?: string;         // e.g. "Welcome email sent to..."
  serverWarnings?: string[];       // e.g. username conflict notices
  photoUploaded: boolean;
  photoError?: string;
}): Promise<void> => {
  const { employeeId, successMessage, welcomeMessage, serverWarnings = [], photoUploaded, photoError } = options;

  // ── Build HTML body ──────────────────────────────────────────────────────────
  const rows: string[] = [];

  // Employee ID badge
  rows.push(`
    <div style="display:inline-flex;align-items:center;gap:6px;background:#f0f9ff;border:1px solid #bae6fd;
      borderRadius:8px;padding:5px 12px;marginBottom:12px;">
      <span style="font-size:11px;color:#0369a1;font-weight:600;letter-spacing:0.04em;font-family:monospace">
        ${employeeId}
      </span>
    </div>
  `);

  // Main success row
  rows.push(`
    <div style="display:flex;align-items:flex-start;gap:8px;marginBottom:8px;text-align:left;">
      <span style="color:#16a34a;font-size:15px;margin-top:1px;flex-shrink:0;">✓</span>
      <span style="font-size:13px;color:#15803d;font-weight:600;line-height:1.5">${successMessage}</span>
    </div>
  `);

  // Photo upload row
  if (photoUploaded) {
    rows.push(`
      <div style="display:flex;align-items:flex-start;gap:8px;marginBottom:8px;text-align:left;">
        <span style="color:#16a34a;font-size:15px;margin-top:1px;flex-shrink:0;">✓</span>
        <span style="font-size:13px;color:#15803d;font-weight:600;line-height:1.5">Profile photo uploaded successfully.</span>
      </div>
    `);
  } else if (photoError) {
    rows.push(`
      <div style="display:flex;align-items:flex-start;gap:8px;marginBottom:8px;text-align:left;">
        <span style="color:#d97706;font-size:14px;margin-top:1px;flex-shrink:0;">⚠</span>
        <span style="font-size:12.5px;color:#92400e;line-height:1.5">
          Photo upload failed — you can add it later by editing the employee.
        </span>
      </div>
    `);
  }

  // Divider before info items
  if (welcomeMessage || serverWarnings.length > 0) {
    rows.push(`<hr style="border:none;border-top:1px solid #e2e8f0;margin:10px 0;" />`);
  }

  // Welcome email notice
  if (welcomeMessage) {
    rows.push(`
      <div style="display:flex;align-items:flex-start;gap:8px;marginBottom:7px;text-align:left;
        background:#f0f9ff;border-radius:8px;padding:9px 11px;">
        <span style="color:#0284c7;font-size:13px;flex-shrink:0;margin-top:1px;">✉</span>
        <span style="font-size:12px;color:#0369a1;line-height:1.6">${welcomeMessage}</span>
      </div>
    `);
  }

  // Server warnings (username conflict, email config etc.)
  for (const w of serverWarnings) {
    rows.push(`
      <div style="display:flex;align-items:flex-start;gap:8px;marginBottom:6px;text-align:left;
        background:#fffbeb;border-radius:8px;padding:8px 11px;">
        <span style="color:#d97706;font-size:13px;flex-shrink:0;margin-top:1px;">⚠</span>
        <span style="font-size:12px;color:#78350f;line-height:1.55">${w}</span>
      </div>
    `);
  }

  const icon = photoUploaded ? "success" : (photoError ? "warning" : "success");
  const title = photoUploaded
    ? "Employee Profile Complete"
    : photoError
    ? "Employee Saved — Photo Pending"
    : "Employee Created Successfully";

  await fireManagedSwal({
    icon,
    title,
    html: `<div style="margin-top:4px">${rows.join("")}</div>`,
    confirmButtonText: "Done",
    confirmButtonColor: "#6366f1",
    width: 480,
  });
};