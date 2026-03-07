import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { showApiError, showSuccess } from "../utils/alert";
import type {
  PurchaseOrderFormData,
  POTab,
  TaxRow,
  PaymentRow,
} from "../types/Supply/purchaseOrder";
import {
  emptyPOForm,
  emptyItem,
  emptyTaxRow,
  emptyPaymentRow,
} from "../types/Supply/purchaseOrder";
import { createPurchaseOrder } from "../api/procurement/PurchaseOrderApi";
import { mapUIToCreatePO } from "../types/Supply/purchaseOrderMapper";
import { validatePO } from "./poValidator";
import { getPurchaseOrderById } from "../api/procurement/PurchaseOrderApi";
import { mapApiToUI } from "../types/Supply/purchaseOrderMapper";
import { getSupplierById } from "../../src/api/procurement/supplierApi";
import { getCompanyById } from "../api/companySetupApi";
import { mapSupplierToAddress } from "../types/Supply/purchaseOrderMapper";
import type { AddressBlock } from "../types/Supply/purchaseOrder";
import { getItemByItemCode } from "../api/itemApi";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

interface UsePurchaseOrderFormProps {
  isOpen: boolean;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
  poId?: string | number;
}

export const usePurchaseOrderForm = ({
  isOpen,
  onSuccess,
  onClose,
  poId,
}: UsePurchaseOrderFormProps) => {
  const [form, setForm] = useState<PurchaseOrderFormData>(emptyPOForm);
  const [activeTab, setActiveTab] = useState<POTab>("details");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyPOForm);
      setActiveTab("details");
    }
  }, [isOpen]);

  const isEditMode = !!poId;

  useEffect(() => {
    if (!isOpen) return;

    const loadCompanyBuyingTerms = async () => {
      try {
        const res = await getCompanyById(COMPANY_ID);
        const buyingTerms = res?.data?.terms?.buying;

        if (!buyingTerms) return;

        setForm((prev) => ({
          ...prev,
          terms: { buying: buyingTerms },
        }));
      } catch (e) {
        console.error("Failed to load company buying terms", e);
      }
    };

    loadCompanyBuyingTerms();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setForm((prev) => ({
      ...prev,
      taxCategory: "Non-Export",
      items: prev.items.map((item) => ({
        ...item,
        vatCd: "A",
      })),
    }));
  }, [isOpen]);

  // Load PO Data in Edit Mode
  useEffect(() => {
    if (!isOpen || !poId) return;

    const loadPO = async () => {
      const toastId = toast.loading("Loading Purchase Order...");

      try {
        const apiData = await getPurchaseOrderById(poId);
        const mapped = mapApiToUI(apiData);

        setForm(mapped);
        toast.success("Purchase Order Loaded", { id: toastId });
      } catch (err) {
        console.error("PO Load Error", err);
        toast.error("Failed to load Purchase Order", { id: toastId });
      }
    };

    loadPO();
  }, [isOpen, poId]);

  // Set default date on create mode
  useEffect(() => {
    if (!isOpen || poId) return;
    const today = new Date().toISOString().split("T")[0];
    setForm((prev) => ({ ...prev, date: today, requiredBy: today }));
  }, [isOpen, poId]);

  // Calculate totals (Items + Taxes + Rounding)
  useEffect(() => {
    const subTotal = form.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    );

    const itemTaxTotal = form.items.reduce((sum, item) => {
      const base = item.quantity * item.rate;
      return sum + (base * (item.vatRate || 0)) / 100;
    }, 0);

    const taxRowTotal = form.taxRows.reduce((sum, t) => {
      return sum + (t.amount * t.taxRate) / 100;
    }, 0);

    const grandTotal = subTotal + itemTaxTotal + taxRowTotal;

    const totalQuantity = form.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );

    const roundedTotal = Math.round(grandTotal);
    const roundingAdjustment = Number((roundedTotal - grandTotal).toFixed(2));

    setForm((p) => ({
      ...p,
      totalQuantity,
      grandTotal,
      roundingAdjustment,
      roundedTotal,
    }));
  }, [form.items, form.taxRows]);

  type AddressKey = keyof PurchaseOrderFormData["addresses"];

  const updateAddress = (
    key: AddressKey,
    field: keyof AddressBlock,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      addresses: {
        ...prev.addresses,
        [key]: {
          ...prev.addresses[key],
          [field]: value,
        },
      },
    }));
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("addresses.")) {
      const parts = name.split(".") as [
        "addresses",
        AddressKey,
        keyof AddressBlock,
      ];

      const [, key, field] = parts;
      updateAddress(key, field, value);
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = async (sup: any) => {
    if (!sup) return;

    try {
      const res = await getSupplierById(sup.id);
      const supplier = res?.data;
      if (!supplier) return;

      const destCode = "";

      setForm((p) => ({
        ...p,

        /*  BASIC SUPPLIER INFO  */
        supplier: supplier.supplierName,
        supplierId: supplier.supplierId,
        supplierCode: supplier.supplierCode,
        supplierEmail: supplier.emailId,
        supplierPhone: supplier.phoneNo,
        taxCategory: "Non-Export",

        /*   AUTO FETCHED FIELDS  */
        currency: supplier.currency || p.currency,
        supplierContact: supplier.contactPerson || "",

        /*  EXPORT HANDLING  */
        destnCountryCd: "",
        placeOfSupply: "",

        /*  ADDRESS AUTO FILL  */
        addresses: {
          ...p.addresses,
          supplierAddress: mapSupplierToAddress(
            supplier,
            p.addresses.supplierAddress,
          ),
        },
      }));
    } catch (e) {
      console.error("Supplier detail fetch failed", e);
    }
  };

  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    const { name, value } = e.target;
    const isNum = ["quantity", "rate"].includes(name);
    const items = [...form.items];
    items[idx] = { ...items[idx], [name]: isNum ? Number(value) : value };
    setForm((p) => ({ ...p, items }));
  };

  const addItem = () => {
    setForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));
    toast.success("New item row added");
  };

  const removeItem = (idx: number) => {
    if (form.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    toast.success("Item removed");
  };

  const handleTaxRowChange = (idx: number, key: keyof TaxRow, value: any) => {
    const taxRows = [...form.taxRows];
    taxRows[idx] = { ...taxRows[idx], [key]: value };
    setForm((p) => ({ ...p, taxRows }));
  };

  const addTaxRow = () => {
    setForm((p) => ({ ...p, taxRows: [...p.taxRows, { ...emptyTaxRow }] }));
  };

  const removeTaxRow = (idx: number) => {
    setForm((p) => ({ ...p, taxRows: p.taxRows.filter((_, i) => i !== idx) }));
  };

  const handlePaymentRowChange = (
    idx: number,
    key: keyof PaymentRow,
    value: any,
  ) => {
    const paymentRows = [...form.paymentRows];
    paymentRows[idx] = { ...paymentRows[idx], [key]: value };
    setForm((p) => ({ ...p, paymentRows }));
  };

  const addPaymentRow = () => {
    setForm((p) => ({
      ...p,
      paymentRows: [...p.paymentRows, { ...emptyPaymentRow }],
    }));
  };

  const removePaymentRow = (idx: number) => {
    if (form.paymentRows.length === 1) return;
    setForm((p) => ({
      ...p,
      paymentRows: p.paymentRows.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveTemplate = (html: string) => {
    setForm((p) => ({ ...p, messageHtml: html }));
    console.warn("Template saved:", {
      name: form.templateName,
      type: form.templateType,
      subject: form.subject,
      messageHtml: html,
    });
    toast.success("Template saved!");
  };

  const resetTemplate = () => {
    setForm((p) => ({
      ...p,
      templateName: "",
      templateType: "",
      subject: "",
      messageHtml: "",
      sendAttachedFiles: false,
      sendPrint: false,
    }));
  };

  const getCurrencySymbol = () => {
    switch (form.currency) {
      case "INR":
        return "₹";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "ZMW":
        return "K";
      default:
        return "K";
    }
  };

  const handleItemSelect = async (itemId: string, idx: number) => {
    try {
      const res = await getItemByItemCode(itemId);
      if (!res || res.status_code !== 200) return;

      const data = res.data;

      setForm((prev) => {
        const items = [...prev.items];

        items[idx] = {
          ...items[idx],
          itemCode: data.id,
          itemName: data.itemName,
          uom: data.unitOfMeasureCd || "Unit",
          rate: Number(data.sellingPrice || 0),
          vatRate: Number(data.taxPerct || 0),
          vatCd: "A",
        };

        return { ...prev, items };
      });
    } catch (err) {
      console.error("Failed to fetch item details", err);
      toast.error("Failed to load item details");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!form.taxCategory) {
      showApiError({
        message: "Tax Category is required",
      });
      return;
    }

    const errors = validatePO(form);

    if (errors.length) {
      showApiError({
        message: [...new Set(errors)].join("\n"),
      });
      return;
    }

    try {
      setSaving(true);

      const payload = mapUIToCreatePO(form);

      // ❌ EDIT NOT ALLOWED
      if (isEditMode) {
        showApiError({
          message:
            "Editing Purchase Order is not supported. Only status update is allowed.",
        });
        return;
      }

      // ✅ CREATE ONLY
      const res = await createPurchaseOrder(payload);

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      showSuccess("Purchase Order Created");

      onSuccess?.(res);
      onClose?.();
      reset();
    } catch (error: any) {
      showApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(emptyPOForm);
    setActiveTab("details");
  };

  return {
    form,
    activeTab,
    setActiveTab,
    handleFormChange,
    handleSupplierChange,
    handleItemChange,
    addItem,
    removeItem,
    handleTaxRowChange,
    addTaxRow,
    removeTaxRow,
    handlePaymentRowChange,
    addPaymentRow,
    removePaymentRow,
    handleSaveTemplate,
    handleItemSelect,
    resetTemplate,
    getCurrencySymbol,
    handleSubmit,
    reset,
    setForm,
  };
};

function getCountryCode(list: any[], countryName?: string): string {
  if (!countryName || !Array.isArray(list)) return "";

  const n = countryName.trim().toLowerCase();

  const byCode = list.find((c: any) => c.code?.toLowerCase() === n);
  if (byCode) return byCode.code;

  const byName = list.find((c: any) => c.name?.toLowerCase().includes(n));
  if (byName) return byName.code;

  const reverse = list.find((c: any) => n.includes(c.name?.toLowerCase()));
  if (reverse) return reverse.code;

  return "";
}
