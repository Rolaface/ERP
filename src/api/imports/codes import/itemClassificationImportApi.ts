import { ERP_BASE } from "../../../config/api";
import { createAxiosInstance } from "../../axiosInstance";
import { downloadStaticTemplate } from "../../../utils/downloadStaticTemplate";
import type { ImportApi, ImportResult } from "../createImportApi";

const api = createAxiosInstance(ERP_BASE);

export const itemClassificationImportApi: ImportApi = {
  async uploadFile(file: File, onProgress?: (pct: number, details?: any) => void): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const resp = await api.post(
      "/api/method/custom_api.api.item_classification_import.import_item_classification",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    const jobId = resp.data?.message?.job_id;
    if (!jobId) {
      return {
        success: false,
        message: "Failed to start import job.",
        total_rows: 0,
        items_processed: 0,
      };
    }

    return new Promise((resolve) => {
      let consecutiveFails = 0;

      const interval = setInterval(async () => {
        try {
          const statusResp = await api.get("/api/method/custom_api.api.item_classification_import.get_import_progress", {
            params: { job_id: jobId }
          });
          
          const msg = statusResp.data?.message;
          if (msg) {
            consecutiveFails = 0;
            
            if (msg.not_found) {
              if (onProgress) onProgress(0, { inserted: 0 });
              return;
            }

            if (onProgress) {
              onProgress(msg.progress || 0, msg);
            }

            if (msg.done) {
              clearInterval(interval);
              const hasErrors = msg.recent_errors && msg.recent_errors.length > 0;
              resolve({
                success: true,
                message: hasErrors
                  ? `Import finished with warnings. Recent errors: ${msg.recent_errors.join(", ")}`
                  : "Import completed successfully.",
                total_rows: (msg.inserted || 0) + (msg.skipped || 0),
                items_processed: msg.inserted || 0,
                errors: msg.recent_errors,
              });
            }
          }
        } catch (err) {
          consecutiveFails++;
          if (consecutiveFails > 10) {
            clearInterval(interval);
            resolve({
              success: false,
              message: "Lost connection to the server while checking progress.",
              total_rows: 0,
              items_processed: 0,
            });
          }
        }
      }, 1000); 

      setTimeout(() => {
        clearInterval(interval);
        resolve({
          success: false,
          message: "Import timed out. The background job might have failed.",
          total_rows: 0,
          items_processed: 0,
        });
      }, 180000);
    });
  },

  downloadTemplate() {
    return downloadStaticTemplate("codes/item_classification_template.csv");
  },
};
