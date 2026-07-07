import { useState, useCallback, useEffect } from "react";
import { useCompanyStore } from "../store/companyStore";
import { getAllSalesInvoices, getSalesInvoiceById } from "../api/salesApi";
import { createCreditNote, getCreditNoteReasons, updateCreditNote } from "../api/CreditNoteapi";
import { showApiError, showSuccess } from "../utils/alert";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";
import { useUnsavedChanges } from "./useUnsavedChanges";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceOption {
  value: string;
  label: string;
  customerId: string;
  customerName: string;
}

export interface CreditNoteItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  batch_no: string;
  warehouse: string;
}

export interface CustomerMeta {
  id: string;
  name: string;
}

export interface CreditNoteFormState {
  return_against: string;
  customer: CustomerMeta | null;
  update_stock: boolean;
  reason: string;
  code: string;
  description: string;
  items: CreditNoteItem[];
  exchange_rate: number;
}

const EMPTY_FORM: CreditNoteFormState = {
  return_against: "",
  customer: null,
  reason: "",
  code: "",
  description: "",
  update_stock: true,
  items: [],
  exchange_rate: 1, 
};


// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCreditNoteForm(
  onSuccess?: (data: any) => void,
  onClose?: () => void,
  initialData?: any,
  isEdit?: boolean,
) {
  const { companyName } = useCompanyStore();

  const [form, setForm] = useState<CreditNoteFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [reasonOptions, setReasonOptions] = useState<{ code: string; reason: string }[]>([]); const [reasonsLoading, setReasonsLoading] = useState(false);
  // ── Fetch credit note reasons ────────────────────────────────────────────
 useEffect(() => {
  const fetchReasons = async () => {
    setReasonsLoading(true);
    try {
      const values = await getCreditNoteReasons();
      setReasonOptions(values);
    } catch (err) {
      console.error("Failed to fetch credit note reasons", err);
    } finally {
      setReasonsLoading(false);
    }
  };
  fetchReasons();
}, []);

  // ── Unsaved changes guard (same pattern as Asset modal) ──────────────────
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  useEffect(() => {
    if (!initialData) return;

    let parsedRemarks: { name?: string; reason?: string; code?: string; description?: string } = {};
    if (typeof initialData.remarks === "string" && initialData.remarks.trim()) {
      try {
        parsedRemarks = JSON.parse(initialData.remarks);
      } catch {
        parsedRemarks = {};
      }
    } else if (initialData.remarks && typeof initialData.remarks === "object") {
      parsedRemarks = initialData.remarks;
    }

    setForm({
      return_against: initialData.return_against || initialData.id || initialData.piId || "",
      customer: {
        id: initialData.customerId || initialData.customer || "",
        name: initialData.customerName || initialData.customer_name || initialData.customer || "",
      },
      update_stock: initialData.updateStock !== undefined
        ? !!initialData.updateStock
        : !!initialData.update_stock,
      reason: initialData.reason || parsedRemarks.reason || parsedRemarks.name || "",
      code: initialData.code || parsedRemarks.code || "",
      description: initialData.description || parsedRemarks.description || "",
      items: (initialData.items || []).map((it: any) => ({
        item_code: it.itemCode || it.item_code || "",
        item_name: it.itemName || it.item_name || "",
        qty: Math.abs(Number(it.quantity ?? it.qty ?? 0)),
        rate: Number(it.rate ?? 0),
        batch_no: it.batchNo || it.batch_no || "",
        warehouse: it.warehouse || "",
      })),

      exchange_rate: Number(initialData.exchangeRate ?? initialData.exchange_rate) || 1,
    });
  }, [initialData]);


  // ── Invoice search ───────────────────────────────────────────────────────

  const RETURNABLE_INVOICE_STATUSES = "Partly Paid,Unpaid,Overdue";


  const fetchInvoiceOptions = useCallback(
    async (query: string): Promise<InvoiceOption[]> => {
      try {
        const res = await getAllSalesInvoices(
          1,                              // page
          50,                             // page_size
          "",                             // sortBy
          "asc",                          // sortOrder
          query,                          // search
          undefined,                      // customer
          undefined,                      // minOutstanding
          RETURNABLE_INVOICE_STATUSES,    // status
        );
        return (res?.data ?? []).map((inv: any) => ({
          value: inv.id,
          label: inv.id,
          customerId: inv.customerId,
          customerName: inv.customerName,
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  // ── Invoice select → fetch full details & populate form ─────────────────

  const handleInvoiceSelect = useCallback(async (opt: InvoiceOption) => {
    setForm((prev) => ({
      ...prev,
      return_against: opt.value,
      customer: { id: opt.customerId, name: opt.customerName },
      items: [],
    }));
    markDirty(); // user explicitly chose an invoice — mark dirty

    setInvoiceLoading(true);
    try {
      const res = await getSalesInvoiceById(opt.value);
      const data = res?.data ?? res?.message?.data;
      if (!data) return;

      const mappedItems: CreditNoteItem[] = (data.items ?? []).map(
        (it: any): CreditNoteItem => ({
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
        customer: {
          id: data.customerId ?? opt.customerId,
          name: data.customerName ?? opt.customerName,
        },
        items: mappedItems,
      }));
    } catch (err) {
      console.error("Failed to load invoice details", err);
      showApiError("Failed to load invoice details");
    } finally {
      setInvoiceLoading(false);
    }
  }, [markDirty]);

  // ── Item mutations ───────────────────────────────────────────────────────

  const handleItemChange = useCallback(
    (
      index: number,
      field: keyof CreditNoteItem,
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
      // warehouse auto-default is not a user edit — no markDirty
    },
    [],
  );

  const removeItem = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    markDirty();
  }, [markDirty]);

  const toggleUpdateStock = useCallback(() => {
    setForm((prev) => ({ ...prev, update_stock: !prev.update_stock }));
    markDirty();
  }, [markDirty]);

  const setReason = useCallback((reason: string, code: string) => {
    setForm((prev) => ({
      ...prev,
      reason,
      code,
      description: reason === "Other (Provide other reason in brief)" ? prev.description : "",
    }));
    markDirty();
  }, [markDirty]);
  const setDescription = useCallback((description: string) => {
    setForm((prev) => ({ ...prev, description }));
    markDirty();
  }, [markDirty]);
  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    resetDirty();
  }, [resetDirty]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = useCallback((): string | null => {
    if (!form.reason) return "Please select a credit note reason";
    if (
      form.reason === "Other (Provide other reason in brief)" &&
      !form.description.trim()
    ) {
      return "Please provide a brief description for the reason";
    }
    if (!form.return_against) return "Please select an invoice";
    if (!form.customer?.id)
      return "Customer could not be resolved from the selected invoice";
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
        customer: form.customer!.id,
        company: companyName,
        update_stock: form.update_stock ? (1 as const) : (0 as const),
        update_outstanding_for_self: 1 as const,
        remarks: JSON.stringify({
          name: form.reason,
          reason: form.reason,
          code: form.code,
          description: form.description,
        }),
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
        const docId = initialData?.name || initialData?.piId || initialData?.id;

        const res = isEdit && docId
          ? await updateCreditNote(docId, payload)
          : await createCreditNote(payload);

        if (!res || ![200, 201].includes(res.status_code)) {
          const action = isEdit ? "update" : "creation";
          showApiError(res?.message ?? `Credit note ${action} failed`);
          return;
        }

        if (res._server_messages) {
          try {
            const msgs: any[] = JSON.parse(res._server_messages);
            msgs.forEach((raw) => {
              try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                console.warn("[CreditNote server message]", parsed?.message ?? parsed);
              } catch {
                console.warn("[CreditNote server message]", raw);
              }
            });
          } catch {
            console.warn("[CreditNote server messages]", res._server_messages);
          }
        }

        showSuccess(res.message);
        resetDirty(); 
        onSuccess?.(res.data);
        onClose?.();
        useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.CREDIT_NOTE_LIST);
      } catch (err: any) {
        console.error("Credit note save failed", err);
        console.error("Backend response:", err?.response?.data);
        showApiError(err);
      } finally {
        setSaving(false);
      }
    },
    [saving, validate, form, companyName, onSuccess, onClose, isEdit, initialData, resetDirty],
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
    // expose guard helpers so the modal can wire up close protection
    reasonOptions,
    reasonsLoading,
    setReason,
    setDescription,
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
  };
}