import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { IMPORT_MODULES } from "../../views/Import/Importmodules.config";
import type { ImportApi } from "../../api/imports/createImportApi";


const pendingKeyFor = (moduleKey: string, subTypeKey?: string) =>
  subTypeKey ? `${moduleKey}:${subTypeKey}` : moduleKey;

// Looks up the module/sub-type's own bound api object directly off the
// config — no separate handlers file, no string-key matching to keep
// in sync.
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

  const filtered = useMemo(() => {
    return IMPORT_MODULES.filter((m) => {
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(m.category);
      const matchesQuery = m.title.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategories]);

  const downloadTemplate = async (moduleKey: string, subTypeKey?: string) => {
    const api = resolveApi(moduleKey, subTypeKey);

    // Guard: some modules/sub-types don't have an api wired up yet —
    // fail gracefully instead of crashing.
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
      const res = await api.uploadFile(file);
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