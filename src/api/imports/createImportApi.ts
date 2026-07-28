import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { ERP_BASE } from "../../config/api";
import { downloadStaticTemplate } from "../../utils/downloadStaticTemplate";

const api = createAxiosInstance(ERP_BASE);

export interface ImportResult {
  success: boolean;
  message: string;
  total_rows: number;
  items_processed: number;
  errors?: string[];
}

interface CreateImportApiConfig<TRaw> {
  
  uploadEndpoint: string;
  templatePath: string;

  parseResponse: (raw: TRaw) => ImportResult;
}

export interface ImportApi {
  uploadFile: (file: File) => Promise<ImportResult>;
  downloadTemplate: () => ReturnType<typeof downloadStaticTemplate>;
}

/** Build a { uploadFile, downloadTemplate } pair for one module/sub-type. */
export function createImportApi<TRaw = any>({
  uploadEndpoint,
  templatePath,
  parseResponse,
}: CreateImportApiConfig<TRaw>): ImportApi {
  return {
    async uploadFile(file) {
      const formData = new FormData();
      formData.append("file", file);

      const resp: AxiosResponse<{ message: TRaw }> = await api.post(
        uploadEndpoint,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      return parseResponse(resp.data.message);
    },

    downloadTemplate() {
      return downloadStaticTemplate(templatePath);
    },
  };
}