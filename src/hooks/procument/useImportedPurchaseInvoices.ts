import { useCallback, useEffect, useState } from "react";
import { fetchImportedPurchaseInvoices } from "../../api/procurement/Importedpurchaseinvoice.api";
import type { ImportedPurchaseInvoiceItemRaw } from "../../types/procument/imported_purchase/Importedpurchaseinvoice.types";

export function useImportedPurchaseInvoices() {
  const [invoices, setInvoices] = useState<ImportedPurchaseInvoiceItemRaw[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchImportedPurchaseInvoices();
      setInvoices(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load imported purchase invoices"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return { invoices, isLoading, error, refresh: loadInvoices };
}