import { useState, useEffect ,useRef} from "react";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showLoading,
  closeSwal,
} from "../utils/alert";
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
  ItemRow,
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
import { useFieldDefault } from "./useFieldDefault";
import { fetchCostCenters, fetchProjects } from "../api/getAllApi";
import { getAllWarehouses } from "../api/WarehouseApi";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

interface UsePurchaseOrderFormProps {
  isOpen: boolean;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
  poId?: string | number;
  duplicateItem?: ItemRow;
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
  const [addressSelected, setAddressSelected] = useState<Record<string, any>>({
    companyBilling: null,
    supplierBilling: null,
    companyShipping: null,
    supplierDispatch: null,
  });
  const [addressSelectedIds, setAddressSelectedIds] = useState<
    Record<string, string>
  >({
    companyBilling: "",
    supplierBilling: "",
    companyShipping: "",
    supplierDispatch: "",
  });
  const [addressList, setAddressList] = useState<Record<string, any[]>>({
    companyBilling: [],
    supplierBilling: [],
    companyShipping: [],
    supplierDispatch: [],
  });
  const [addressLoading, setAddressLoading] = useState<Record<string, boolean>>(
    {
      companyBilling: false,
      supplierBilling: false,
      companyShipping: false,
      supplierDispatch: false,
    },
  );
  const [companyDefaults, setCompanyDefaults] = useState<{
    buyingTerms?: any;
    companyBillingAddress?: any;
    baseCurrency?: string;
  }>({});

  const handleBulkItemChange = (field: keyof ItemRow, value: string) => {
    setForm((prev) => ({
      ...prev,
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
    }
  }, [isOpen]);

  const isEditMode = !!poId;

  useEffect(() => {
    if (!isOpen || !COMPANY_ID) return;

    const loadCompanyData = async () => {
      try {
        const res = await getCompanyById(COMPANY_ID);

        const company =
          res?.data?.data || // if wrapped
          res?.data || // if semi wrapped
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

  useEffect(() => {
    if (!form.requiredBy) return;

    setForm((prev) => {
      const updatedItems = prev.items.map((item) =>
        item.requiredBy ? item : { ...item, requiredBy: prev.requiredBy },
      );

      return { ...prev, items: updatedItems };
    });
  }, [form.requiredBy]);

  // Load PO Data in Edit Mode
const hasLoadedRef = useRef(false);

useEffect(() => {
  if (!isOpen || !poId || hasLoadedRef.current) return;

  const loadPO = async () => {
    const apiData = await getPurchaseOrderById(poId);
    const mapped = mapApiToUI(apiData);

    setForm(mapped);

   
    setAddressSelectedIds({
      supplierBilling: mapped.addresses.supplierAddress.id || "",
      supplierDispatch: mapped.addresses.dispatchAddress.id || "",
      companyBilling: mapped.addresses.companyBillingAddress.id || "",
      companyShipping: mapped.addresses.shippingAddress.id || "",
    });

  
    setAddressSelected({
      supplierBilling: mapped.addresses.supplierAddress.id
        ? {
            id: mapped.addresses.supplierAddress.id,
            title: mapped.addresses.supplierAddress.addressTitle || "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            email: "",
            phone: "",
            addressType: "Billing",
            type: "Billing",
          }
        : null,

      supplierDispatch: mapped.addresses.dispatchAddress.id
        ? {
            id: mapped.addresses.dispatchAddress.id,
            title: "Dispatch",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            email: "",
            phone: "",
            addressType: "Dispatch",
            type: "Dispatch",
          }
        : null,

      companyBilling: mapped.addresses.companyBillingAddress.id
        ? {
            id: mapped.addresses.companyBillingAddress.id,
            title: "Company Billing",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            email: "",
            phone: "",
            addressType: "Billing",
            type: "Billing",
          }
        : null,

      companyShipping: mapped.addresses.shippingAddress.id
        ? {
            id: mapped.addresses.shippingAddress.id,
            title: "Shipping",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            email: "",
            phone: "",
            addressType: "Shipping",
            type: "Shipping",
          }
        : null,
    });

    hasLoadedRef.current = true;
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
    let subTotal = 0;
    let totalTax = 0;

    form.items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const vatRate = Number(item.vatRate || 0);

      const lineAmount = qty * rate;
      const taxAmount = (lineAmount * vatRate) / 100;

      subTotal += lineAmount;
      totalTax += taxAmount;
    });

    const taxRowTotal = form.taxRows.reduce((sum, t) => {
      const amount = Number(t.amount || 0);
      const rate = Number(t.taxRate || 0);
      return sum + (amount * rate) / 100;
    }, 0);

    totalTax += taxRowTotal;

    const grandTotal = subTotal + totalTax;

    const totalQuantity = form.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    setForm((prev) => ({
      ...prev,
      totalQuantity,
      subTotal,
      totalTax,
      grandTotal,
    }));
  }, [form.items, form.taxRows]);

  useFieldDefault(isOpen, form.costCenter, fetchCostCenters, (val) =>
    setForm((prev) => ({ ...prev, costCenter: val })),
  );

  useFieldDefault(isOpen, form.project, fetchProjects, (val) =>
    setForm((prev) => ({ ...prev, project: val })),
  );

  useFieldDefault(
    isOpen,
    form.warehouse,
    () =>
      getAllWarehouses().then((list: string[]) =>
        list.map((w) => ({ value: w, label: w })),
      ),
    (val) =>
      setForm((prev) => ({
        ...prev,
        warehouse: val,
        items: prev.items.map((item) => ({
          ...item,
          warehouse: item.warehouse?.trim() ? item.warehouse : val,
        })),
      })),
  );

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
  e:
    | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    | { target: { name: string; value: any } }
) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};
  const handleSupplierChange = async (sup: any) => {
    if (!sup?.id) return;

    try {
      const res = await getSupplierById(sup.id);

      const supplier = res?.message?.data;

      if (!supplier) return;

      console.log("FULL SUPPLIER:", supplier);

      const primaryContact =
        supplier.contacts?.find((c: any) => c.isPrimary) ||
        supplier.contacts?.[0];

      const cleanPhone = (phone: string) =>
        phone?.replace(/\+\d+\+/, "+") || "";
      const primaryAddress =
        supplier.addresses?.find((a: any) => a.isPrimary) ||
        supplier.addresses?.[0];

      setForm((prev) => ({
        ...prev,

        supplier: supplier.name,
        supplierId: supplier.id,
        supplierCode: supplier.id,

        supplierEmail: primaryContact?.email || "",
        supplierPhone: cleanPhone(
          primaryContact?.mobile || primaryContact?.phone,
        ),
        supplierContact: primaryContact?.fullName || "",

        currency: supplier.currency || prev.currency,
        taxCategory: supplier.supplierTaxCategory || "",
        addresses: {
          ...prev.addresses,

          supplierAddress: {
            ...prev.addresses.supplierAddress,

            addressLine1: primaryAddress?.line1 || "",
            addressLine2: primaryAddress?.line2 || "",
            city: primaryAddress?.city || "",
            state: primaryAddress?.state || "",
            country: primaryAddress?.country || "",
            postalCode: primaryAddress?.postalCode || "",
          },

          // OPTIONAL: auto copy to shipping also
          shippingAddress: {
            ...prev.addresses.shippingAddress,

            addressLine1: primaryAddress?.line1 || "",
            addressLine2: primaryAddress?.line2 || "",
            city: primaryAddress?.city || "",
            state: primaryAddress?.state || "",
            country: primaryAddress?.country || "",
            postalCode: primaryAddress?.postalCode || "",
          },
        },
      }));
    } catch (err) {
      console.error("Supplier fetch failed:", err);
    }
  };
  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
          warehouse: p.warehouse ?? "",
          requiredBy: p.requiredBy || "",
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

  const duplicateItem = (absoluteIndex: number) => {
    setForm((prev) => {
      const source = prev.items[absoluteIndex];
      if (!source) return prev;

      const copy = { ...source };
      const newItems = [...prev.items];
      newItems.splice(absoluteIndex + 1, 0, copy);

      return { ...prev, items: newItems };
    });
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
      case "INR":
        return "₹";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "ZMW":
        return "K";
      default:
        return "";
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
        if (!item.rate || item.rate <= 0) return `Row ${i + 1}: Rate required`;
        if (!item.warehouse) return `Row ${i + 1}: Warehouse required`;

        if (!item.vatCd || !item.vatCd.trim())
          return `Row ${i + 1}: Tax Code required`;
      }
    }

    if (tab === "address") {
      const supplier = form.addresses?.supplierAddress;

      if (!supplier?.addressLine1?.trim())
        return "Supplier Address Line 1 is required";
    }

    return null;
  };

  const handleItemSelect = async (itemId: string, idx: number) => {
    try {
      const res = await getItemByItemCode(itemId, form.taxCategory);
      if (!res || res.status_code !== 200) return;

      const data = res.data;

      const supplierTaxCategory = form.taxCategory;

      const matchedTax = data.taxInfo?.find(
        (t: any) => t.taxCategory === supplierTaxCategory,
      );

      const selectedTax = matchedTax || data.taxInfo?.[0];

      const totalTaxRate = Number(selectedTax?.totalTaxRate || 0);
      setForm((prev) => {
        const items = [...prev.items];

        items[idx] = {
          ...items[idx],

          itemCode: data.id,
          itemName: data.itemName,
          description: data.description,

          warehouse: items[idx].warehouse ?? prev.warehouse ?? "",

          rate: Number(data.buyingPrice ?? 0),
          uom: data.unitOfMeasureCd,

          vatRate: totalTaxRate,

          vatCd: selectedTax?.taxName || "",

          requiredBy: items[idx].requiredBy ?? prev.requiredBy ?? "",

          packingUnit: Number(data.packingUnit || 0),
          packingSize: Number(data.packingSize || 0),
          packing: `(${data.packingUnit || 0}) x (${data.packingSize || 0})`,
        };

        return { ...prev, items };
      });
    } catch (err) {
      console.error("Failed to fetch item details", err);
    }
  };
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (saving) return;

    if (!form.taxCategory) {
      showValidationError("Tax Category is required");
      return;
    }

    const errors = validatePO(form);

    if (errors.length) {
      showValidationError([...new Set(errors)].join("\n"));
      return;
    }

    try {
      setSaving(true);

      showLoading(
        isEditMode ? "Updating Purchase Order..." : "Saving Purchase Order...",
      );

      const finalForm = {
        ...form,
        shippingRule:
          form.shippingRule === "OTHER"
            ? customShippingRule
            : form.shippingRule,
        incoterm: form.incoterm === "OTHER" ? customIncoterm : form.incoterm,
      };

      const payload = mapUIToCreatePO(finalForm);

      let res;

      if (isEditMode) {
        res = await updatePurchaseOrder(poId, payload);
      } else {
        res = await createPurchaseOrder(payload);
      }

      closeSwal();

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      showSuccess(
        isEditMode ? "Purchase Order Updated" : "Purchase Order Created",
      );

      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.PURCHASE_ORDER_LIST);
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
    setForm({
      ...emptyPOForm,

      terms: {
        ...(emptyPOForm.terms ?? {}),
        buying: companyDefaults.buyingTerms ?? emptyPOForm.terms?.buying,
      },

      currency: companyDefaults.baseCurrency ?? emptyPOForm.currency,

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
    duplicateItem,
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
    handleBulkItemChange,
    saving,
    addressSelected,
    setAddressSelected,
    addressSelectedIds,
    setAddressSelectedIds,
    addressList,
    setAddressList,
    addressLoading,
    setAddressLoading,
  };
};
