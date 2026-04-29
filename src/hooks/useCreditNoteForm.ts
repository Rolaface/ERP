import { useState, useCallback, useEffect } from "react";
import { useCompanyStore } from "../store/companyStore";
import { getAllSalesInvoices, getSalesInvoiceById } from "../api/salesApi";
import { createCreditNote, updateCreditNote } from "../api/CreditNoteapi";
import { showApiError, showSuccess } from "../utils/alert";

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
  items: CreditNoteItem[];
}

const EMPTY_FORM: CreditNoteFormState = {
  return_against: "",
  customer: null,
  update_stock: true,
  items: [],
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

  useEffect(() => {
    if (!initialData) return;

    setForm({
      return_against: initialData.return_against || "",
      customer: {
        id: initialData.customer || "",
        name: initialData.customer || "",
      },
      update_stock: !!initialData.update_stock,
      items: (initialData.items || []).map((it: any) => ({
        item_code: it.item_code,
        item_name: it.item_name,
        qty: Number(it.qty),
        rate: Number(it.rate),
        batch_no: it.batch_no || "",
        warehouse: it.warehouse || "",
      })),
    });
  }, [initialData]);

  // ── Invoice search ───────────────────────────────────────────────────────

  const fetchInvoiceOptions = useCallback(
    async (query: string): Promise<InvoiceOption[]> => {
      try {
        const res = await getAllSalesInvoices(1, 50, "", "asc", query);
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
  }, []);

  // ── Item mutations ───────────────────────────────────────────────────────

  const handleItemChange = useCallback(
    (index: number, field: keyof CreditNoteItem, value: string | number) => {
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
    if (!form.customer?.id)
      return "Customer could not be resolved from the selected invoice";
    if (form.items.length === 0) return "At least one item is required";
    for (const it of form.items) {
      if (!it.warehouse)
        return `Warehouse is required for: ${it.item_name || it.item_code}`;
    }
    return null;
  }, [form]);


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
        const res = isEdit && initialData?.name
          ? await updateCreditNote(initialData.name, payload)
          : await createCreditNote(payload);

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
        onSuccess?.(res.data);
        onClose?.();
      } catch (err: any) {
        console.error("Credit note creation failed", err);
        showApiError(err);
      } finally {
        setSaving(false);
      }
    },
    [saving, validate, form, companyName, onSuccess, onClose, isEdit, initialData],
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