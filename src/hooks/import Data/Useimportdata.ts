import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { showApiError, showSuccess, showLoading, closeSwal, updateLoading } from "../../utils/alert";
import { IMPORT_MODULES } from "../../views/Import/Importmodules.config";
import type { ImportApi } from "../../api/imports/createImportApi";
import { useSubscriptionAccess } from "../../store/subscriptionStore";


const pendingKeyFor = (moduleKey: string, subTypeKey?: string) =>
  subTypeKey ? `${moduleKey}:${subTypeKey}` : moduleKey;


const resolveApi = (moduleKey: string, subTypeKey?: string): ImportApi | undefined => {
  const mod = IMPORT_MODULES.find((m) => m.key === moduleKey);
  if (!mod) return undefined;
  if (subTypeKey) {
    return mod.subTypes?.find((st) => st.key === subTypeKey)?.api;
  }
  return mod.api;
};

export function useImportData() {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [pendingTemplateKey, setPendingTemplateKey] = useState<string | null>(null);
  const [pendingImportKey, setPendingImportKey] = useState<string | null>(null);

   const { isLoading: subscriptionLoading, ...access } = useSubscriptionAccess();

  const filtered = useMemo(() => {
    return IMPORT_MODULES.filter((m) => {
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(m.category);
      const matchesQuery = m.title.toLowerCase().includes(query.trim().toLowerCase());
      const matchesSubscription = !m.subscriptionCheck || m.subscriptionCheck(access);
    return matchesCategory && matchesQuery && matchesSubscription;
    });
 }, [query, selectedCategories, access]);

  const downloadTemplate = async (moduleKey: string, subTypeKey?: string) => {
    const api = resolveApi(moduleKey, subTypeKey);

    if (!api?.downloadTemplate) {
      showApiError("Template download isn't available for this yet.");
      return;
    }

    const pendingKey = pendingKeyFor(moduleKey, subTypeKey);
    setPendingTemplateKey(pendingKey);
    try {
      const file = await api.downloadTemplate();
      saveAs(file.blob, file.fileName);
    } catch (err) {
      showApiError(err);
    } finally {
      setPendingTemplateKey(null);
    }
  };

  const importFile = async (
    moduleKey: string,
    file: File,
    subTypeKey?: string,
  ): Promise<boolean> => {
    const api = resolveApi(moduleKey, subTypeKey);

    if (!api?.uploadFile) {
      // API not wired yet (see Importmodules.config.ts).
      showApiError("Import isn't connected for this yet.");
      return false;
    }

    const pendingKey = pendingKeyFor(moduleKey, subTypeKey);
    setPendingImportKey(pendingKey);
    try {
      showLoading("Uploading and processing file...");
      const res = await api.uploadFile(file, (pct, details) => {
        updateLoading(`
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; color: #334155;">
              <span>Processing Records...</span>
              <span style="color: #4f46e5;">${pct}%</span>
            </div>
            
            <div style="background: #f1f5f9; border-radius: 999px; height: 8px; width: 100%; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
              <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 100%; width: ${pct}%; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 999px;"></div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 4px;">
              <div style="display: flex; flex-direction: column; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; flex: 1;">
                <span style="font-size: 18px; font-weight: 700; color: #10b981; line-height: 1;">${details?.inserted || 0}</span>
                <span style="font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-weight: 500; letter-spacing: 0.03em;">Inserted</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; flex: 1;">
                <span style="font-size: 18px; font-weight: 700; color: #f59e0b; line-height: 1;">${details?.skipped || 0}</span>
                <span style="font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-weight: 500; letter-spacing: 0.03em;">Skipped</span>
              </div>
            </div>

            ${details?.recent_errors?.length ? `
              <div style="margin-top: 4px; text-align: left; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px;">
                <span style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #ef4444; margin-bottom: 4px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  Recent Issue
                </span>
                <span style="font-size: 11px; color: #991b1b; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${details.recent_errors[details.recent_errors.length - 1].replace(/"/g, '&quot;')}">
                  ${details.recent_errors[details.recent_errors.length - 1]}
                </span>
              </div>
            ` : ""}
          </div>
        `);
      });
      closeSwal();

      if (!res.success) {
        const errorDetail = res.errors?.length ? ` (${res.errors[0]})` : "";
        showApiError((res.message || "Import failed") + errorDetail);
        return false;
      }

      showSuccess(
        res.items_processed
          ? `Imported ${res.items_processed} records successfully`
          : res.message || "Import completed successfully",
      );
      return true;
    } catch (err) {
      closeSwal();
      showApiError(err);
      return false;
    } finally {
      setPendingImportKey(null);
    }
  };

  return {
    modules: filtered,
    query,
    setQuery,
    selectedCategories,
    setSelectedCategories,
    downloadTemplate,
    importFile,
    pendingTemplateKey,
    pendingImportKey,
  };
}