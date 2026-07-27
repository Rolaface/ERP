import { useState, useCallback, useEffect } from "react";
import { useCompanyStore } from "../store/companyStore";
import {
  getPurchaseInvoices,
  getPurchaseInvoiceById,
} from "../api/procurement/PurchaseInvoiceApi";
import { createDebitNote, updateDebitNote } from "../api/DebitNoteapi";
import { showApiError, showSuccess } from "../utils/alert";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PurchaseInvoiceOption {
  value: string;
  label: string;
  supplierId: string;
  supplierName: string;
}

export interface DebitNoteItem {
  item_code: string;
  item_name: string;
  qty: number | null;
  rate: number | null;
  batch_no: string;
  warehouse: string;
}

export interface SupplierMeta {
  id: string;
  name: string;
}

export interface DebitNoteFormState {
  return_against: string;
  supplier: SupplierMeta | null;

  items: DebitNoteItem[];
  exchange_rate: number;
  currency: string;
}

const EMPTY_FORM: DebitNoteFormState = {
  return_against: "",
  supplier: null,

  items: [],
  exchange_rate: 1,
  currency: "",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDebitNoteForm(
  onSuccess?: (data: any) => void,
  onClose?: () => void,
  initialData?: any,
  isEdit?: boolean,
) {
  const { companyName } = useCompanyStore();

  const [form, setForm] = useState<DebitNoteFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // ── Unsaved changes guard (same pattern as Asset modal) ──────────────────
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  // useEffect(() => {
  //     if (!initialData) return;
  //     setForm({
  //       return_against: initialData.return_against || "",
  //       supplier: {
  //         id: initialData.supplier || "",
  //         name: initialData.supplier || "",
  //       },
  //       update_stock: !!initialData.update_stock,
  //       items: (initialData.items || []).map((it: any) => ({
  //         item_code: it.item_code,
  //         item_name: it.item_name,
  //         qty: Number(it.qty),
  //         rate: Number(it.rate),
  //         batch_no: it.batch_no || "",
  //         warehouse: it.warehouse || "",
  //       })),
  //       exchange_rate: Number(initialData.exchange_rate) || 1,
  //     });
  //   }, [initialData]);
  useEffect(() => {
    if (!initialData) return;

    setForm({
      // Maps piId or return_against
      return_against: initialData.return_against || initialData.piId || "",

      // Maps supplierId/supplierName
      supplier: {
        id: initialData.supplierId || initialData.supplier || "",
        name:
          initialData.supplierName ||
          initialData.supplier_name ||
          initialData.supplier ||
          "",
      },

      // Maps item array with camelCase fallbacks
      items: (initialData.items || []).map((it: any) => ({
        item_code: it.itemCode || it.item_code || "",
        item_name: it.itemName || it.item_name || "",
        // Keeps the quantity negative if it comes as negative from the API
        qty: Number(it.quantity ?? it.qty ?? 0),
        rate: Number(it.rate ?? 0),
        batch_no: it.batchNo || it.batch_no || "",
        warehouse: it.warehouse || "",
      })),

      // Maps exchangeRate
      exchange_rate:
        Number(initialData.exchangeRate ?? initialData.exchange_rate) || 1,
      currency: initialData.currency || initialData.currency_code || "",
    });
  }, [initialData]);

  // ── Invoice search ───────────────────────────────────────────────────────

  const fetchInvoiceOptions = useCallback(
    async (query: string): Promise<PurchaseInvoiceOption[]> => {
      try {
        const res = await getPurchaseInvoices(1, 50);
        return (res?.data ?? []).map((r: any) => ({
          value: r.pId,
          label: r.pId,
          supplierId: r.supplierId,
          supplierName: r.supplierName,
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  // ── Invoice select → fetch full details & populate form ─────────────────

  const handleInvoiceSelect = useCallback(
    async (opt: PurchaseInvoiceOption) => {
      setForm((prev) => ({
        ...prev,
        return_against: opt.value,
        supplier: { id: opt.supplierId, name: opt.supplierName },
        items: [],
        exchange_rate: 1,
      }));
      markDirty();

      setInvoiceLoading(true);
      try {
        const res = await getPurchaseInvoiceById(opt.value);
        const data = res?.data ?? res?.message?.data;
        if (!data) return;

        const mappedItems: DebitNoteItem[] = (data.items ?? []).map(
          (it: any): DebitNoteItem => ({
            item_code: it.itemCode ?? "",
            item_name: it.itemName ?? it.itemCode ?? "",
            qty: -Math.abs(Number(it.quantity) || 1),
            rate: Number(it.rate) || 0,
            batch_no: it.batchNo ?? "",
            warehouse: it.warehouse ?? "",
          }),
        );

        setForm((prev) => ({
          ...prev,
          supplier: {
            id: data.supplierId ?? opt.supplierId,
            name: data.supplierName ?? opt.supplierName,
          },
          items: mappedItems,
          exchange_rate: Number(data.exchangeRate) || 1,
          currency: data.currency,
        }));
      } catch (err) {
        console.error("Failed to load invoice details", err);
        showApiError("Failed to load invoice details");
      } finally {
        setInvoiceLoading(false);
      }
    },
    [markDirty],
  );

  // ── Item mutations ───────────────────────────────────────────────────────

  const handleItemChange = useCallback(
    (
      index: number,
      field: keyof DebitNoteItem,
      value: string | number | null,
    ) => {
      setForm((prev) => {
        const items = [...prev.items];
        items[index] = {
          ...items[index],
          [field]:
            value === null
              ? null
              : field === "qty" || field === "rate"
                ? Number(value)
                : value,
        };
        return { ...prev, items };
      });
      markDirty();
    },
    [markDirty],
  );

  const handleWarehouseDefault = useCallback(
    (index: number, warehouse: string) => {
      setForm((prev) => {
        if (prev.items[index]?.warehouse) return prev;
        const items = [...prev.items];
        items[index] = { ...items[index], warehouse };
        return { ...prev, items };
      });
      // auto-default is not a user edit — no markDirty
    },
    [],
  );

  const removeItem = useCallback(
    (index: number) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
      markDirty();
    },
    [markDirty],
  );

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    resetDirty();
  }, [resetDirty]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = useCallback((): string | null => {
    if (!form.return_against) return "Please select an invoice";
    if (!form.supplier?.id)
      return "Supplier could not be resolved from the selected invoice";
    if (form.items.length === 0) return "At least one item is required";
    for (const it of form.items) {
      if (!it.warehouse)
        return `Warehouse is required for: ${it.item_name || it.item_code}`;
    }
    return null;
  }, [form]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (saving) return;

      const error = validate();
      if (error) {
        showApiError(error);
        return;
      }

      const payload = {
        is_return: 1 as const,
        return_against: form.return_against,
        supplier: form.supplier!.id,
        company: companyName,
        update_stock: 1 as const,
        conversion_rate: form.exchange_rate,
        currency: form.currency,
        items: form.items.map((it) => ({
          item_code: it.item_code,
          qty: Number(it.qty),
          rate: Number(it.rate),
          ...(it.batch_no ? { batch_no: it.batch_no } : {}),
          warehouse: it.warehouse,
        })),
      };

      setSaving(true);
      try {
        // Fallback through the possible ID keys (name, piId, or id)
        const docId = initialData?.name || initialData?.piId || initialData?.id;

        const res =
          isEdit && docId
            ? await updateDebitNote(docId, payload)
            : await createDebitNote(payload);

        if (!res || ![200, 201].includes(res.status_code)) {
          showApiError(res?.message ?? "Debit note operation failed");
          return;
        }

        if (res._server_messages) {
          try {
            const msgs: any[] = JSON.parse(res._server_messages);
            msgs.forEach((raw) => {
              try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                console.warn(
                  "[DebitNote server message]",
                  parsed?.message ?? parsed,
                );
              } catch {
                console.warn("[DebitNote server message]", raw);
              }
            });
          } catch {
            console.warn("[DebitNote server messages]", res._server_messages);
          }
        }

        showSuccess(res.message);
        resetDirty();
        onSuccess?.(res.data);
        onClose?.();
        useDataRefreshStore
          .getState()
          .triggerRefresh(REFRESH_KEYS.DEBIT_NOTE_LIST);
      } catch (err: any) {
        console.error("Debit note operation failed", err);
        showApiError(err?.message ?? err);
      } finally {
        setSaving(false);
      }
    },
    [
      saving,
      validate,
      form,
      companyName,
      onSuccess,
      onClose,
      isEdit,
      initialData,
      resetDirty,
    ],
  );

  // ── Derived ──────────────────────────────────────────────────────────────

  const grandTotal = form.items.reduce((sum, it) => {
    const qty = Math.abs(it.qty ?? 0);
    const rate = it.rate ?? 0;
    return sum + qty * rate;
  }, 0);

  return {
    form,
    saving,
    invoiceLoading,
    grandTotal,
    fetchInvoiceOptions,
    handleInvoiceSelect,
    handleItemChange,
    handleWarehouseDefault,
    removeItem,

    reset,
    handleSubmit,
    validate,
    // expose guard helpers so the modal can wire up close protection
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
  };
}
