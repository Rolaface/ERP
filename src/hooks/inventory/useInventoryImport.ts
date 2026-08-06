import { useState } from "react";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { inventoryItemImportApi } from "../../api/imports/inventory import/inventoryimportapi";
import type { BulkRow } from "../../types/inventory/InventoryImport.types";

export function useInventoryImport(onSuccess?: () => void, onClose?: () => void) {
  const [bulkRows,    setBulkRows]    = useState<BulkRow[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const reset = () => setBulkRows([]);

  const handleBulkSubmit = async (file: File) => {
    if (!file) {
      showApiError("No file selected");
      return;
    }

    try {
      setBulkLoading(true);
      showLoading("Uploading inventory file…");

   const response = await inventoryItemImportApi.uploadFile(file);
      closeSwal();

      if (!response?.success) {
        showApiError(response?.message || response?.errors?.join("\n") || "Bulk import failed");
        return;
      }

      if (response.queued) {
        showSuccess(response.message || "File queued for background import");
      } else {
        const processed = response.items_processed ?? 0;
        const failed     = response.errors?.length ?? 0;

        if (failed > 0 && processed === 0) {
          showApiError(`Import failed:\n${response.errors!.slice(0, 5).join("\n")}`);
          return;
        }
        if (failed > 0) {
          showApiError(
            `${processed} item(s) imported, ${failed} row(s) failed:\n` +
            response.errors!.slice(0, 5).join("\n")
          );
        } else {
          showSuccess(
            `${processed} item(s) imported across ${response.reconciliations?.length ?? 0} warehouse(s)`
          );
        }
      }

      onSuccess?.();
      reset();
      onClose?.();
    } catch (error: any) {
      closeSwal();
      showApiError(error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  return {
    bulkRows, setBulkRows,
    bulkLoading,
    handleBulkSubmit,
    handleClose,
  };
}