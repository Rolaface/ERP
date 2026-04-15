import { useState, useEffect, useRef } from "react";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showPOConflictDialog,
  showLoading,
  closeSwal,
} from "../utils/alert";
import type { ApiAddress, BoxType } from "../hooks/useAddressLogic";
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
import {
  createPurchaseInvoice,
  getPurchaseInvoiceById,
  
} from "../api/procurement/PurchaseInvoiceApi";
import { mapUIToCreatePI, mapApiToUI, mapSupplierToAddress } from "../types/Supply/purchaseInvoiceMapper";
import { validatePI } from "./piValidator";
import { getSupplierById } from "../../src/api/procurement/supplierApi";
import { getCompanyById } from "../api/companySetupApi";
import type { AddressBlock } from "../types/Supply/purchaseInvoice";
import { getItemByItemCode } from "../api/itemApi";
import { useFieldDefault } from "./useFieldDefault";
import { fetchCostCenters, fetchProjects } from "../api/getAllApi";
import { getAllWarehouses } from "../api/WarehouseApi";
import { getPurchaseOrderById } from "../api/procurement/PurchaseOrderApi";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface UsePurchaseInvoiceFormProps {
  isOpen: boolean;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
  pId?: string | number;
}

type AddressKey = keyof PurchaseInvoiceFormData["addresses"];

/** Builds a minimal stub for the address selector state when loading saved IDs */
const addressStub = (id: string, type: string) =>
  id
    ? {
        id,
        title: id,
        type:type,
        addressType: type,
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        phone: "",
        email: "",
      }
    : null;

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

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

  // Address selector state — mirrors PO hook exactly
  const [selected, setSelected] = useState<Record<BoxType, ApiAddress | null>>({
    companyBilling: null,
    supplierBilling: null,
    companyShipping: null,
    supplierDispatch: null,
  });
  const [selectedIds, setSelectedIds] = useState<Record<BoxType, string>>({
    companyBilling: "",
    supplierBilling: "",
    companyShipping: "",
    supplierDispatch: "",
  });


  useEffect(() => {
  setForm(prev => ({
    ...prev,
    addresses: {
      ...prev.addresses,
      companyBillingAddress: {
        ...prev.addresses.companyBillingAddress,
        id: selectedIds.companyBilling,
      },
      shippingAddress: {
        ...prev.addresses.shippingAddress,
        id: selectedIds.companyShipping,
      },
      supplierAddress: {
        ...prev.addresses.supplierAddress,
        id: selectedIds.supplierBilling,
      },
      dispatchAddress: {
        ...prev.addresses.dispatchAddress,
        id: selectedIds.supplierDispatch,
      },
    }
  }));
  console.log("[PI] selectedIds sync:", selectedIds);
}, [selectedIds]);

  
  const [addresses, setAddresses] = useState<Record<BoxType, ApiAddress[]>>({
    companyBilling: [],
    supplierBilling: [],
    companyShipping: [],
    supplierDispatch: [],
  });
  const [loading, setLoading] = useState<Record<BoxType, boolean>>({
    companyBilling: false,
    supplierBilling: false,
    companyShipping: false,
    supplierDispatch: false,
  });

  const hasLoadedRef = useRef(false);
  const isEditMode = !!pId;

  
  // ── Reset on close ─────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setForm(emptyPOForm);
      setActiveTab("details");
      setUsePO(true);
      hasLoadedRef.current = false;
    }
  }, [isOpen]);

  // ── Load company defaults ──────────────────
  useEffect(() => {
    if (!isOpen || !COMPANY_ID) return;

    const loadCompanyData = async () => {
      try {
        const res = await getCompanyById(COMPANY_ID);
        const company = res?.data?.data || res?.data || res;

        if (!company?.companyName) return;

        const buyingTerms = company.terms?.buying;

        const companyBillingAddress: AddressBlock = {
          id: company.address?.id || "",
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
          terms: { ...prev.terms, buying: buyingTerms || prev.terms?.buying },
          addresses: { ...prev.addresses, companyBillingAddress },
        }));
      } catch (e) {
        console.error("Failed to load company data", e);
      }
    };

    loadCompanyData();
  }, [isOpen, pId]);

  // ── Load PI in edit mode ───────────────────
  useEffect(() => {
    if (!isOpen || !pId || hasLoadedRef.current) return;

    const loadPI = async () => {
      try {
        const res = await getPurchaseInvoiceById(pId);
        const mapped = mapApiToUI(res.data);
        setForm(mapped);

        // Sync address selector state — same pattern as PO hook
        setSelected({
          supplierBilling: addressStub(
            mapped.addresses.supplierAddress.id,
            "Billing",
          ),
          supplierDispatch: addressStub(
            mapped.addresses.dispatchAddress.id,
            "Dispatch",
          ),
          companyBilling: addressStub(
            mapped.addresses.companyBillingAddress.id,
            "Billing",
          ),
          companyShipping: addressStub(
            mapped.addresses.shippingAddress.id,
            "Shipping",
          ),
        });

        setSelectedIds({
          supplierBilling: mapped.addresses.supplierAddress.id || "",
          supplierDispatch: mapped.addresses.dispatchAddress.id || "",
          companyBilling: mapped.addresses.companyBillingAddress.id || "",
          companyShipping: mapped.addresses.shippingAddress.id || "",
        });

        hasLoadedRef.current = true;
      } catch (e) {
        console.error("Failed to load PI", e);
        showApiError({ message: "Failed to load Purchase Invoice" });
      }
    };

    loadPI();
  }, [isOpen, pId]);

  // ── Default date on create ─────────────────
  useEffect(() => {
    if (!isOpen || pId) return;
    const today = new Date().toISOString().split("T")[0];
    setForm((prev) => ({ ...prev, date: today }));
  }, [isOpen, pId]);

  // ── Totals (derived from items) ────────────
  useEffect(() => {
    let subTotal = 0;
    let totalTax = 0;

    form.items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const discount = Number(item.discount || 0);
      const vatRate = Number(item.vatRate || 0);

      const lineAmount = qty * rate;
      const netAmount = lineAmount - lineAmount * (discount / 100);
      subTotal += lineAmount;
      totalTax += netAmount * (vatRate / 100);
    });

    const grandTotal = subTotal + totalTax;
    const totalQuantity = form.items.reduce(
      (s, i) => s + Number(i.quantity || 0),
      0,
    );

    setForm((p) => ({ ...p, totalQuantity, subTotal, totalTax, grandTotal }));
  }, [form.items]);

  // ── Field defaults ─────────────────────────
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
    (val) => setForm((prev) => ({ ...prev, warehouse: val })),
  );

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const updateAddress = (
    key: AddressKey,
    field: keyof AddressBlock,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      addresses: {
        ...prev.addresses,
        [key]: { ...prev.addresses[key], [field]: value },
      },
    }));
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const finalValue = type === "checkbox" ? target.checked : value;

    if (name === "updateStock") {
      setForm((prev) => ({
        ...prev,
        updateStock: target.checked,
        warehouse: target.checked ? prev.warehouse : "",
        items: prev.items.map((item) => ({
          ...item,
          warehouse: target.checked ? item.warehouse : "",
        })),
      }));
      return;
    }

    if (name.startsWith("addresses.") && typeof value === "object" && value !== null) {
      const addressKey = name.replace("addresses.", "") as AddressKey;
      setForm((prev) => ({
        ...prev,
        addresses: {
          ...prev.addresses,
          [addressKey]: { ...prev.addresses[addressKey], ...(value as Record<string, any>) },
        },
      }));
      return;
    }

    if (name.startsWith("addresses.")) {
      const [, key, field] = name.split(".") as [
        "addresses",
        AddressKey,
        keyof AddressBlock,
      ];
      updateAddress(key, field, value);
      return;
    }

    setForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleBulkItemChange = (field: keyof ItemRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      warehouse: field === "warehouse" ? value : prev.warehouse,
      items: prev.items.map((item) => ({ ...item, [field]: value })),
    }));
  };

  // ── Supplier ───────────────────────────────
  const handleSupplierChange = async (sup: any) => {
    if (!sup) return;

    try {
      const res = await getSupplierById(sup.id || sup.value);
      const supplier =
        res?.message?.data ||
        res?.data?.message?.data ||
        res?.data?.data ||
        res?.data;

      if (!supplier) return;

      const primaryContact =
        supplier.contacts?.find((c: any) => c.isPrimary) ||
        supplier.contacts?.[0];

      const buyingTerms = supplier.terms?.Buying || supplier.terms?.buying;

      setForm((prev) => {
        const updatedSupplierAddress = mapSupplierToAddress(
          supplier,
          prev.addresses.supplierAddress,
        );
        return {
          ...prev,
          supplier: supplier.name || "",
          supplierId: supplier.id || "",
          supplierCode: supplier.id || "",
          supplierEmail: primaryContact?.email || "",
          supplierPhone: primaryContact?.mobile || primaryContact?.phone || "",
          supplierContact: primaryContact?.id || "",
          taxCategory: supplier.supplierTaxCategory || prev.taxCategory,
          currency: supplier.currency || prev.currency,
          terms: buyingTerms ? { buying: buyingTerms } : prev.terms,
          addresses: {
            ...prev.addresses,
            supplierAddress: updatedSupplierAddress,
          },
        };
      });

      // Sync selectedIds when supplier address is loaded
      const supplierPrimaryAddress =
        supplier.addresses?.find((a: any) => a.isPrimary) ||
        supplier.addresses?.[0];
      if (supplierPrimaryAddress?.id) {
        setSelectedIds((prev) => ({
          ...prev,
          supplierBilling: supplierPrimaryAddress.id,
        }));
      }
    } catch (e) {
      console.error("Supplier fetch failed", e);
      showApiError({ message: "Failed to load supplier details" });
    }
  };

  // ── PO select ──────────────────────────────
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

      setCustomIncoterm("");
      setCustomShippingRule("");

      const enrichedItems = await Promise.all(
        (data.items || []).map(async (item: any) => {
          let description = "";
          try {
            const itemRes = await getItemByItemCode(item.item_code);
            if (itemRes?.status_code === 200) {
              description = itemRes.data?.description || "";
            }
          } catch {}

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

      const hasExistingItems = form.items.some((i) => i.itemCode);
      let finalItems = enrichedItems;

      if (hasExistingItems) {
        const action = await showPOConflictDialog(form.items.length, data.poId);
        if (action === "cancel") return;

        if (action === "keep") {
          const existingCodes = new Set(form.items.map((i) => i.itemCode));
          finalItems = [
            ...form.items,
            ...enrichedItems.filter((i) => !existingCodes.has(i.itemCode)),
          ];
        }
        // action === "replace" → finalItems stays as enrichedItems
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
        terms: {
          buying: data.terms?.terms?.buying || prev.terms?.buying,
        },
        addresses: {
          ...prev.addresses,
          // Resolve IDs from flat root keys (same as how PO stores them)
          supplierAddress: {
            ...prev.addresses.supplierAddress,
            ...(data.addresses?.supplierAddress || {}),
            id:
              data.supplier_address ||
              data.addresses?.supplierAddress?.id ||
              prev.addresses.supplierAddress.id ||
              "",
          },
          shippingAddress: {
            ...prev.addresses.shippingAddress,
            ...(data.addresses?.shippingAddress || {}),
            id:
              data.shipping_address ||
              data.addresses?.shippingAddress?.id ||
              prev.addresses.shippingAddress.id ||
              "",
          },
          dispatchAddress: {
            ...prev.addresses.dispatchAddress,
            ...(data.addresses?.dispatchAddress || {}),
            id:
              data.dispatch_address ||
              data.addresses?.dispatchAddress?.id ||
              prev.addresses.dispatchAddress.id ||
              "",
          },
        },
        items: finalItems,
        advanceAmount: (data.advances_payments || []).reduce(
          (sum: number, p: any) => sum + Number(p.allocated_amount || 0),
          0,
        ),
      }));

      // Sync selectedIds when addresses are loaded from PO
      setSelectedIds((prev) => ({
        ...prev,
        supplierBilling: data.supplier_address || prev.supplierBilling,
        companyShipping: data.shipping_address || prev.companyShipping,
        supplierDispatch: data.dispatch_address || prev.supplierDispatch,
      }));
    } catch (e) {
      showApiError({ message: "Failed to load PO details" });
    }
  };

  const handleTogglePO = (checked: boolean) => {
    setUsePO(checked);
    if (!checked) setForm((prev) => ({ ...prev, poNumber: "" }));
  };

  // ── Items ──────────────────────────────────
  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    const { name, value } = e.target;
    const isNum = ["quantity", "rate", "discount", "vatRate"].includes(name);

    setForm((p) => {
      const items = p.items.map((item, i) =>
        i !== idx
          ? item
          : {
              ...item,
              [name]: isNum ? (value === "" ? "" : Number(value)) : value,
            },
      );
      return { ...p, items };
    });
  };

  const addItem = () => {
    setForm((p) => ({
      ...p,
      items: [
        ...p.items,
        { ...emptyItem, warehouse: p.updateStock ? (p.warehouse ?? "") : "" },
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
      const newItems = [...prev.items];
      newItems.splice(absoluteIndex + 1, 0, { ...source });
      return { ...prev, items: newItems };
    });
  };

  const handleItemSelect = async (itemId: string, idx: number) => {
    try {
      const res = await getItemByItemCode(itemId, form.taxCategory);
      if (!res || res.status_code !== 200) return;

      const data = res.data;
      const supplierTaxCategory = form.taxCategory?.trim();

      let selectedTax = data.taxInfo?.find(
        (t: any) =>
          t.taxCategory?.toLowerCase() === supplierTaxCategory?.toLowerCase(),
      );
      if (!selectedTax && data.taxInfo?.length) selectedTax = data.taxInfo[0];

      setForm((prev) => {
        const items = [...prev.items];
        items[idx] = {
          ...items[idx],
          itemCode: data.id,
          itemName: data.itemName,
          description: data.description,
          rate: Number(data.buyingPrice || 0),
          uom: data.unitOfMeasureCd,
          vatRate: Number(selectedTax?.totalTaxRate || 0),
          vatCd: selectedTax?.taxName || "",
          packingUnit: Number(data.packingUnit || 0),
          packingSize: Number(data.packingSize || 0),
          packing: `(${data.packingUnit || 0}) x (${data.packingSize || 0})`,
          warehouse: items[idx].warehouse || prev.warehouse || "",
        };
        return { ...prev, items };
      });
    } catch (err) {
      console.error("Failed to fetch item details", err);
    }
  };

  // ── Tax rows ───────────────────────────────
  const handleTaxRowChange = (idx: number, key: keyof TaxRow, value: any) => {
    setForm((p) => {
      const taxRows = p.taxRows.map((row, i) =>
        i !== idx ? row : { ...row, [key]: value },
      );
      return { ...p, taxRows };
    });
  };
  const addTaxRow = () =>
    setForm((p) => ({ ...p, taxRows: [...p.taxRows, { ...emptyTaxRow }] }));
  const removeTaxRow = (idx: number) =>
    setForm((p) => ({
      ...p,
      taxRows: p.taxRows.filter((_, i) => i !== idx),
    }));

  // ── Payment rows ───────────────────────────
  const handlePaymentRowChange = (
    idx: number,
    key: keyof PaymentRow,
    value: any,
  ) => {
    setForm((p) => {
      const paymentRows = p.paymentRows.map((row, i) =>
        i !== idx ? row : { ...row, [key]: value },
      );
      return { ...p, paymentRows };
    });
  };
  const addPaymentRow = () =>
    setForm((p) => ({
      ...p,
      paymentRows: [...p.paymentRows, { ...emptyPaymentRow }],
    }));
  const removePaymentRow = (idx: number) => {
    if (form.paymentRows.length === 1) return;
    setForm((p) => ({
      ...p,
      paymentRows: p.paymentRows.filter((_, i) => i !== idx),
    }));
  };

  // ── Email template ─────────────────────────
  const handleSaveTemplate = (html: string) =>
    setForm((p) => ({ ...p, messageHtml: html }));

  const resetTemplate = () =>
    setForm((p) => ({
      ...p,
      templateName: "",
      templateType: "",
      subject: "",
      messageHtml: "",
      sendAttachedFiles: false,
      sendPrint: false,
    }));

  // ── Currency symbol ────────────────────────
  const getCurrencySymbol = () => {
    const map: Record<string, string> = {
      ZMW: "K",
      USD: "$",
      EUR: "€",
      INR: "₹",
    };
    return map[form.currency] ?? "";
  };

  // ── Tab validation ─────────────────────────
  const validateTab = (tab: POTab): string | null => {
    if (tab === "details") {
      if (!form.supplier) return "Supplier is required";
      if (usePO && !form.poNumber) return "Purchase Order is required";
      if (!form.supplierInvoiceNumber?.trim())
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
      if (!addr?.id?.trim()) return "Supplier Address is required";
      if (!addr?.addressLine1?.trim()) return "Address Line 1 is required";
      if (!addr?.city?.trim()) return "City is required";
      if (!addr?.country?.trim()) return "Country is required";
    }

    return null;
  };

  // ── Submit ─────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;

    if (!form.taxCategory) {
      showValidationError("Tax Category is required");
      return;
    }

    const errors = validatePI(form);
    if (errors.length) {
      showValidationError([...new Set(errors)].join("\n"));
      return;
    }

    try {
      setSaving(true);
      showLoading(
        isEditMode
          ? "Updating Purchase Invoice..."
          : "Saving Purchase Invoice...",
      );

      const finalForm = {
        ...form,
        shippingRule:
          form.shippingRule === "OTHER"
            ? customShippingRule
            : form.shippingRule,
        incoterm: form.incoterm === "OTHER" ? customIncoterm : form.incoterm,
      };

      console.log("[PI] Submit - form.addresses:", finalForm.addresses);
      console.log("[PI] Submit - selectedIds:", selectedIds);

      const payload = mapUIToCreatePI(finalForm);

      console.log("[PI] Submit - payload addresses:", {
        supplier_address: payload.supplier_address,
        shipping_address: payload.shipping_address,
        dispatch_address: payload.dispatch_address,
        billing_address: payload.billing_address,
      });

      const res = isEditMode
        ? await updatePurchaseInvoice(pId, payload)
        : await createPurchaseInvoice(payload);

      closeSwal();

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      showSuccess(res.message);
      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.PURCHASE_INVOICE_LIST);
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

  // ── Reset ──────────────────────────────────
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
    hasLoadedRef.current = false;
  };

  // ─────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────

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
    saving,
    selected,
    setSelected,
    selectedIds,
    setSelectedIds,
    addresses,
    setAddresses,
    loading,
    setLoading,
  };
};