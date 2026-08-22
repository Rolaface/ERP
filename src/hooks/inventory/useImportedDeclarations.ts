import { useCallback, useEffect, useState } from "react";
import { fetchImportedDeclarations } from "../../api/Inventory/Processimportmodal.api";
import type { ImportedDeclarationItemRaw } from "../../types/inventory/ImportedItem.types";

export function useImportedDeclarations() {
  const [declarations, setDeclarations] = useState<ImportedDeclarationItemRaw[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeclarations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchImportedDeclarations();
      console.log("[useImportedDeclarations] items set to state:", response);
      setDeclarations(response);
    } catch (err) {
      console.error("[useImportedDeclarations] error:", err);
      setError(err instanceof Error ? err.message : "Failed to load imported declarations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeclarations();
  }, [loadDeclarations]);

  return { declarations, isLoading, error, refresh: loadDeclarations };
}