import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { showApiError, showSuccess } from "../utils/alert";
import type {
  PurchaseInvoiceFormData,
  POTab,
  TaxRow,
  PaymentRow,
} from "../types/Supply/purchaseInvoice";
import {
  emptyPOForm,
  emptyItem,
  emptyTaxRow,
  emptyPaymentRow,
} from "../types/Supply/purchaseInvoice";
import { createPurchaseInvoice } from "../api/procurement/PurchaseInvoiceApi";
import { mapUIToCreatePI } from "../types/Supply/purchaseInvoiceMapper";
import { validatePI } from "./piValidator";
import { getPurchaseInvoiceById } from "../api/procurement/PurchaseInvoiceApi";
import { mapApiToUI } from "../types/Supply/purchaseInvoiceMapper";
// import { updatePurchaseInvoice } from "../api/procurement/PurchaseInvoiceApi";
import { getSupplierById } from "../../src/api/procurement/supplierApi";
import { getCompanyById } from "../api/companySetupApi";
import { mapSupplierToAddress } from "../types/Supply/purchaseInvoiceMapper";
import type { AddressBlock } from "../types/Supply/purchaseInvoice";
import { getItemByItemCode } from "../api/itemApi";
import { getPurchaseOrderById, getPurchaseOrders } from "../api/procurement/PurchaseOrderApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

interface UsePurchaseInvoiceFormProps {
  isOpen: boolean;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
  pId?: string | number;
}

export const usePurchaseInvoiceForm = ({
  isOpen,
  onSuccess,
  onClose,
  pId,
}: UsePurchaseInvoiceFormProps) => {
  const [form, setForm] = useState<PurchaseInvoiceFormData>(emptyPOForm);
  const [usePO, setUsePO] = useState(false);
  const [activeTab, setActiveTab] = useState<POTab>("details");
  const [saving, setSaving] = useState(false);
  const [poList, setPoList] = useState<any[]>([]);
  const [customShippingRule, setCustomShippingRule] = useState("");
  const [customIncoterm, setCustomIncoterm] = useState("");
  const [poLoading, setPoLoading] = useState(false);
  const [companyDefaults, setCompanyDefaults] = useState<
    Partial<PurchaseInvoiceFormData>
  >({});


  useEffect(() => {
    if (!isOpen) {
      setForm(emptyPOForm);
      setActiveTab("details");
    }
  }, [isOpen]);

  const isEditMode = !!pId;



  useEffect(() => {
    if (!isOpen || !COMPANY_ID) return;

    const loadCompanyData = async () => {
      try {
        const res = await getCompanyById(COMPANY_ID);

        console.log("RAW COMPANY RESPONSE:", res);

        const company =
          res?.data?.data ||   // if wrapped
          res?.data ||         // if semi wrapped
          res;                 // fallback

        console.log("FINAL COMPANY:", company);

        if (!company?.companyName) {
          console.log("Company not found");
          return;
        }

        const buyingTerms = company.terms?.buying;

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
          terms: { buying: buyingTerms },
          addresses: {
            supplierAddress: emptyPOForm.addresses.supplierAddress,
            dispatchAddress: emptyPOForm.addresses.dispatchAddress,
            shippingAddress: emptyPOForm.addresses.shippingAddress,
            companyBillingAddress,
          },
        });

        setForm((prev) => ({
          ...prev,
          terms: {
            ...prev.terms,
            buying: buyingTerms || prev.terms?.buying,
          },
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
  }, [isOpen, pId]);

  useEffect(() => {
    if (!isOpen || !pId) return;

    const loadPI = async () => {
      const res = await getPurchaseInvoiceById(pId);
      const mapped = mapApiToUI(res.data);
      setForm(mapped);
    };

    loadPI();
  }, [isOpen, pId]);

  // Set default date on create mode
  useEffect(() => {
    if (!isOpen || pId) return;
    const today = new Date().toISOString().split("T")[0];
    setForm((prev) => ({ ...prev, date: today }));
  }, [isOpen, pId]);

  // Calculate totals (Items + Taxes + Rounding)
  useEffect(() => {
    let sub = 0;
    let tax = 0;

    form.items.forEach((item) => {
      const discountAmount =
        item.quantity * item.rate * (Number(item.discount || 0) / 100);

      const totalInclusive = item.quantity * item.rate - discountAmount;

      const exclusive = totalInclusive / (1 + Number(item.vatRate || 0) / 100);

      const taxAmt = totalInclusive - exclusive;

      sub += exclusive;
      tax += taxAmt;
    });

    const grandTotal = sub + tax;

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

  type AddressKey = keyof PurchaseInvoiceFormData["addresses"];

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

  const handlePOSelect = async (po: any) => {
    if (!po?.poId) return;

    try {
      const res = await getPurchaseOrderById(po.poId);

      if (!res || res.status_code !== 200) {
        showApiError({ message: "Failed to fetch PO" });
        return;
      }

      const data = res.data;

      const taxRate = Number(
        (data.tax?.taxRate || "0").replace("%", "")
      );

      // Reset custom fields
      setCustomIncoterm("");
      setCustomShippingRule("");

      // Fetch item descriptions from item master
      const enrichedItems = await Promise.all(
        (data.items || []).map(async (item: any) => {
          let description = "";

          try {
            const itemRes = await getItemByItemCode(item.item_code);
            if (itemRes?.status_code === 200) {
              description = itemRes.data?.description || "";
            }
          } catch { }

          return {
            itemCode: item.item_code,
            itemName: item.item_name,
            quantity: Number(item.qty || 0),
            rate: Number(item.rate || 0),
            uom: item.uom || "",
            vatCd: item.vatCd || "",
            vatRate: taxRate,
            description,
            packingUnit: Number(item.packingUnit || 0),
            packingSize: Number(item.packingSize || 0),
            packing: `${item.packingUnit || 0} x ${item.packingSize || 0}`,
            batchNo: item.batchNo || "",
            mfgDate: item.mfgDate || "",
            expDate: "",
            discount: 0,
          };
        })
      );

      setForm((prev) => ({
        ...prev,

        // BASIC INFO
        poNumber: data.poId,
        supplier: data.supplierName,
        currency: data.currency || "",
        taxCategory: data.taxCategory || "",
        project: data.project || "",
        costCenter: data.costCenter || "",
        incoterm:
          typeof data.incoterm === "string"
            ? data.incoterm.trim().toUpperCase()
            : "",
        placeOfSupply: data.placeOfSupply || "",

        // ADDRESSES
        addresses: {
          ...prev.addresses,
          supplierAddress: data.addresses?.supplierAddress || prev.addresses.supplierAddress,
          dispatchAddress: data.addresses?.dispatchAddress || prev.addresses.dispatchAddress,
          shippingAddress: data.addresses?.shippingAddress || prev.addresses.shippingAddress,
        },

        // TERMS
        terms: {
          buying: data.terms?.terms?.buying || prev.terms?.buying,
        },

        // ITEMS
        items: enrichedItems,

        // // SUMMARY
        // totalQuantity: data.summary?.totalQuantity || 0,
        // grandTotal: data.summary?.grandTotal || 0,
        // roundingAdjustment: data.summary?.roundingAdjustment || 0,
        // roundedTotal: data.summary?.roundedTotal || 0,
      }));

    } catch (e) {
      showApiError({ message: "Failed to load PO details" });
    }
  };
  const handleTogglePO = (checked: boolean) => {
    setUsePO(checked);

    if (!checked) {
      setForm(prev => ({
        ...prev,
        poNumber: "",
        items: [{ ...emptyItem }],
        totalQuantity: 0,
        grandTotal: 0,
        roundingAdjustment: 0,
        roundedTotal: 0,
      }));
    }
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

      // 1. Set supplier details
      setForm((p) => ({
        ...p,
        supplier: supplier.supplierName,
        supplierId: supplier.supplierId,
        supplierCode: supplier.supplierCode,
        supplierEmail: supplier.emailId,
        supplierPhone: supplier.phoneNo,
        taxCategory: supplier.taxCategory || "",
        currency: supplier.currency || p.currency,
        supplierContact: supplier.contactPerson || "",
        destnCountryCd: "",
        placeOfSupply: "",
        addresses: {
          ...p.addresses,
          supplierAddress: mapSupplierToAddress(
            supplier,
            p.addresses.supplierAddress
          ),
        },
      }));
      setPoLoading(true);
      setPoList([]);
      setUsePO(false);

      setForm(prev => ({
        ...prev,
        poNumber: "",
        items: [{ ...emptyItem }],
      }));

      try {
        const poRes = await getPurchaseOrders(1, 100, {
          supplier: supplier.supplierName
        });
        if (poRes?.status_code === 200) {
          setPoList(poRes.data || []);
        } else {
          setPoList([]);
        }

      } catch (err) {
        setPoList([]);
      } finally {
        setPoLoading(false);
      }


    } catch (e) {
      console.error("Supplier detail fetch failed", e);
    }
  };

  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    const { name, value } = e.target;
    const isNum = ["quantity", "rate", "discount", "vatRate"].includes(name);

    const items = [...form.items];

    items[idx] = {
      ...items[idx],
      [name]: isNum ? (value === "" ? "" : Number(value)) : value,
    };

    setForm((p) => ({ ...p, items }));
  };

  const addItem = () => {
    setForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));
  };

  const removeItem = (idx: number) => {
    if (form.items.length === 1) {
      showApiError({
        message: "At least one item is required",
      });

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
      case "ZMW":
        return "K";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "INR":
        return "₹";
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
          uom: data.unitOfMeasureCd || "",
          rate: Number(data.buyingPrice ?? 0),
          vatCd: data.taxInfo?.taxCode ?? "",
          vatRate: Number(data.taxInfo?.taxPerct ?? 0),

          description: data.description || "",

          batchNo: items[idx].batchNo || "",
          mfgDate: items[idx].mfgDate || "",
          expDate: items[idx].expDate || "",
          discount: items[idx].discount || 0,
          packingUnit: Number(data.pakingUnit || 0),
          packingSize: Number(data.packingSize || 0),
          packing: `${data.pakingUnit || 0} x ${data.packingSize || 0}`,
        };

        return { ...prev, items };
      });
    } catch (err) {
      console.error("Failed to fetch item details", err);
      showApiError({
        message: "Failed to load item details",
      });
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

    const errors = validatePI(form);

    if (errors.length) {
      const uniqueErrors = [...new Set(errors)];

      showApiError({
        message: uniqueErrors.join("\n"),
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

      const payload = mapUIToCreatePI(finalForm);

      let res;

      if (isEditMode) {
        showApiError({
          message:
            "Editing Purchase Invoice is not supported. Only status update is allowed.",
        });
        return;
      } else {
        res = await createPurchaseInvoice(payload);

        if (!res || ![200, 201].includes(res.status_code)) {
          showApiError(res);
          return;
        }

        showSuccess("Purchase Invoice Created");
      }

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
        buying:
          companyDefaults.terms?.buying ??
          emptyPOForm.terms?.buying!,
      },
      addresses: {
        supplierAddress:
          emptyPOForm.addresses.supplierAddress,

        dispatchAddress:
          emptyPOForm.addresses.dispatchAddress,

        shippingAddress:
          emptyPOForm.addresses.shippingAddress,

        companyBillingAddress:
          companyDefaults.addresses?.companyBillingAddress ??
          emptyPOForm.addresses.companyBillingAddress,
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
    setForm,
    poList,
    handlePOSelect,
    customShippingRule,
    setCustomShippingRule,
    customIncoterm,
    setCustomIncoterm,
    poLoading,
    setPoLoading,
    usePO,
    handleTogglePO,
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
