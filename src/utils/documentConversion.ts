import { showLoading, closeSwal, showApiError, showSuccess } from "./alert";
import { fireManagedSwal } from "./swalManager";
import { useDataRefreshStore } from "../store/dataRefreshStore";

export interface ConvertDocumentOptions {
  confirmTitle: string;
  confirmText: string;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  loadingMessage?: string;
  successMessage?: string;
  createFn: () => Promise<any>;
  extractStatusCode: (res: any) => number | undefined;
  extractCreatedId: (res: any) => string | undefined;
  extractErrorMessage?: (res: any) => string | undefined;
  getByIdFn?: (id: string) => Promise<any>;
  extractDetail?: (res: any) => any;
  openModalFn: (detail: any, createdId: string) => void;
  refreshKeys?: string[];
}

export async function convertDocument({
  confirmTitle,
  confirmText,
  confirmButtonText = "Yes, create",
  confirmButtonColor = "#22c55e",
  loadingMessage = "Creating document...",
  successMessage = "Document created successfully",
  createFn,
  extractStatusCode,
  extractCreatedId,
  extractErrorMessage,
  getByIdFn,
  extractDetail = (res) => res?.message?.data || res?.data,
  openModalFn,
  refreshKeys = [],
}: ConvertDocumentOptions) {
  const result = await fireManagedSwal({
    icon: "question",
    title: confirmTitle,
    text: confirmText,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: "#6b7280",
    confirmButtonText,
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    showLoading(loadingMessage);

    const createRes = await createFn();
    console.log("🔵 createRes:", JSON.stringify(createRes, null, 2));

    const statusCode = extractStatusCode(createRes);
    const createdId = extractCreatedId(createRes);
    console.log("🔵 statusCode:", statusCode, "| createdId:", createdId);

    if ((statusCode !== 200 && statusCode !== 201) || !createdId) {
      closeSwal();
      showApiError(
        extractErrorMessage?.(createRes) ||
          createRes?.message?.message ||
          createRes?.message ||
          "Failed to create document",
      );
      return;
    }

    const detail = getByIdFn
      ? extractDetail(await getByIdFn(createdId))
      : undefined;
    console.log("🔵 detail:", JSON.stringify(detail, null, 2));

    closeSwal();
    showSuccess(successMessage);

    refreshKeys.forEach((key) =>
      useDataRefreshStore.getState().triggerRefresh(key),
    );

    openModalFn(detail, createdId);
  } catch (err) {
    closeSwal();
    showApiError(err);
  }
}