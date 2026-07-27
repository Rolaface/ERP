import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { IMPORT_MODULES } from "../../views/Import/Importmodules.config";

export function useImportData() {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Tracks which single module currently has a request in flight, so
  // only that module's card shows a spinner/disabled state.
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

  // Looks up the module and calls its own bound API — the caller
  // (the UI) never needs to know which api file that is.
  const downloadTemplate = async (moduleKey: string) => {
    const mod = IMPORT_MODULES.find((m) => m.key === moduleKey);
    if (!mod?.handlers) return;

    setPendingTemplateKey(moduleKey);
    try {
      const blob = await mod.handlers.downloadTemplate();
      saveAs(blob, `${moduleKey}_import_template.xlsx`);
    } catch (err) {
      showApiError(err);
    } finally {
      setPendingTemplateKey(null);
    }
  };

  const importFile = async (moduleKey: string, file: File): Promise<boolean> => {
    const mod = IMPORT_MODULES.find((m) => m.key === moduleKey);
    if (!mod?.handlers) {
      // API not wired yet for this module (see importModules.config.ts).
      showApiError("Import isn't connected for this module yet.");
      return false;
    }

    setPendingImportKey(moduleKey);
    try {
      showLoading("Uploading and processing file...");
      const res = await mod.handlers.uploadFile(file);
      closeSwal();

      if (!res || res.status_code !== 200) {
        showApiError(res?.message || "Import failed");
        return false;
      }

      showSuccess(
        res.data?.importedCount
          ? `Imported ${res.data.importedCount} records successfully`
          : "Import completed successfully",
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