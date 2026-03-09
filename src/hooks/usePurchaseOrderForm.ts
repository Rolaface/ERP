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
  const [customShippingRule, setCustomShippingRule] = useState("");
  const [customIncoterm, setCustomIncoterm] = useState("");
  const [companyDefaults, setCompanyDefaults] = useState<{
    buyingTerms?: any;
    companyBillingAddress?: any;
    baseCurrency?: string;
  }>({});

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyPOForm);
      setActiveTab("details");
    }
  }, [isOpen]);

  const isEditMode = !!poId;

  useEffect(() => {
    if (!isOpen || !COMPANY_ID) return;

    const loadCompanyData = async () => {
      try {
        const res = await getCompanyById(COMPANY_ID);

        const company =
          res?.data?.data ||   // if wrapped
          res?.data ||         // if semi wrapped
          res;

        if (!company?.companyName) return;
        const buyingTerms = company?.terms?.buying;
        const baseCurrency = company?.financialConfig?.baseCurrency;

        const companyBillingAddress: AddressBlock = {
          addressTitle: company.companyName || "",
          addressType: "Billing",
          addressLine1: company.address?.addressLine1 || "",
          addressLine2: company.address?.addressLine2 || "",
          city: company.address?.city || "",
          state: company.address?.province || "",
          postalCode: company.address?.postalCode || "",
          country: company.address?.country || "",
          phone: company.contactInfo?.companyPhone || "",
          email: company.contactInfo?.companyEmail || "",
        };

        setCompanyDefaults({
          buyingTerms,
          baseCurrency,
          companyBillingAddress,
        });

        setForm((prev) => ({
          ...prev,
          terms: {
            ...prev.terms,
            buying: buyingTerms || prev.terms?.buying,
          },
          currency: baseCurrency || prev.currency,
          addresses: {
            ...prev.addresses,
            companyBillingAddress,
          },
        }));

      } catch (e) {
        console.error("Failed to load company data", e);
      }
    };

    loadCompanyData();
  }, [isOpen, poId]);


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
    setForm((prev) => ({ ...prev, date: today }));
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
        taxCategory: supplier.taxCategory || "",

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
    items[idx] = {
      ...items[idx],
      [name]: isNum ? (value === "" ? "" : Number(value)) : value,
    };
    setForm((p) => ({ ...p, items }));
  };

  const addItem = () => {
    setForm((p) => ({
      ...p,
      items: [
        ...p.items,
        {
          ...emptyItem,
          requiredBy: p.date,
        },
      ],
    }));
  };

  const removeItem = (idx: number) => {
    if (form.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
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
    console.log("Template saved:", {
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

  const validateTab = (tab: POTab): string | null => {
    if (tab === "details") {
      if (!form.supplierId) return "Supplier is required";
      if (!form.date) return "PO Date is required";

      if (!form.items.length || !form.items[0].itemCode) {
        return "Please add at least one item";
      }

      for (let i = 0; i < form.items.length; i++) {
        const item = form.items[i];

        if (!item.itemCode) return `Row ${i + 1}: Item required`;
        if (!item.quantity || item.quantity <= 0)
          return `Row ${i + 1}: Quantity required`;
        if (!item.rate || item.rate <= 0)
          return `Row ${i + 1}: Rate required`;

          if (!item.vatCd || !item.vatCd.trim())
    return `Row ${i + 1}: Tax Code required`;
      }
    }

    if (tab === "address") {
      const supplier = form.addresses?.supplierAddress;
      const dispatch = form.addresses?.dispatchAddress;
      const shipping = form.addresses?.shippingAddress;

      if (!supplier?.addressLine1?.trim())
        return "Supplier Address Line 1 is required";

      if (!dispatch?.addressLine1?.trim())
        return "Dispatch Address Line 1 is required";

      if (!shipping?.addressLine1?.trim())
        return "Shipping Address Line 1 is required";
    }

    return null;
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
          description: data.description,


          rate: Number(data.buyingPrice ?? 0),
          uom: data.unitOfMeasureCd,
          vatRate: Number(data.taxInfo?.taxPerct ?? 0),
          vatCd: data.taxInfo?.taxCode ?? "",
          requiredBy: items[idx].requiredBy || prev.date,
          packingUnit: Number(data.packingUnit || 0),
          packingSize: Number(data.packingSize || 0),
          packing: `(${data.packingUnit || 0}) x (${data.packingSize || 0})`,
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

      const finalForm = {
        ...form,
        shippingRule:
          form.shippingRule === "OTHER"
            ? customShippingRule
            : form.shippingRule,

        incoterm:
          form.incoterm === "OTHER"
            ? customIncoterm
            : form.incoterm,
      };

      const payload = mapUIToCreatePO(finalForm);

      let res;

      if (isEditMode) {
        showApiError({
          message:
            "Editing Purchase Order is not supported. Only status update is allowed.",
        });
        return;
      }


      res = await createPurchaseOrder(payload);

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
    setForm({
      ...emptyPOForm,

      terms: {
        ...(emptyPOForm.terms ?? {}),
        buying:
          companyDefaults.buyingTerms ??
          emptyPOForm.terms?.buying,
      },

      currency:
        companyDefaults.baseCurrency ??
        emptyPOForm.currency,

      addresses: {
        ...(emptyPOForm.addresses ?? {}),
        companyBillingAddress:
          companyDefaults.companyBillingAddress ??
          emptyPOForm.addresses?.companyBillingAddress,
      },
    });

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
    validateTab,
    setForm,
    customShippingRule,
    setCustomShippingRule,
    customIncoterm,
    setCustomIncoterm,
  };
};
