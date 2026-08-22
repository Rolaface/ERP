import { useState, useCallback, useEffect, useRef } from "react";
import { useCompanyStore } from "../store/companyStore";
import { getAllSalesInvoices, getSalesInvoiceById } from "../api/salesApi";
import { createSalesDebitNote, getSalesDebitNoteReasons, updateSalesDebitNote } from "../api/SalesDebitNoteApi";
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

export interface SalesDebitNoteItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  batch_no: string;
  warehouse: string;
  conversion_factor: number;
  max_qty?: number;
}

export interface CustomerMeta {
  id: string;
  name: string;
}

export interface SalesDebitNoteFormState {
  return_against: string;
  customer: CustomerMeta | null;

  reason: string;
  code: string;
  description: string;
  items: SalesDebitNoteItem[];
  exchange_rate: number;
  currency: string;
}

const EMPTY_FORM: SalesDebitNoteFormState = {
  return_against: "",
  customer: null,
  reason: "",
  code: "",
  description: "",
  
  items: [],
  exchange_rate: 1, 
  currency: "",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSalesDebitNoteForm(
  onSuccess?: (data: any) => void,
  onClose?: () => void,
  initialData?: any,
  isEdit?: boolean,
) {
  const { companyName } = useCompanyStore();

  const [form, setForm] = useState<SalesDebitNoteFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const invoiceSelectTokenRef = useRef(0);
  const [reasonOptions, setReasonOptions] = useState<{ code: string; reason: string }[]>([]); 
  const [reasonsLoading, setReasonsLoading] = useState(false);

  // ── Fetch debit note reasons ────────────────────────────────────────────
  useEffect(() => {
    const fetchReasons = async () => {
      setReasonsLoading(true);
      try {
        const values = await getSalesDebitNoteReasons();
        setReasonOptions(values);
      } catch (err) {
        console.error("Failed to fetch sales debit note reasons", err);
      } finally {
        setReasonsLoading(false);
      }
    };
    fetchReasons();
  }, []);

  // ── Reason search ─────────────────────────────────────────────────────────

  const fetchReasonOptions = useCallback(
    async (query: string): Promise<{ code: string; reason: string }[]> => {
      try {
        const values = await getSalesDebitNoteReasons(query);
        return values;
      } catch (err) {
        console.error("Failed to fetch sales debit note reasons", err);
        return [];
      }
    },
    [],
  );

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  useEffect(() => {
    if (!initialData) return;

    let parsedRemarks: { name?: string; reason?: string; code?: string; description?: string } = {};
    const rawRemarks = initialData.reason ?? initialData.remarks; 
    if (typeof rawRemarks === "string" && rawRemarks.trim()) {
      try {
        parsedRemarks = JSON.parse(rawRemarks);
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
      currency: initialData.currency || initialData.currency_code || "", 
    });
  }, [initialData]);

  // ── Invoice search ───────────────────────────────────────────────────────

  const RETURNABLE_INVOICE_STATUSES = "Paid,Partly Paid,Unpaid,Overdue";

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

const handleInvoiceSelect = useCallback(
  async (opt?: InvoiceOption) => {
    if (!opt?.value) {
      invoiceSelectTokenRef.current += 1;
      setInvoiceLoading(false);

      setForm((prev) => ({
        ...prev,
        return_against: "",
        customer: null,
        items: [],
        exchange_rate: 1,
        currency: "",
      }));

      return;
    }

    const token = ++invoiceSelectTokenRef.current;

    setForm((prev) => ({
      ...prev,
      return_against: opt.value,
      customer: {
        id: opt.customerId,
        name: opt.customerName,
      },
      items: [],
    }));

    markDirty();
    setInvoiceLoading(true);

    try {
      const res = await getSalesInvoiceById(opt.value, false, true);

      if (token !== invoiceSelectTokenRef.current) return;

      const data = res?.data ?? res?.message?.data;

      if (!data) return;

      const mappedItems: SalesDebitNoteItem[] = (data.items ?? []).map(
        (it: any): SalesDebitNoteItem => ({
          item_code: it.itemCode ?? "",
          item_name: it.itemName ?? it.itemCode ?? "",
          qty: Math.abs(Number(it.quantity)) || 1,
          rate: Number(it.rate) || 0,
          batch_no: it.batchNo ?? "",
          warehouse: it.warehouse ?? "",
          conversion_factor: Number(it.conversion_factor) || 1,
          max_qty: Math.abs(Number(it.quantity)) || 1,
        }),
      );

      if (token !== invoiceSelectTokenRef.current) return;

      setForm((prev) => ({
        ...prev,
        customer: {
          id: data.customerId ?? opt.customerId,
          name: data.customerName ?? opt.customerName,
        },
        exchange_rate:
          Number(data.exchangeRate ?? data.conversionRate) || 1,
        items: mappedItems,
        currency: data.currency ?? "",
      }));
    } catch (err) {
      if (token !== invoiceSelectTokenRef.current) return;

      console.error("Failed to load invoice details", err);
      showApiError("Failed to load invoice details");
    } finally {
      if (token === invoiceSelectTokenRef.current) {
        setInvoiceLoading(false);
      }
    }
  },
  [markDirty],
);

  const handleItemChange = useCallback(
    (
      index: number,
      field: keyof SalesDebitNoteItem,
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

  const setReason = useCallback((reason: string, code: string) => {
    setForm((prev) => ({
      ...prev,
      reason,
      code,
      description: code === "07" ? prev.description : "",
    }));
    markDirty();
  }, [markDirty]);

  const setDescription = useCallback((description: string) => {
    setForm((prev) => ({ ...prev, description }));
    markDirty();
  }, [markDirty]);

  // ── Reset ────────────────────────────────────────────────────────────────

const reset = useCallback(() => {
  invoiceSelectTokenRef.current += 1;
  setInvoiceLoading(false);
  setForm(EMPTY_FORM);
  resetDirty();
}, [resetDirty]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = useCallback((): string | null => {
    if (!form.reason) return "Please select a debit note reason";
    if (
      form.code === "07" &&
      !form.description.trim()
    ) {
      return "Please provide a brief description for the reason";
    }
    if (!form.return_against) return "Please select an invoice";
    if (!form.customer?.id)
      return "Customer could not be resolved from the selected invoice";
    if (form.items.length === 0) return "At least one item is required";
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
        is_debit_note: 1 as const,
        return_against: form.return_against,
        customer: form.customer!.id,
        company: companyName,
        update_stock: 1 as const,
        conversion_rate: form.exchange_rate,
        update_outstanding_for_self: 1 as const,
        reason: JSON.stringify({
          name: form.reason,
          reason: form.reason,
          code: form.code,
          description: form.description,
        }),
        currency: form.currency,  
        items: form.items.map((it) => ({
          item_code: it.item_code,
          qty: Number(it.qty),
          // rate: Number(it.rate),
          price_list_rate: Number(it.rate),
          ...(it.batch_no ? { batch_no: it.batch_no } : {}),
          warehouse: it.warehouse,
          conversion_factor: it.conversion_factor, 
        })),
      };

      setSaving(true);
      try {
        const docId = initialData?.name || initialData?.piId || initialData?.id;

        const res = isEdit && docId
          ? await updateSalesDebitNote(docId, payload)
          : await createSalesDebitNote(payload);

        if (!res || ![200, 201].includes(res.status_code)) {
          const action = isEdit ? "update" : "creation";
          showApiError(res?.message ?? `Sales debit note ${action} failed`);
          return;
        }

        if (res._server_messages) {
          try {
            const msgs: any[] = JSON.parse(res._server_messages);
            msgs.forEach((raw) => {
              try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                console.warn("[SalesDebitNote server message]", parsed?.message ?? parsed);
              } catch {
                console.warn("[SalesDebitNote server message]", raw);
              }
            });
          } catch {
            console.warn("[SalesDebitNote server messages]", res._server_messages);
          }
        }

        showSuccess(res.message);
        resetDirty(); 
        onSuccess?.(res.data);
        onClose?.();
        useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.SALES_DEBIT_NOTE_LIST);
      } catch (err: any) {
        console.error("Sales debit note save failed", err);
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
    reset,
    handleSubmit,
    validate,
    reasonOptions,
    reasonsLoading,
    setReason,
    setDescription,
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
    fetchReasonOptions
  };
}