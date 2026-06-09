import { useState } from "react";

import type {
  RfqFormData,
  RfqTab,
  SupplierRow,
  ItemRow,
  PaymentRow,
} from "../types/Supply/rfq";

import {
  emptyRfqForm,
  emptySupplier,
  emptyItem,
  emptyPaymentRow,
} from "../types/Supply/rfq";
import { getRFQById } from "../api/procurement/rfqApi";
import type { TermSection } from "../types/termsAndCondition";
import { createRFQ , updateRFQ } from "../api/procurement/rfqApi";
import {
  showSuccess,
  showApiError,
  showLoading,
  closeSwal,
} from "../utils/alert";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";

interface UseRfqFormProps {
  onSuccess?: (data: RfqFormData) => void;
  onClose?: () => void;
}

export const useRfqForm = ({ onSuccess, onClose }: UseRfqFormProps) => {
  const [form, setForm] = useState<RfqFormData>(emptyRfqForm);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RfqTab>("details");
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
const [rfqId, setRfqId] = useState<string>("");

  /*  BASIC  */

  const setRfqNumber = (value: string) =>
    setForm((p) => ({ ...p, rfqNumber: value }));

  const setRequestDate = (value: string) =>
    setForm((p) => ({ ...p, requestDate: value }));

  const setQuoteDeadline = (value: string) =>
    setForm((p) => ({ ...p, quoteDeadline: value }));

  const setStatus = (value: string) =>
    setForm((p) => ({ ...p, status: value }));

  const fetchRFQById = async (id: string) => {
    try {
      setLoading(true);

      const res = await getRFQById(id);

      setForm({
        rfqNumber: res.name || "",
        requestDate: res.transaction_date || "",
        quoteDeadline: res.schedule_date || "",
        status: res.status || "Draft",

        suppliers:
          res.suppliers?.length > 0
            ? res.suppliers.map((s: any) => ({
              supplier: s.supplier || "",
              supplierName: s.supplier_name || "",
              contact: s.contact || "",
              email: s.email_id || "",
              sendEmail: Boolean(s.send_email),
            }))
            : [{ ...emptySupplier }],

        items:
          res.items?.length > 0
            ? res.items.map((it: any) => ({
              itemCode: it.item_code || "",
              itemName: it.item_code || "",
              description: it.description || "",
              uom: it.uom || "",
              warehouse: it.warehouse || "",
              quantity: Number(it.qty) || 1,
              requiredDate: it.schedule_date || "",
              conversionFactor: Number(it.conversion_factor) || 1,
            }))
            : [{ ...emptyItem }],

        paymentRows: [{ ...emptyPaymentRow }],

        terms: {
          buying: res.terms
            ? JSON.parse(res.terms)
            : emptyRfqForm.terms!.buying,
        },

        templateName: "",
        templateType: "Quote Email",
        subject: res.subject || "",
        messageHtml: res.message_for_supplier || "",
        sendAttachedFiles: Boolean(res.send_attached_files),
        sendPrint: Boolean(res.send_document_print),
      });
setIsEditMode(true);
setRfqId(id);
    } catch (error) {
      showApiError("Failed to load RFQ");
    } finally {
      setLoading(false);
    }
    
  };

  /*  SUPPLIERS  */

  const handleSupplierChange = (
    idx: number,
    field: keyof SupplierRow,
    value: any,
  ) => {
    setForm((p) => {
      const suppliers = [...p.suppliers];
      suppliers[idx] = { ...suppliers[idx], [field]: value };
      return { ...p, suppliers };
    });
  };

  const addSupplier = () => {
    setForm((p) => ({
      ...p,
      suppliers: [...p.suppliers, { ...emptySupplier }],
    }));
  };

  const removeSupplier = (idx: number) => {
    setForm((p) => {
      if (p.suppliers.length === 1) return p;
      return {
        ...p,
        suppliers: p.suppliers.filter((_, i) => i !== idx),
      };
    });
  };

  /*  ITEMS  */

  const handleItemChange = (idx: number, field: keyof ItemRow, value: any) => {
    setForm((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...p, items };
    });
  };

  const addItem = () => {
    setForm((p) => ({
      ...p,
      items: [...p.items, { ...emptyItem }],
    }));
  };

  const removeItem = (idx: number) => {
    setForm((p) => {
      if (p.items.length === 1) return p;
      return {
        ...p,
        items: p.items.filter((_, i) => i !== idx),
      };
    });
  };

  /*  PAYMENT ROWS  */

  const handlePaymentRowChange = (
    idx: number,
    field: keyof PaymentRow,
    value: any,
  ) => {
    setForm((p) => {
      const paymentRows = [...p.paymentRows];
      paymentRows[idx] = { ...paymentRows[idx], [field]: value };
      return { ...p, paymentRows };
    });
  };

  const addPaymentRow = () => {
    setForm((p) => ({
      ...p,
      paymentRows: [...p.paymentRows, { ...emptyPaymentRow }],
    }));
  };

  const removePaymentRow = (idx: number) => {
    setForm((p) => {
      if (p.paymentRows.length === 1) return p;
      return {
        ...p,
        paymentRows: p.paymentRows.filter((_, i) => i !== idx),
      };
    });
  };

  /*  TERMS  */

  const setTermsBuying = (updated: TermSection) => {
    setForm((prev) => ({
      ...prev,
      terms: { ...prev.terms, buying: updated },
    }));
  };

  /*  EMAIL TEMPLATE  */

  const setTemplateName = (value: string) =>
    setForm((p) => ({ ...p, templateName: value }));

  const setTemplateType = (value: string) =>
    setForm((p) => ({ ...p, templateType: value }));

  const setSubject = (value: string) =>
    setForm((p) => ({ ...p, subject: value }));

  const setMessageHtml = (value: string) =>
    setForm((p) => ({ ...p, messageHtml: value }));

  const setSendAttachedFiles = (value: boolean) =>
    setForm((p) => ({ ...p, sendAttachedFiles: value }));

  const setSendPrint = (value: boolean) =>
    setForm((p) => ({ ...p, sendPrint: value }));

  const handleSaveTemplate = () => {
    console.log("Template saved:", {
      name: form.templateName,
      type: form.templateType,
      subject: form.subject,
      messageHtml: form.messageHtml,
    });
  };

  const resetTemplate = () => {
    setForm((p) => ({
      ...p,
      templateName: "",
      templateType: "Quote Email",
      subject: "",
      messageHtml: "",
      sendAttachedFiles: true,
      sendPrint: false,
    }));
  };

  /*  SUBMIT  */

  const handleSubmit = async () => {
    if (saving) return false;

    try {
      setSaving(true);
      showLoading("Saving RFQ...");

      const payload = {
        transaction_date: form.requestDate,
        schedule_date: form.quoteDeadline,
        message_for_supplier: "",
        terms: form.terms?.buying ?? {},
        suppliers: form.suppliers
          .filter((s) => s.supplier.trim() !== "")
          .map((s) => ({
            supplier: s.supplier,   // ID e.g. "SUP-2026-00012"
            contact: s.contact,     // contact ID
            email_id: s.email,
          })),
        items: form.items
          .filter((it) => it.itemCode.trim() !== "")
          .map((it) => ({
            item_code: it.itemCode,
            qty: it.quantity,
            uom: it.uom,
            conversion_factor: it.conversionFactor ?? 1,
            schedule_date: it.requiredDate,
            warehouse: it.warehouse,
            description: it.description,
          })),
      };

     const res = isEditMode
  ? await updateRFQ(rfqId, payload)
  : await createRFQ(payload);
      closeSwal();

      const apiResponse = res?.message ?? res; // supports wrapped + normal response
      const statusCode = Number(apiResponse?.status_code);

      if (![200, 201].includes(statusCode)) {
        showApiError(apiResponse);
        return false;
      }

     showSuccess(apiResponse?.message || (isEditMode ? "RFQ updated successfully!" : "RFQ created successfully!"));
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.RFQ_LIST);
      onSuccess?.(form);
      reset();
      onClose?.();
      return true;
    } catch (err: any) {
      closeSwal();
      showApiError(err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  /*  RESET  */

  const reset = () => {
    setForm(emptyRfqForm);
    setActiveTab("details");
    setIsEditMode(false);   
  setRfqId("");           
  };

  /*  RETURN  */

  return {
    form,
    activeTab,
    setActiveTab,
    saving,
    setRfqNumber,
    setRequestDate,
    setQuoteDeadline,
    setStatus,
    handleSupplierChange,
    addSupplier,
    removeSupplier,
    handleItemChange,
    addItem,
    removeItem,
    handlePaymentRowChange,
    addPaymentRow,
    removePaymentRow,
    setTermsBuying,
    setTemplateName,
    setTemplateType,
    setSubject,
    setMessageHtml,
    setSendAttachedFiles,
    setSendPrint,
    handleSaveTemplate,
    resetTemplate,
    handleSubmit,
    reset,
    fetchRFQById,
    loading,
  isEditMode,
  };
};
