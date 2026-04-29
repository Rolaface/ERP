import { useState, useCallback } from "react";
import { useCompanyStore } from "../store/companyStore";
import { getPurchaseInvoices,getPurchaseInvoiceById } from "../api/procurement/PurchaseInvoiceApi";
import { createDebitNote } from "../api/DebitNoteapi";
import { showApiError, showSuccess } from "../utils/alert";

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
  qty: number;
  rate: number;
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
  update_stock: boolean;
  items: DebitNoteItem[];
}

const EMPTY_FORM: DebitNoteFormState = {
  return_against: "",
  supplier: null,
  update_stock: true,
  items: [],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDebitNoteForm(
  onSuccess?: (data: any) => void,
  onClose?: () => void,
) {
  const { companyName } = useCompanyStore();

  const [form, setForm] = useState<DebitNoteFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // ── Invoice search ───────────────────────────────────────────────────────

  const fetchInvoiceOptions = useCallback(
    async (query: string): Promise<PurchaseInvoiceOption[]> => {
      try {
        const res = await getPurchaseInvoices(1, 50);
        return (res?.data ?? []).map((pi: any) => ({
          value: pi.pId,
          label: pi.pId,
          suppplierId: pi.supplierId,
          supplierName: pi.supplierName,
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  // ── Invoice select → fetch full details & populate form ─────────────────

  const handleInvoiceSelect = useCallback(async (opt: PurchaseInvoiceOption) => {
    setForm((prev) => ({
      ...prev,
      return_against: opt.value,
      supplier: { id: opt.supplierId, name: opt.supplierName },
      items: [],
    }));

    setInvoiceLoading(true);
    try {
      const res = await getPurchaseInvoiceById(opt.value);
      const data = res?.data ?? res?.message?.data;
      if (!data) return;

      const mappedItems: DebitNoteItem[] = (data.items ?? []).map(
        (it: any): DebitNoteItem => ({
          item_code: it.itemCode ?? "",
          item_name: it.itemName ?? it.itemCode ?? "",
          qty: -(Math.abs(Number(it.quantity) || 1)),
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
      }));
    } catch (err) {
      console.error("Failed to load invoice details", err);
      showApiError("Failed to load invoice details");
    } finally {
      setInvoiceLoading(false);
    }
  }, []);

  // ── Item mutations ───────────────────────────────────────────────────────

  const handleItemChange = useCallback(
    (index: number, field: keyof DebitNoteItem, value: string | number) => {
      setForm((prev) => {
        const items = [...prev.items];
        items[index] = { ...items[index], [field]: value };
        return { ...prev, items };
      });
    },
    [],
  );

  const handleWarehouseDefault = useCallback(
    (index: number, warehouse: string) => {
      setForm((prev) => {
        if (prev.items[index]?.warehouse) return prev;
        const items = [...prev.items];
        items[index] = { ...items[index], warehouse };
        return { ...prev, items };
      });
    },
    [],
  );

  const removeItem = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const toggleUpdateStock = useCallback(() => {
    setForm((prev) => ({ ...prev, update_stock: !prev.update_stock }));
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => setForm(EMPTY_FORM), []);

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
        update_stock: form.update_stock ? (1 as const) : (0 as const),
        
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
        const res = await createDebitNote(payload);


        if (!res || ![200, 201].includes(res.status_code)) {
          showApiError(res?.message ?? "Credit note creation failed");
          return;
        }
        if (res._server_messages) {
          try {
            const msgs: any[] = JSON.parse(res._server_messages);
            msgs.forEach((raw) => {
              try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                console.warn("[DebitNote server message]", parsed?.message ?? parsed);
              } catch {
                console.warn("[DebitNote server message]", raw);
              }
            });
          } catch {
            console.warn("[DebitNote server messages]", res._server_messages);
          }
        }

        showSuccess(res.message);
        onSuccess?.(res.data);
        onClose?.();
      } catch (err: any) {
        console.error("Credit note creation failed", err);
        showApiError(err);
      } finally {
        setSaving(false);
      }
    },
    [saving, validate, form, companyName, onSuccess, onClose],
  );

  // ── Derived ──────────────────────────────────────────────────────────────

  const grandTotal = form.items.reduce(
    (sum, it) => sum + Math.abs(it.qty) * it.rate,
    0,
  );

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
    toggleUpdateStock,
    reset,
    handleSubmit,
    validate,
  };
}