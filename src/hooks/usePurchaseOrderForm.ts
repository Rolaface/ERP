import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showLoading,
  closeSwal,
} from "../utils/alert";
import { useAddressLogic, BOX_CONFIGS } from "./useAddressLogic";
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
import {
  createPurchaseOrder,
  updatePurchaseOrder,
} from "../api/procurement/PurchaseOrderApi";
import { mapUIToCreatePO } from "../types/Supply/purchaseOrderMapper";
import { getPurchaseOrderById } from "../api/procurement/PurchaseOrderApi";
import { mapApiToUI } from "../types/Supply/purchaseOrderMapper";
import { getSupplierById } from "../../src/api/procurement/supplierApi";
import { getCompanyById } from "../api/companySetupApi";
import type { AddressBlock } from "../types/Supply/purchaseOrder";
import { getItemByItemCode } from "../api/itemApi";
import { useFieldDefault } from "./useFieldDefault";
import { fetchCostCenters, fetchProjects } from "../api/getAllApi";
import { getAllWarehouses } from "../api/WarehouseApi";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";
import type { ApiAddress, BoxType } from "./useAddressLogic";
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
  const [addressSelected, setAddressSelected] = useState<
    Record<BoxType, ApiAddress | null>
  >({
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
  const [addressList, setAddressList] = useState<Record<BoxType, ApiAddress[]>>(
    {
      companyBilling: [],
      supplierBilling: [],
      companyShipping: [],
      supplierDispatch: [],
    },
  );
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

  const handleFormChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        | { target: { name: string; value: any } },
    ) => {
      const { name, value } = e.target;

      // Handle batched address object update (single render instead of 12)
      if (
        name.startsWith("addresses.") &&
        typeof value === "object" &&
        value !== null
      ) {
        const addressKey = name.replace(
          "addresses.",
          "",
        ) as keyof PurchaseOrderFormData["addresses"];
        setForm((prev) => ({
          ...prev,
          addresses: {
            ...prev.addresses,
            [addressKey]: { ...prev.addresses[addressKey], ...value },
          },
        }));
        return;
      }

      // Handle nested keys like "addresses.supplierAddress.id"
      if (name.includes(".")) {
        const keys = name.split(".");

        setForm((prev) => {
          const updated = { ...prev } as any;

          let current = updated;
          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
          }

          current[keys[keys.length - 1]] = value;

          return updated;
        });

        return;
      }

      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [],
  );
  // ── Instantiate useAddressLogic here so we can call loadAddresses imperatively
  const {
    loadAddresses,
    handleSelect: handleAddressSelect,
    handleCopyBillingToShipping,
    handleCopySupplierToDispatch,
  } = useAddressLogic({
    supplierId: form.supplierId,
    selected: addressSelected,
    setSelected: setAddressSelected,
    selectedIds: addressSelectedIds,
    setSelectedIds: setAddressSelectedIds,
    addresses: addressList,
    setAddresses: setAddressList,
    loading: addressLoading,
    setLoading: setAddressLoading,
    onFormChange: handleFormChange,
  });
  const handleAddressRemove = useCallback(
    (boxKey: BoxType) => {
      setAddressSelected((prev) => ({ ...prev, [boxKey]: null }));
      setAddressSelectedIds((prev) => ({ ...prev, [boxKey]: "" }));
      const formKeyMap: Record<BoxType, string> = {
        companyBilling: "companyBillingAddress",
        supplierBilling: "supplierAddress",
        companyShipping: "shippingAddress",
        supplierDispatch: "dispatchAddress",
      };
      handleFormChange({
        target: {
          name: `addresses.${formKeyMap[boxKey]}`,
          value: {
            id: "",
            addressTitle: "",
            addressType: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            phone: "",
            email: "",
          },
        },
      });
    },
    [handleFormChange],
  );

  // ── Company addresses: load ONCE when modal opens ──
  const companyAddressLoadedRef = useRef(false);

  const handleBulkItemChange = useCallback(
    (field: keyof ItemRow, value: string) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({ ...item, [field]: value })),
      }));
    },
    [],
  );
  useEffect(() => {
    if (!isOpen) {
      setForm(emptyPOForm);
      setActiveTab("details");
    }
  }, [isOpen, poId]);

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

          currency: baseCurrency || prev.currency,
          addresses: {
            ...prev.addresses,
            companyBillingAddress,
          },
        }));

        if (company.address) {
          const companyApiAddress: ApiAddress = {
            id: company.address?.name || COMPANY_ID,
            title: company.address?.name || company.companyName,
            addressType: company.address?.addressType || "Billing",
            addressLine1: company.address?.addressLine1 || "",
            addressLine2: company.address?.addressLine2 || "",
            city: company.address?.city || "",
            state: company.address?.province || "",
            country: company.address?.country || "",
            pincode: company.address?.postalCode || "",
            phone: company.contactInfo?.companyPhone || "",
            email: company.contactInfo?.companyEmail || "",
          };

          setAddressSelected((prev) => ({
            ...prev,
            companyBilling: prev.companyBilling ?? companyApiAddress,
            companyShipping: prev.companyShipping ?? companyApiAddress,
          }));

          setAddressList((prev) => ({
            ...prev,
            companyBilling:
              prev.companyBilling.length > 0
                ? prev.companyBilling
                : [companyApiAddress],
            companyShipping:
              prev.companyShipping.length > 0
                ? prev.companyShipping
                : [companyApiAddress],
          }));
        }

        // Also call loadAddresses after loadCompanyData() call in the useEffect body
        loadAddresses("companyBilling");
        loadAddresses("companyShipping");
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
  const lastLoadedPoIdRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !poId) return;

    // Reset if a different PO is being opened
    if (lastLoadedPoIdRef.current !== poId) {
      hasLoadedRef.current = false;
      lastLoadedPoIdRef.current = poId;
    }

    if (hasLoadedRef.current) return;

    const loadPO = async () => {
      hasLoadedRef.current = true;
      const apiData = await getPurchaseOrderById(poId);
      const mapped = mapApiToUI(apiData);
      setForm(mapped);
      setAddressSelected((prev) => ({
        companyBilling: prev.companyBilling,

        supplierBilling: mapped.addresses.supplierAddress.id
          ? {
              id: mapped.addresses.supplierAddress.id,
              title: mapped.addresses.supplierAddress.id,
              addressType: "Billing",
              addressLine1: mapped.addresses.supplierAddress.addressLine1 || "",
              addressLine2: mapped.addresses.supplierAddress.addressLine2 || "",
              city: mapped.addresses.supplierAddress.city || "",
              state: mapped.addresses.supplierAddress.state || "",
              country: mapped.addresses.supplierAddress.country || "",
              pincode: mapped.addresses.supplierAddress.postalCode || "",
              phone: mapped.addresses.supplierAddress.phone || "",
              email: mapped.addresses.supplierAddress.email || "",
            }
          : null,

        companyShipping: mapped.addresses.shippingAddress.id
          ? {
              id: mapped.addresses.shippingAddress.id,
              title: mapped.addresses.shippingAddress.id,
              addressType: "Shipping",
              addressLine1: mapped.addresses.shippingAddress.addressLine1 || "",
              addressLine2: mapped.addresses.shippingAddress.addressLine2 || "",
              city: mapped.addresses.shippingAddress.city || "",
              state: mapped.addresses.shippingAddress.state || "",
              country: mapped.addresses.shippingAddress.country || "",
              pincode: mapped.addresses.shippingAddress.postalCode || "",
              phone: mapped.addresses.shippingAddress.phone || "",
              email: mapped.addresses.shippingAddress.email || "",
            }
          : prev.companyShipping,

        supplierDispatch: mapped.addresses.dispatchAddress.id
          ? {
              id: mapped.addresses.dispatchAddress.id,
              title: mapped.addresses.dispatchAddress.id,
              addressType: "Dispatch",
              addressLine1: mapped.addresses.dispatchAddress.addressLine1 || "",
              addressLine2: mapped.addresses.dispatchAddress.addressLine2 || "",
              city: mapped.addresses.dispatchAddress.city || "",
              state: mapped.addresses.dispatchAddress.state || "",
              country: mapped.addresses.dispatchAddress.country || "",
              pincode: mapped.addresses.dispatchAddress.postalCode || "",
              phone: mapped.addresses.dispatchAddress.phone || "",
              email: mapped.addresses.dispatchAddress.email || "",
            }
          : null,
      }));
      setAddressSelectedIds({
        supplierBilling: mapped.addresses.supplierAddress.id || "",
        supplierDispatch: mapped.addresses.dispatchAddress.id || "",
        companyBilling: mapped.addresses.companyBillingAddress.id || "",
        companyShipping: mapped.addresses.shippingAddress.id || "",
      });

      if (mapped.supplierId) {
        loadAddressesForSupplier(
          mapped.supplierId,
          "supplierBilling",
          !!mapped.addresses.supplierAddress.id,
        );
        loadAddressesForSupplier(
          mapped.supplierId,
          "supplierDispatch",
          !!mapped.addresses.dispatchAddress.id,
        );
      }
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

  // Calculate totals (Items + Taxes + Rounding) - NO STATE UPDATE, pure derived value
const totals = useMemo(() => {
  let qty_sum  = 0;
  let gross    = 0;
  let disc_sum = 0;
  let sub      = 0;
  let tax      = 0;

  for (const item of form.items) {
    const qty      = Number(item.quantity || 0);
    const rate     = Number(item.rate     || 0);
    const discount = Number(item.discount || 0);  
    const vatRate  = Number(item.vatRate  || 0);

    const lineGross    = qty * rate;
    const lineDiscount = lineGross * (discount / 100);
    const lineNet      = lineGross - lineDiscount;
    const lineTax      = lineNet   * (vatRate  / 100);

    qty_sum  += qty;
    gross    += lineGross;
    disc_sum += lineDiscount;
    sub      += lineNet;
    tax      += lineTax;
  }

  for (const t of form.taxRows) {
    tax += (Number(t.amount || 0) * Number(t.taxRate || 0)) / 100;
  }

  return {
    totalQuantity: qty_sum,
    totalAmount:   gross,    // ← add
    totalDiscount: disc_sum, // ← add
    subTotal:      sub,
    totalTax:      tax,
    grandTotal:    sub + tax,
  };
}, [form.items, form.taxRows]);

  useFieldDefault(isOpen, form.costCenter, fetchCostCenters, (val) =>
    setForm((prev) => ({ ...prev, costCenter: val })),
  );

  useFieldDefault(isOpen, form.project, fetchProjects, (val) =>
    setForm((prev) => ({ ...prev, project: val })),
  );

 // usePurchaseOrderForm.ts

useFieldDefault(
  isOpen && !poId,  
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

  const loadAddressesForSupplier = useCallback(
    async (
      freshSupplierId: string,
      boxKey: "supplierBilling" | "supplierDispatch",
      autoSelect = true,
    ) => {
      if (!freshSupplierId) return;

      const { getAddressList } = await import("../api/Adressapi");

      const apiParams: { supplierId: string; addressType?: string } = {
        supplierId: freshSupplierId,
      };
      if (boxKey === "supplierBilling") {
        apiParams.addressType = "Billing";
      }

      setAddressLoading((prev) => ({ ...prev, [boxKey]: true }));

      try {
        const data = await getAddressList(apiParams);
        setAddressList((prev) => ({ ...prev, [boxKey]: data }));

        if (autoSelect && data?.length > 0) {
          const first = data[0];
          setAddressSelected((prev) => ({ ...prev, [boxKey]: first }));
          setAddressSelectedIds((prev) => ({ ...prev, [boxKey]: first.id }));

          const prefix =
            boxKey === "supplierBilling"
              ? "supplierAddress"
              : "dispatchAddress";
          handleFormChange({
            target: {
              name: `addresses.${prefix}`,
              value: {
                id: first.id,
                addressTitle: first.title,
                addressType: first.addressType,
                addressLine1: first.addressLine1 ?? "",
                addressLine2: first.addressLine2 ?? "",
                city: first.city ?? "",
                state: first.state ?? "",
                country: first.country ?? "",
                postalCode: first.pincode ?? "",
                phone: first.phone ?? "",
                email: first.email ?? "",
              },
            },
          });
        }
      } catch (err) {
        console.error(
          `[usePurchaseOrderForm] Failed to load "${boxKey}":`,
          err,
        );
      } finally {
        setAddressLoading((prev) => ({ ...prev, [boxKey]: false }));
      }
    },
    [handleFormChange],
  );

  const handleSupplierChange = useCallback(
    async (sup: any) => {
      if (!sup?.id) return;

      try {
        const res = await getSupplierById(sup.id);

        const supplier = res?.message?.data;

        if (!supplier) return;

       

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
          supplierContact: primaryContact?.id || supplier.contactPerson || "",
          supplierContactDisplay:
            primaryContact?.fullName || supplier.contactPerson || "",
          terms: {
            buying: supplier?.terms?.buying || prev.terms?.buying,
          },

          currency: supplier.currency || prev.currency,
          taxCategory: supplier.supplierTaxCategory || "",
          addresses: {
            ...prev.addresses,

            supplierAddress: {
              ...prev.addresses.supplierAddress,

              id:
                prev.addresses.supplierAddress?.id || primaryAddress?.id || "",

              addressLine1: primaryAddress?.line1 || "",
              addressLine2: primaryAddress?.line2 || "",
              city: primaryAddress?.city || "",
              state: primaryAddress?.state || "",
              country: primaryAddress?.country || "",
              postalCode: primaryAddress?.postalCode || "",
            },

            shippingAddress: {
              ...prev.addresses.shippingAddress,

              id:
                prev.addresses.shippingAddress?.id || primaryAddress?.id || "",

              addressLine1: primaryAddress?.line1 || "",
              addressLine2: primaryAddress?.line2 || "",
              city: primaryAddress?.city || "",
              state: primaryAddress?.state || "",
              country: primaryAddress?.country || "",
              postalCode: primaryAddress?.postalCode || "",
            },
          },
        }));

        // ── Auto-load supplier address boxes on supplier select ──
        await Promise.all([
          loadAddressesForSupplier(supplier.id, "supplierBilling"),
          loadAddressesForSupplier(supplier.id, "supplierDispatch"),
        ]);
      } catch (err) {
        console.error("Supplier fetch failed:", err);
      }
    },
    [loadAddressesForSupplier],
  );

  const handleItemChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      idx: number,
    ) => {
      const { name, value } = e.target;
      const isNum = name === "quantity" || name === "rate";

      setForm((p) => {
        const newItems = p.items.map((item, i) =>
          i !== idx
            ? item
            : {
                ...item,
                [name]: isNum
                  ? value === "" || value === null
                    ? null
                    : Number(value)
                  : value,
              },
        );
        return { ...p, items: newItems };
      });
    },
    [],
  );

  const addItem = useCallback(() => {
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
  }, []);

  const removeItem = useCallback(
    (idx: number) => {
      if (form.items.length === 1) {
        showValidationError("At least one item is required");
        return;
      }
      setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    },
    [form.items.length],
  );

  const duplicateItem = useCallback((absoluteIndex: number) => {
    setForm((prev) => {
      const source = prev.items[absoluteIndex];
      if (!source) return prev;
      const copy = { ...source };
      const newItems = [...prev.items];
      newItems.splice(absoluteIndex + 1, 0, copy);
      return { ...prev, items: newItems };
    });
  }, []);

  const handleTaxRowChange = useCallback(
    (idx: number, key: keyof TaxRow, value: any) => {
      setForm((p) => ({
        ...p,
        taxRows: p.taxRows.map((row, i) =>
          i !== idx ? row : { ...row, [key]: value },
        ),
      }));
    },
    [],
  );

  const addTaxRow = useCallback(() => {
    setForm((p) => ({ ...p, taxRows: [...p.taxRows, { ...emptyTaxRow }] }));
  }, []);

  const removeTaxRow = useCallback((idx: number) => {
    setForm((p) => ({ ...p, taxRows: p.taxRows.filter((_, i) => i !== idx) }));
  }, []);

  const handlePaymentRowChange = useCallback(
    (idx: number, key: keyof PaymentRow, value: any) => {
      setForm((p) => ({
        ...p,
        paymentRows: p.paymentRows.map((row, i) =>
          i !== idx ? row : { ...row, [key]: value },
        ),
      }));
    },
    [],
  );

  const addPaymentRow = useCallback(() => {
    setForm((p) => ({
      ...p,
      paymentRows: [...p.paymentRows, { ...emptyPaymentRow }],
    }));
  }, []);

  const removePaymentRow = useCallback(
    (idx: number) => {
      if (form.paymentRows.length === 1) return;
      setForm((p) => ({
        ...p,
        paymentRows: p.paymentRows.filter((_, i) => i !== idx),
      }));
    },
    [form.paymentRows.length],
  );

  const handleSaveTemplate = (html: string) => {
    setForm((p) => ({ ...p, messageHtml: html }));
   
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
        return "";
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
      if (!form.supplierId) {
        return "Please select a supplier";
      }

      if (!form.items.length) {
        return "Please add at least one item";
      }

      for (let i = 0; i < form.items.length; i++) {
        const it = form.items[i];

        // Item
        if (!it.itemCode) {
          return `Row ${i + 1}: Item is required`;
        }

        // Qty
        if (!it.quantity || Number(it.quantity) <= 0) {
          return `Row ${i + 1}: Quantity is required`;
        }

        // Rate
        if (!it.rate || Number(it.rate) <= 0) {
          return `Row ${i + 1}: Rate is required`;
        }

        // Warehouse
        if (!it.warehouse) {
          return `Row ${i + 1}: Warehouse is required`;
        }

        // VAT Code
        // if (!it.vatCd || it.vatCd.trim() === "") {
        //   return `Row ${i + 1}: Tax Name is required`;
        // }
      }
    }

    return null;
  };
  const handleItemSelect = useCallback(
    async (itemId: string, idx: number) => {
      try {
        const res = await getItemByItemCode(itemId, form.taxCategory);
        if (!res || res.status_code !== 200) return;

        const data = res.data;

        const supplierTaxCategory = form.taxCategory?.trim();

        let selectedTax = data.taxInfo?.find(
          (t: any) =>
            t.taxCategory?.toLowerCase() === supplierTaxCategory?.toLowerCase(),
        );

        if (!selectedTax && data.taxInfo?.length) {
          selectedTax = data.taxInfo[0];
        }

        const totalTaxRate = Number(selectedTax?.totalTaxRate || 0);
        const taxTypes = (data.taxInfo || [])
          .flatMap((tax: any) => tax.taxRates || [])
          .map((r: any) => r.tax_type)
          .filter((t: string) => t && t.trim() !== "");

        setForm((prev) => {
          const items = [...prev.items];

          items[idx] = {
            ...items[idx],

            itemCode: data.id,
            itemName: data.itemName,
            description: data.description,

            warehouse: items[idx].warehouse || prev.warehouse || "",

            rate: Number(data.buyingPrice || 0),
            uom: data.unitOfMeasureCd,

            vatRate: totalTaxRate,
            vatCd: selectedTax?.taxName || "",
            taxTypes: taxTypes,

            taxCategory: selectedTax?.taxCategory || "",

            requiredBy: items[idx].requiredBy || prev.requiredBy || "",

            packingUnit: Number(data.packingUnit || 0),
            packingSize: Number(data.packingSize || 0),
            packing: `(${data.packingUnit || 0}) x (${data.packingSize || 0})`,
          };

          return { ...prev, items };
        });
      } catch (err) {
        showApiError(err);
      }
    },
    [form.taxCategory],
  );
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (saving) return;

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
        res?.message ||
          (isEditMode ? "Purchase Order Updated" : "Purchase Order Created"),
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
    setAddressSelected({
      companyBilling: null,
      supplierBilling: null,
      companyShipping: null,
      supplierDispatch: null,
    });
    setAddressSelectedIds({
      companyBilling: "",
      supplierBilling: "",
      companyShipping: "",
      supplierDispatch: "",
    });
    setAddressList({
      companyBilling: [],
      supplierBilling: [],
      companyShipping: [],
      supplierDispatch: [],
    });
    companyAddressLoadedRef.current = false;
    hasLoadedRef.current = false;
    lastLoadedPoIdRef.current = undefined;
  };
  return {
    form: { ...form, ...totals },
    totals,
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
    handleAddressSelect,
    handleCopyBillingToShipping,
    handleCopySupplierToDispatch,
    loadAddresses,
    handleAddressRemove,
  };
};
