import { useState, useEffect, useRef, useCallback } from "react";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showPOConflictDialog,
  showLoading,
  closeSwal,
} from "../utils/alert";
import type { ApiAddress, BoxType } from "../hooks/useAddressLogic";
import { getPurchaseOrders } from "../api/procurement/PurchaseOrderApi";
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
  updatePurchaseInvoice,           // ← ADDED: was missing, caused edit to fail
} from "../api/procurement/PurchaseInvoiceApi";
import {
  mapUIToCreatePI,
  mapApiToUI,
  mapSupplierToAddress,
} from "../types/Supply/purchaseInvoiceMapper";
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
import { getAddressList } from "../api/Adressapi";

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
const addressStub = (id: string, type: string): ApiAddress | null =>
  id
    ? {
      id,
      title: id,
      type,
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
  const companyAddressLoadedRef = useRef(false);
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
    if (!isOpen) {
      companyAddressLoadedRef.current = false;
      return;
    }
    if (companyAddressLoadedRef.current) return;
    companyAddressLoadedRef.current = true;

    // Inline load for company boxes — same pattern as PO
    const loadCompanyAddresses = async () => {


      for (const boxKey of ["companyBilling", "companyShipping"] as const) {
        setLoading((prev) => ({ ...prev, [boxKey]: true }));
        try {
          const data = await getAddressList({ company: true });
          setAddresses((prev) => ({ ...prev, [boxKey]: data }));
          if (data?.length > 0) {
            const first = data[0];
            setSelected((prev) => ({ ...prev, [boxKey]: first }));
            setSelectedIds((prev) => ({ ...prev, [boxKey]: first.id }));
          }
        } catch (err) {
          console.error(`Failed to load ${boxKey}:`, err);
        } finally {
          setLoading((prev) => ({ ...prev, [boxKey]: false }));
        }
      }
    };

    loadCompanyAddresses();
  }, [isOpen]);

  // Sync selectedIds → form.addresses so payload always has correct IDs
  useEffect(() => {
    setForm((prev) => ({
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
      },
    }));
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
      // Reset address selector state too
      setSelected({
        companyBilling: null,
        supplierBilling: null,
        companyShipping: null,
        supplierDispatch: null,
      });
      setSelectedIds({
        companyBilling: "",
        supplierBilling: "",
        companyShipping: "",
        supplierDispatch: "",
      });
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

        // Only set company billing on create; edit load will overwrite anyway
        if (!pId) {
          setForm((prev) => ({
            ...prev,
            terms: { ...prev.terms, buying: buyingTerms || prev.terms?.buying },
            addresses: { ...prev.addresses, companyBillingAddress },
          }));

          // Pre-select company billing address in selector
          if (company.address?.id) {
            setSelectedIds((prev) => ({
              ...prev,
              companyBilling: company.address.id,
            }));
            setSelected((prev) => ({
              ...prev,
              companyBilling: addressStub(company.address.id, "Billing"),
            }));
          }
        }
      } catch (e) {
        showApiError(e);
      }
    };

    loadCompanyData();
  }, [isOpen, pId]);

  // ── Load PI in edit mode ───────────────────
  useEffect(() => {
    if (!isOpen || !pId || hasLoadedRef.current) return;

    const loadPI = async () => {
      try {
        showLoading("Loading Purchase Invoice...");
        const res = await getPurchaseInvoiceById(pId);
        closeSwal();

        if (!res || res.status_code !== 200) {
          showApiError(res);
          return;
        }

        const mapped = mapApiToUI(res.data);
        setForm(mapped);

        const supplierAddrId = mapped.addresses?.supplierAddress?.id || "";
        const dispatchAddrId = mapped.addresses?.dispatchAddress?.id || "";
        const shippingAddrId = mapped.addresses?.shippingAddress?.id || "";
        const companyBillingAddrId = mapped.addresses?.companyBillingAddress?.id || "";

        // Set stubs first so UI shows something immediately
        setSelectedIds({
          supplierBilling: supplierAddrId,
          supplierDispatch: dispatchAddrId,
          companyShipping: shippingAddrId,
          companyBilling: companyBillingAddrId,
        });
        setSelected({
          supplierBilling: supplierAddrId ? addressStub(supplierAddrId, "Billing") : null,
          supplierDispatch: dispatchAddrId ? addressStub(dispatchAddrId, "Dispatch") : null,
          companyShipping: shippingAddrId ? addressStub(shippingAddrId, "Shipping") : null,
          companyBilling: companyBillingAddrId ? addressStub(companyBillingAddrId, "Billing") : null,
        });

        // ── NOW fetch full address lists and match saved IDs to full objects ──
        const supplierId = mapped.supplierId || "";

        // Fetch all 4 address lists in parallel
        const [companyAddrs, supplierBillingAddrs, supplierDispatchAddrs] =
          await Promise.all([
            getAddressList({ company: true }),
            supplierId ? getAddressList({ supplierId, addressType: "Billing" }) : Promise.resolve([]),
            supplierId ? getAddressList({ supplierId }) : Promise.resolve([]),
          ]);

        // Company addresses — both billing and shipping use same company list
        setAddresses((prev) => ({
          ...prev,
          companyBilling: companyAddrs,
          companyShipping: companyAddrs,
          supplierBilling: supplierBillingAddrs,
          supplierDispatch: supplierDispatchAddrs,
        }));

        // Match saved IDs to full address objects so UI shows full details
        const matchedCompanyBilling = companyAddrs.find((a) => a.id === companyBillingAddrId)
          ?? companyAddrs[0] ?? null;
        const matchedCompanyShipping = companyAddrs.find((a) => a.id === shippingAddrId)
          ?? null;
        const matchedSupplierBilling = supplierBillingAddrs.find((a) => a.id === supplierAddrId)
          ?? supplierBillingAddrs[0] ?? null;
        const matchedSupplierDispatch = supplierDispatchAddrs.find((a) => a.id === dispatchAddrId)
          ?? supplierDispatchAddrs[0] ?? null;

        setSelected({
          companyBilling: matchedCompanyBilling,
          companyShipping: matchedCompanyShipping,
          supplierBilling: matchedSupplierBilling,
          supplierDispatch: matchedSupplierDispatch,
        });

        setSelectedIds({
          companyBilling: matchedCompanyBilling?.id ?? companyBillingAddrId,
          companyShipping: matchedCompanyShipping?.id ?? shippingAddrId,
          supplierBilling: matchedSupplierBilling?.id ?? supplierAddrId,
          supplierDispatch: matchedSupplierDispatch?.id ?? dispatchAddrId,
        });

        hasLoadedRef.current = true;
      } catch (e) {
        closeSwal();
        showApiError(e);
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

    if (
      name.startsWith("addresses.") &&
      typeof value === "object" &&
      value !== null
    ) {
      const addressKey = name.replace("addresses.", "") as AddressKey;
      setForm((prev) => ({
        ...prev,
        addresses: {
          ...prev.addresses,
          [addressKey]: {
            ...prev.addresses[addressKey],
            ...(value as Record<string, any>),
          },
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



  const loadAddressesForSupplier = useCallback(
    async (freshSupplierId: string, boxKey: "supplierBilling" | "supplierDispatch") => {
      if (!freshSupplierId) return;



      const apiParams: { supplierId: string; addressType?: string } = {
        supplierId: freshSupplierId,
      };
      if (boxKey === "supplierBilling") {
        apiParams.addressType = "Billing";
      }
      // supplierDispatch: no addressType filter — fetch all supplier addresses

      setLoading((prev) => ({ ...prev, [boxKey]: true }));

      try {
        const data = await getAddressList(apiParams);
        setAddresses((prev) => ({ ...prev, [boxKey]: data }));

        if (data?.length > 0) {
          const first = data[0];
          setSelected((prev) => ({ ...prev, [boxKey]: first }));
          setSelectedIds((prev) => ({ ...prev, [boxKey]: first.id }));

          const prefix =
            boxKey === "supplierBilling" ? "supplierAddress" : "dispatchAddress";

          const fullAddress = {
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
          };


        }
      } catch (err) {
        console.error(`[usePurchaseInvoiceForm] Failed to load "${boxKey}":`, err);
      } finally {
        setLoading((prev) => ({ ...prev, [boxKey]: false }));
      }
    },
    [handleFormChange], // handleFormChange has stable ref (no deps), so this is safe
  );

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
          supplierContactDisplay:
            primaryContact?.fullName ||
            `${primaryContact?.firstName || ""} ${primaryContact?.lastName || ""}`.trim(),
          taxCategory: supplier.supplierTaxCategory || prev.taxCategory,
          currency: supplier.currency || prev.currency,
          terms: buyingTerms ? { buying: buyingTerms } : prev.terms,
          addresses: {
            ...prev.addresses,
            supplierAddress: updatedSupplierAddress,
          },
        };
      });
      await Promise.all([
        loadAddressesForSupplier(supplier.id || "", "supplierBilling"),
        loadAddressesForSupplier(supplier.id || "", "supplierDispatch"),
      ]);

      // Sync selectedIds when supplier address is loaded
      const supplierPrimaryAddress =
        supplier.addresses?.find((a: any) => a.isPrimary) ||
        supplier.addresses?.[0];
      if (supplierPrimaryAddress?.id) {
        setSelectedIds((prev) => ({
          ...prev,
          supplierBilling: supplierPrimaryAddress.id,
        }));
        setSelected((prev) => ({
          ...prev,
          supplierBilling: addressStub(supplierPrimaryAddress.id, "Billing"),
        }));
      }
    } catch (e) {
      showApiError(e);
    }
  };

  // ── Fetch POs for selected supplier ────────
  useEffect(() => {
    if (!isOpen || !form.supplierId) return;

    const fetchPOs = async () => {
      try {
        setPoLoading(true);
        const res = await getPurchaseOrders(1, 50, {
          supplier: form.supplierId,
          status: "Approved",
        });
        setPoList(res.data || []);
      } catch (e) {
        showApiError(e);
      } finally {
        setPoLoading(false);
      }
    };

    fetchPOs();
  }, [isOpen, form.supplierId]);

  // ── PO select ──────────────────────────────
  const handlePOSelect = async (po: any) => {
    if (!po?.poId) return;

    try {
      showLoading("Loading PO details...");
      const res = await getPurchaseOrderById(po.poId);
      closeSwal();

      if (!res || res.status_code !== 200) {
        showApiError(res);
        return;
      }

      const data = res.data;

      

      setCustomIncoterm("");
      setCustomShippingRule("");

      const enrichedItems = (data.items || []).map((item: any) => {
        const supplierTaxCategory = data.taxCategory?.trim();

        let selectedTax =
          item.taxInfo?.find(
            (t: any) =>
              t.taxCategory?.toLowerCase() === supplierTaxCategory?.toLowerCase(),
          ) || item.taxInfo?.[0];

        return {
          itemCode: str(item.itemCode),
          itemName: str(item.itemName),
          quantity: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          uom: str(item.uom),
          requiresBatch:
            !!item.requiresBatch ||
            !!item.batchNo ||
            !!item.mfgDate ||
            !!item.expiryDate ||
            !!item.batchRequired ||
            !!item.hasBatch,

          vatRate: Number(selectedTax?.totalTaxRate || 0),
          vatCd: selectedTax?.taxName || "",

          description: str(item.description || ""),
          warehouse: form.updateStock ? str(item.warehouse) : "",
          packingUnit: Number(item.packingUnit || 0),
          packingSize: Number(item.packingSize || 0),
          packing: `${item.packingUnit || 0} x ${item.packingSize || 0}`,

          batchNo: "",
          mfgDate: "",
          expDate: "",
          discount: 0,
        };
      });

   const hasExistingItems = form.items.some((i) => i.itemCode?.trim());
      let finalItems = enrichedItems; // default: full replace with PO items

      if (hasExistingItems) {
        const action = await showPOConflictDialog(form.items.length, data.poId);

        if (action === "cancel") return; // user aborted — touch nothing

        if (action === "keep") {
          // IMPORT: append PO items, skip any already in the table by itemCode
          const existingCodes = new Set(
            form.items.map((i) => i.itemCode?.trim()).filter(Boolean)
          );
          const newOnly = enrichedItems.filter(
            (i: (typeof enrichedItems)[0]) => !existingCodes.has(i.itemCode?.trim())
          );
          finalItems = [...form.items, ...newOnly];
        }
        // action === "replace" → finalItems stays as enrichedItems (full replace, default)
      }


      const supplierAddrId =
        data.supplierAddress ||
        data.supplier_address ||
        data.addresses?.supplierAddress?.id ||
        "";

      const shippingAddrId =
        data.shippingAddress ||
        data.shipping_address ||
        data.addresses?.shippingAddress?.id ||
        "";

      const dispatchAddrId =
        data.dispatchAddress ||
        data.dispatch_address ||
        data.addresses?.dispatchAddress?.id ||
        "";

      setForm((prev) => ({
        ...prev,
        // ── Header fields from PO ──────────────
        poNumber: str(data.poId),
        supplier: str(data.supplierName),
        supplierId: str(data.supplierId),
        supplierCode: str(data.supplierCode),
        supplierContact: str(data.supplierContact),
        currency: str(data.currency) || prev.currency,
        taxCategory: str(data.taxCategory) || prev.taxCategory,
        project: str(data.project) || prev.project,
        costCenter: str(data.costCenter) || prev.costCenter,
        warehouse: str(data.warehouse) || prev.warehouse,
        shippingRule: str(data.shippingRule) || prev.shippingRule,
        incoterm:
          typeof data.incoterm === "string"
            ? data.incoterm.trim().toUpperCase()
            : prev.incoterm,
        placeOfSupply: str(data.placeOfSupply) || prev.placeOfSupply,
        paymentTermsTemplate:
          str(data.paymentTermsTemplate) || prev.paymentTermsTemplate,
        taxesChargesTemplate:
          str(data.taxesChargesTemplate) || prev.taxesChargesTemplate,
        destnCountryCd: str(data.destnCountryCd) || prev.destnCountryCd,


        terms: {
          buying:
            data.terms?.terms?.buying ||
            data.terms?.buying ||
            prev.terms?.buying,
        },

        addresses: {
          ...prev.addresses,
          supplierAddress: {
            ...prev.addresses.supplierAddress,
            id: supplierAddrId,
          },
          shippingAddress: {
            ...prev.addresses.shippingAddress,
            id: shippingAddrId,
            addressLine1: data.shippingAddressDisplay || "",
          },

          dispatchAddress: {
            ...prev.addresses.dispatchAddress,
            id: dispatchAddrId,
            addressLine1: data.dispatchAddressDisplay || "",
          },
        },

        // ── Items ──────────────────────────────
        items: finalItems.length > 0 ? finalItems : [{ ...emptyItem }],

        // ── Advances ──────────────────────────
        advanceAmount: (data.advances_payments || []).reduce(
          (sum: number, p: any) => sum + Number(p.allocated_amount || 0),
          0,
        ),
      }));

      // Sync address selectors so UI shows pre-selected values
      setSelectedIds((prev) => ({
        ...prev,
        supplierBilling: supplierAddrId || prev.supplierBilling,
        companyShipping: shippingAddrId || prev.companyShipping,
        supplierDispatch: dispatchAddrId || prev.supplierDispatch,
        companyBilling: shippingAddrId || prev.companyBilling,
      }));
      setSelected((prev) => ({
        ...prev,
        ...(supplierAddrId
          ? { supplierBilling: addressStub(supplierAddrId, "Billing") }
          : {}),
        ...(shippingAddrId
          ? {
            companyShipping: addressStub(shippingAddrId, "Shipping"),
            companyBilling: addressStub(shippingAddrId, "Billing"),
          }
          : {}),
        ...(dispatchAddrId
          ? { supplierDispatch: addressStub(dispatchAddrId, "Dispatch") }
          : {}),
      }));
      // ── Fetch full address lists so AddressBox shows details, not just IDs ──
      const freshSupplierId = str(data.supplierId);
      if (freshSupplierId) {
        const [companyAddrs, supplierBillingAddrs, supplierDispatchAddrs] =
          await Promise.all([
            getAddressList({ company: true }),
            getAddressList({ supplierId: freshSupplierId, addressType: "Billing" }),
            getAddressList({ supplierId: freshSupplierId }),
          ]);

        setAddresses((prev) => ({
          ...prev,
          companyBilling:  companyAddrs,
          companyShipping: companyAddrs,
          supplierBilling: supplierBillingAddrs,
          supplierDispatch: supplierDispatchAddrs,
        }));

        const matchedCompanyBilling =
          companyAddrs.find((a) => a.id === shippingAddrId) ?? companyAddrs[0] ?? null;
        const matchedCompanyShipping =
          companyAddrs.find((a) => a.id === shippingAddrId) ?? null;
        const matchedSupplierBilling =
          supplierBillingAddrs.find((a) => a.id === supplierAddrId) ??
          supplierBillingAddrs[0] ?? null;
        const matchedSupplierDispatch =
          supplierDispatchAddrs.find((a) => a.id === dispatchAddrId) ??
          supplierDispatchAddrs[0] ?? null;

        setSelected({
          companyBilling:  matchedCompanyBilling,
          companyShipping: matchedCompanyShipping,
          supplierBilling: matchedSupplierBilling,
          supplierDispatch: matchedSupplierDispatch,
        });

        setSelectedIds({
          companyBilling:  matchedCompanyBilling?.id  ?? shippingAddrId,
          companyShipping: matchedCompanyShipping?.id ?? shippingAddrId,
          supplierBilling: matchedSupplierBilling?.id ?? supplierAddrId,
          supplierDispatch: matchedSupplierDispatch?.id ?? dispatchAddrId,
        });
      }
    } catch (e) {
      closeSwal();
      showApiError(e);
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
          rate: Number(data.buyingPrice || 0),
          uom: data.unitOfMeasureCd,
          vatRate: Number(selectedTax?.totalTaxRate || 0),
          vatCd: selectedTax?.taxName || "",
          taxTypes: taxTypes,
          packingUnit: Number(data.packingUnit || 0),
          packingSize: Number(data.packingSize || 0),
          packing: `(${data.packingUnit || 0}) x (${data.packingSize || 0})`,
          warehouse: items[idx].warehouse || prev.warehouse || "",
          requiresBatch: data.batchInfo?.has_batch_no,
        };
        return { ...prev, items };
      });
    } catch (e) {
      showApiError(e);
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

  // ── Currency symbol 
  const getCurrencySymbol = () => {
    const map: Record<string, string> = {
      ZMW: "K",
      USD: "$",
      EUR: "€",
      INR: "₹",
    };
    return map[form.currency] ?? "";
  };

  // Tab validation 
  const validateTab = (tab: POTab): string | null => {
    if (tab === "details") {
      if (!form.supplier) return "Supplier is required";
      if (!form.supplierInvoiceNumber?.trim())
        return "Supplier Invoice No is required";
      if (!form.paymentType) return "Mode of Payment is required";
      if (!form.items.length) return "At least one item required";

      for (let i = 0; i < form.items.length; i++) {
        const item = form.items[i];
        if (!item.itemCode) return `Row ${i + 1}: Item required`;
        if (!item.quantity || item.quantity <= 0)
          return `Row ${i + 1}: Quantity required`;
        if (!item.rate || item.rate <= 0)
          return `Row ${i + 1}: Unit Price required`;
        if (item.requiresBatch && !item.batchNo?.trim())
          return `Row ${i + 1}: Batch No required`;
        if (item.requiresBatch && !item.mfgDate)
          return `Row ${i + 1}: Mfg Date required`;

        if (item.requiresBatch && !item.expDate)
          return `Row ${i + 1}: Expiry Date required`;
      }
    }

    // if (tab === "address") {
    //   const addr = form.addresses?.supplierAddress;
    //   if (!addr?.id?.trim()) return "Supplier Address is required";
    //   if (!addr?.city?.trim()) return "City is required";
    //   if (!addr?.country?.trim()) return "Country is required";
    // }

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

      const payload = mapUIToCreatePI(finalForm);

      const res = isEditMode
        ? await updatePurchaseInvoice(pId!, payload)   // ← properly imported now
        : await createPurchaseInvoice(payload);

      closeSwal();

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      showSuccess(res.message || (isEditMode ? "Purchase Invoice updated successfully" : "Purchase Invoice created successfully"));
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
    setSelected({
      companyBilling: null,
      supplierBilling: null,
      companyShipping: null,
      supplierDispatch: null,
    });
    setSelectedIds({
      companyBilling: "",
      supplierBilling: "",
      companyShipping: "",
      supplierDispatch: "",
    });
    hasLoadedRef.current = false;
    companyAddressLoadedRef.current = false;
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
    handleAddressSelect: (boxKey: BoxType, addr: ApiAddress) => {
      setSelected((prev) => ({ ...prev, [boxKey]: addr }));
      setSelectedIds((prev) => ({ ...prev, [boxKey]: addr.id }));
      // apply to form
      const prefixMap: Record<BoxType, string> = {
        companyBilling: "companyBillingAddress",
        supplierBilling: "supplierAddress",
        companyShipping: "shippingAddress",
        supplierDispatch: "dispatchAddress",
      };
      handleFormChange({
        target: {
          name: `addresses.${prefixMap[boxKey]}`,
          value: {
            id: addr.id,
            addressTitle: addr.title,
            addressType: addr.addressType,
            addressLine1: addr.addressLine1 ?? "",
            addressLine2: addr.addressLine2 ?? "",
            city: addr.city ?? "",
            state: addr.state ?? "",
            country: addr.country ?? "",
            postalCode: addr.pincode ?? "",
            phone: addr.phone ?? "",
            email: addr.email ?? "",
          },
        },
      } as any);
    },
  };
};


// ─────────────────────────────────────────────
// Local helper (mirrors mapper's str)
// ─────────────────────────────────────────────
const str = (v: any): string => (v ? String(v).trim() : "");