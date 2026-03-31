import { useState, useEffect } from "react";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showPOConflictDialog,
  showLoading,
  closeSwal,
} from "../utils/alert";
import type {
  PurchaseInvoiceFormData,
  POTab,
  TaxRow,
  PaymentRow,
  ItemRow,
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
import { useFieldDefault } from "./useFieldDefault";
import { fetchCostCenters, fetchProjects } from "../api/getAllApi";
import { getAllWarehouses } from "../api/WarehouseApi";
import {
  getPurchaseOrderById,
  getPurchaseOrders,
} from "../api/procurement/PurchaseOrderApi";
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
  const [usePO, setUsePO] = useState(true);
  const [activeTab, setActiveTab] = useState<POTab>("details");
  const [saving, setSaving] = useState(false);
  const [poList, setPoList] = useState<any[]>([]);
  const [customShippingRule, setCustomShippingRule] = useState("");
  const [customIncoterm, setCustomIncoterm] = useState("");
  const [poLoading, setPoLoading] = useState(false);
  const [companyDefaults, setCompanyDefaults] = useState<
    Partial<PurchaseInvoiceFormData>
  >({});

  const handleBulkItemChange = (field: keyof ItemRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      warehouse: field === "warehouse" ? value : prev.warehouse,
      items: prev.items.map((item) => ({
        ...item,
        [field]: value,
      })),
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyPOForm);
      setActiveTab("details");
      setUsePO(true);
    }
  }, [isOpen]);

  const isEditMode = !!pId;

  useEffect(() => {
    if (!isOpen || !COMPANY_ID) return;

    const loadCompanyData = async () => {
      try {
        const res = await getCompanyById(COMPANY_ID);


        const company =
          res?.data?.data || // if wrapped
          res?.data || // if semi wrapped
          res; // fallback



        if (!company?.companyName) {

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
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const discount = Number(item.discount || 0);
      const vatRate = Number(item.vatRate || 0);

      const lineAmount = qty * rate;

      const discountAmount = lineAmount * (discount / 100);

      const netAmount = lineAmount - discountAmount;

      const taxAmount = netAmount * (vatRate / 100);

      sub += lineAmount;
      tax += taxAmount;
    });

    const grandTotal = sub + tax;

    const totalQuantity = form.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    setForm((p) => ({
      ...p,
      totalQuantity,
      subTotal: sub,
      totalTax: tax,
      grandTotal,
    }));
  }, [form.items]);


  useFieldDefault(
  isOpen,
  form.costCenter,
  fetchCostCenters,
  (val) => setForm((prev) => ({ ...prev, costCenter: val }))
);

useFieldDefault(
  isOpen,
  form.project,
  fetchProjects,
  (val) => setForm((prev) => ({ ...prev, project: val }))
);

useFieldDefault(
  isOpen,
  form.warehouse,
  () => getAllWarehouses().then((list: string[]) =>
    list.map((w) => ({ value: w, label: w }))
  ),
  (val) => setForm((prev) => ({ ...prev, warehouse: val }))
);

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

  const validateTab = (tab: POTab): string | null => {
    if (tab === "details") {
      if (!form.supplier) return "Supplier is required";

      if (usePO && !form.poNumber)
        return "Purchase Order is required";

      if (form.supplier && !form.supplierInvoiceNumber?.trim())
        return "Supplier Invoice No is required";

      if (!form.transactionProgress) return "Transaction Progress is required";

      if (!form.paymentType) return "Payment Type is required";

      if (!form.items.length) return "At least one item required";

      for (let i = 0; i < form.items.length; i++) {
        const item = form.items[i];

        if (!item.itemCode) return `Row ${i + 1}: Item required`;

        if (!item.quantity || item.quantity <= 0)
          return `Row ${i + 1}: Quantity required`;

        if (!item.rate || item.rate <= 0)
          return `Row ${i + 1}: Unit Price required`;

        if (!item.vatCd) return `Row ${i + 1}: Tax Code required`;

        if (item.requiresBatch && !item.batchNo?.trim())
          return `Row ${i + 1}: Batch No required`;
      }
    }
    if (tab === "address") {
      const addr = form.addresses?.supplierAddress;

      if (!addr?.addressLine1?.trim()) return "Address Line 1 is required";

      if (!addr?.city?.trim()) return "City is required";

      if (!addr?.country?.trim()) return "Country is required";
    }

    return null;
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

      const taxRate = Number(data.tax?.taxRate || 0);

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
            warehouse: form.updateStock ? item.warehouse || "" : "",
            packingUnit: Number(item.packingUnit || 0),
            packingSize: Number(item.packingSize || 0),
            packing: `${item.packingUnit || 0} x ${item.packingSize || 0}`,
            batchNo: item.batchNo || "",
            mfgDate: item.mfgDate || "",
            expDate: "",
            requiresBatch: Boolean(item.has_batch_no),
            discount: 0,
          };
        }),
      );

      const hasExistingItems =
        form.items &&
        form.items.length > 0 &&
        form.items.some((i) => i.itemCode);

      let finalItems = enrichedItems;

      if (hasExistingItems) {
        const action = await showPOConflictDialog(
          form.items.length,
          data.poId
        );

        if (action === "cancel") return;

        if (action === "keep") {
          const existingCodes = new Set(
            form.items.map((i) => i.itemCode)
          );

          const newItems = enrichedItems.filter(
            (item) => !existingCodes.has(item.itemCode)
          );

          finalItems = [...form.items, ...newItems];
        }

        if (action === "replace") {
          finalItems = enrichedItems;
        }
      }

      setForm((prev) => ({
        ...prev,

        poNumber: data.poId,
        supplier: data.supplierName,
        currency: data.currency || "",
        taxCategory: data.taxCategory || "",
        project: data.project || "",
        costCenter: data.costCenter || "",
        shippingRule: data.shippingRule || "",
        incoterm:
          typeof data.incoterm === "string"
            ? data.incoterm.trim().toUpperCase()
            : "",
        placeOfSupply: data.placeOfSupply || "",

        // ADDRESSES
        addresses: {
          ...prev.addresses,
          supplierAddress:
            data.addresses?.supplierAddress || prev.addresses.supplierAddress,
          dispatchAddress:
            data.addresses?.dispatchAddress || prev.addresses.dispatchAddress,
          shippingAddress:
            data.addresses?.shippingAddress || prev.addresses.shippingAddress,
        },

        // TERMS
        terms: {
          buying: data.terms?.terms?.buying || prev.terms?.buying,
        },

        // ITEMS
        items: finalItems,
        advanceAmount:
          (data.advances_payments || []).reduce(
            (sum: number, p: any) => sum + Number(p.allocated_amount || 0),
            0
          ),

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
      setForm((prev) => ({
        ...prev,
        poNumber: "",
       // items: [{ ...emptyItem }],
      }));
    }
  };
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target as HTMLInputElement;

    const { name, value, type } = target;
    const checked = target.checked;

    const finalValue = type === "checkbox" ? checked : value;

    if (name === "updateStock") {
      setForm((prev) => ({
        ...prev,
        updateStock: checked,
        warehouse: checked ? prev.warehouse : "",
        items: prev.items.map((item) => ({
          ...item,
          warehouse: checked ? item.warehouse : "",
        })),
      }));

      return;
    }

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

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
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
            p.addresses.supplierAddress,
          ),
        },
      }));
      setPoLoading(true);
      setPoList([]);
      setUsePO(true);

      setForm((prev) => ({
        ...prev,
        poNumber: "",
        items:
          prev.items && prev.items.length > 0 ? prev.items : [{ ...emptyItem }],
      }));

      try {
        const poRes = await getPurchaseOrders(1, 100, {
          supplier: supplier.supplierName,
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
    setForm((p) => ({
      ...p,
      items: [
        ...p.items,
        {
          ...emptyItem,
          warehouse: p.updateStock ? (p.warehouse ?? "") : "",
        },
      ],
    }));
  };
  const removeItem = (idx: number) => {
    if (form.items.length === 1) {
      showValidationError("At least one item is required");
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
          warehouse: prev.updateStock
            ? items[idx].warehouse || data.warehouse || prev.warehouse || ""
            : "",

          description: data.description || "",

          batchNo: items[idx].batchNo || "",
          mfgDate: items[idx].mfgDate || "",
          expDate: items[idx].expDate || "",
          requiresBatch: Boolean(data.batchInfo?.has_batch_no),
          discount: items[idx].discount || 0,
          packingUnit: Number(data.packingUnit || 0),
          packingSize: Number(data.packingSize || 0),
          packing: `${data.packingUnit || 0} x ${data.packingSize || 0}`,
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

    if (saving) return;
    if (!form.taxCategory) {
      showValidationError("Tax Category is required");
      return;
    }

    const errors = validatePI(form);

    if (errors.length) {
      const uniqueErrors = [...new Set(errors)];
      showValidationError(uniqueErrors.join("\n"));
      return;
    }

    try {
      setSaving(true);


      showLoading(
        isEditMode
          ? "Updating Purchase Invoice..."
          : "Saving Purchase Invoice..."
      );

      const finalForm = {
        ...form,
        shippingRule:
          form.shippingRule === "OTHER"
            ? customShippingRule
            : form.shippingRule,
        incoterm:
          form.incoterm === "OTHER" ? customIncoterm : form.incoterm,
      };

      const payload = mapUIToCreatePI(finalForm);

      let res;

      if (isEditMode) {
        res = await updatePurchaseInvoice(pId, payload);
      } else {
        res = await createPurchaseInvoice(payload);
      }


      closeSwal();

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      showSuccess(
        isEditMode
          ? "Purchase Invoice Updated"
          : "Purchase Invoice Created"
      );

      onSuccess?.(res);
      onClose?.();
      reset();

    } catch (error: any) {
      closeSwal();
      showApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setUsePO(true);
    setForm({
      ...emptyPOForm,

      terms: {
        buying: companyDefaults.terms?.buying ?? emptyPOForm.terms?.buying!,
      },
      addresses: {
        supplierAddress: emptyPOForm.addresses.supplierAddress,

        dispatchAddress: emptyPOForm.addresses.dispatchAddress,

        shippingAddress: emptyPOForm.addresses.shippingAddress,

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
    validateTab,
    usePO,
    handleTogglePO,
    handleBulkItemChange,
    saving
  };
};
