import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { showApiError, showLoading, closeSwal } from "../utils/alert";
import { updateItemByItemCode, createItem } from "../api/itemApi";
import { getItemGroupById } from "../api/itemCategoryApi";
import { useCompanySelection } from "../hooks/useCompanySelection";
import { getAllItemGroups } from "../api/itemCategoryApi";
import { getItemFieldConfigs } from "../config/companyConfigResolver";
import { getTaxConfigs, isTaxAutoPopulated } from "../taxconfig/taxConfigResolver";
import { getSuppliers } from "../api/procurement/supplierApi";


export const emptyForm: Record<string, any> = {
  id: "",
  itemName: "",
  itemGroup: "",
  itemClassCode: "",
  itemTypeCode: "",
  originNationCode: "",
  packagingUnitCode: "",
  packingunit: 1,      
  packingsize: 1,      
  svcCharge: "",
  ins: "",
  sellingPrice: "",
  buyingPrice: "",
  unitOfMeasureCd: "",
  description: "",
  sku: "",
  taxPreference: "",
  preferredVendor: "",
  salesAccount: "",
  purchaseAccount: "",
  taxCategory: "",
  taxType: "",
  taxCode: "",
  taxName: "",
  taxDescription: "",
  taxPerct: "",
  countryCode: "",
  dimensionUnit: "",
  weight: "",
  weightUnit: "",
  dimensionLength: "",
  dimensionWidth: "",
  dimensionHeight: "",
  valuationMethod: "",
  trackingMethod: "",
  reorderLevel: "",
  minStockLevel: "",
  maxStockLevel: "",
  brand: "",
  expiryDate: "",
  manufacturingDate: "",
  shelfLifeInDays: "",
  endOfLife: "",
  trackInventory: false,
  has_batch_no: false,
  batchNo: "",
  create_new_batch: false,
  has_expiry_date: false,
};



const buildPayload = (form: Record<string, any>) => ({
  id: form.id,
  itemName: form.itemName,
  itemGroup: form.itemGroup,
  itemClassCode: form.itemClassCode,
  itemTypeCode: Number(form.itemTypeCode),
  originNationCode: form.originNationCode,
  packagingUnitCode: form.packagingUnitCode,
  packingunit: form.packingunit || "",
  packingsize: form.packingsize || "",
  svcCharge: form.svcCharge,
  ins: form.ins,
  sellingPrice: Number(form.sellingPrice),
  buyingPrice: Number(form.buyingPrice),
  unitOfMeasureCd: form.unitOfMeasureCd,
  description: form.description,
  sku: form.sku,
  weight: form.weight,
  weightUnit: form.weightUnit,
  dimensionLength: form.dimensionLength,
  dimensionWidth: form.dimensionWidth,
  dimensionHeight: form.dimensionHeight,
  brand: form.brand,

  vendorInfo: {
    preferredVendor: form.preferredVendor,
    salesAccount: form.salesAccount,
    purchaseAccount: form.purchaseAccount,
  },

  taxInfo: {
    taxCategory: form.taxCategory,
    taxPreference: form.taxPreference,
    taxType: form.taxType,
    taxCode: form.taxCode,
    taxName: form.taxName,
    taxDescription: form.taxDescription,
    taxPerct: form.taxPerct,
    // countryCode lives inside taxInfo; fall back to originNationCode if not set.
    countryCode: form.countryCode || form.originNationCode || "",
  },

  inventoryInfo: {
    valuationMethod: form.valuationMethod,
    trackingMethod: form.trackingMethod,
    reorderLevel: form.reorderLevel,
    minStockLevel: form.minStockLevel,
    maxStockLevel: form.maxStockLevel,
  },

  ...(Number(form.itemTypeCode) !== 3 && {
    batchInfo: {
      has_batch_no: form.has_batch_no,
      create_new_batch: false,

      has_expiry_date: form.has_expiry_date,
      expiryDate: form.has_expiry_date ? form.expiryDate : "",
      manufacturingDate: form.has_expiry_date ? form.manufacturingDate : "",
      shelfLifeInDays: Number(form.shelfLifeInDays) || 52,
      endOfLife: form.endOfLife || "",
    },
  }),
});


interface UseItemFormProps {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: Record<string, any> | null;
  onSubmit?: (res: any) => void;
  onClose: () => void;
}


export const useItemForm = ({
  isOpen,
  isEditMode,
  initialData,
  onSubmit,
  onClose,
}: UseItemFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "taxDetails" | "inventoryDetails">("details");

  // HSN / item-class hierarchical selector state
  const [itemClassOptions, setItemClassOptions] = useState<
    Array<{ cd: string; cdNm: string; lvl: string }>
  >([]);
  const [loadingItemClasses, setLoadingItemClasses] = useState(false);
  const [selectedLevel1, setSelectedLevel1] = useState("");
  const [selectedLevel2, setSelectedLevel2] = useState("");
  const [selectedLevel3, setSelectedLevel3] = useState("");
  const [selectedLevel4, setSelectedLevel4] = useState("");

  const { companyCode } = useCompanySelection();
  const fieldConfigs = getItemFieldConfigs(companyCode);
  const taxConfigs = getTaxConfigs(companyCode);
  const autoPopulateTax = isTaxAutoPopulated(companyCode);
  const [itemGroups, setItemGroups] = useState<any[]>([]);
  const [loadingItemGroups, setLoadingItemGroups] = useState(false);
  // Derived UI flags
  const isServiceItem = Number(form.itemTypeCode) === 3;
  const showBatchExpiry = Number(form.itemTypeCode) === 1 || Number(form.itemTypeCode) === 2;

  const [suppliers, setSuppliers] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const fetchItemGroups = useCallback(async (itemType?: string) => {
    try {
      setLoadingItemGroups(true);

      const res = await getAllItemGroups(1, 1000, {
        itemType: itemType,
      });

      if (res?.status_code !== 200) {
        showApiError(res?.message || "Failed to load item groups");
        return;
      }

      setItemGroups(res?.data?.data || []);

    } catch (err) {
      showApiError("Error fetching item groups");
    } finally {
      setLoadingItemGroups(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);

      const res = await getSuppliers(1, 1000);

      if (!res || res.status_code !== 200) {
        showApiError(res?.message || "Failed to load suppliers");
        return;
      }

      const list = res?.data?.suppliers || [];

      const mapped = list.map((supplier: any) => ({
        label: supplier.supplierName,
        value: supplier.supplierId,
      }));

      setSuppliers(mapped);
    } catch (err) {
      showApiError("Error fetching suppliers");
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);
  // ── Data fetchers ──────────────────────────────────────────────────────────

  // const fetchItemClassList = useCallback(async () => {
  //   try {
  //     setLoadingItemClasses(true);
  //     const response = await fetch(API.lookup.getItemClasses);
  //     const data: any[] = await response.json();
  //     setItemClassOptions(
  //       data.map((item) => ({
  //         cd:  item.itemClsCd  ?? item.cd  ?? "",
  //         cdNm: item.itemClsNm ?? item.cdNm ?? "",
  //         lvl: item.itemClsLvl ?? item.lvl ?? "1",
  //       }))
  //     );
  //   } catch (err) {
  //     console.error("[useItemForm] Failed to fetch item classes:", err);
  //     setItemClassOptions([]);
  //   } finally {
  //     setLoadingItemClasses(false);
  //   }
  // }, []);

  // ── Form initialisation ────────────────────────────────────────────────────
  //
  // Runs every time the modal opens.
  // Edit mode: flatten the nested API response into the form state.
  // Create mode: reset to emptyForm.
  //
  // Use `??` (nullish coalescing) throughout — `||` would silently replace
  // legitimate `false` or `0` values coming back from the API.

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && initialData) {
      setForm({
        ...emptyForm,
        ...initialData,

        // Flatten taxInfo
        taxCategory: initialData.taxInfo?.taxCategory ?? initialData.taxCategory ?? "",
        taxPreference: initialData.taxInfo?.taxPreference ?? initialData.taxPreference ?? "",
        taxType: initialData.taxInfo?.taxType ?? initialData.taxType ?? "",
        taxCode: initialData.taxInfo?.taxCode ?? initialData.taxCode ?? "",
        taxName: initialData.taxInfo?.taxName ?? initialData.taxName ?? "",
        taxDescription: initialData.taxInfo?.taxDescription ?? initialData.taxDescription ?? "",
        taxPerct: initialData.taxInfo?.taxPerct ?? initialData.taxPerct ?? "",
        countryCode: initialData.taxInfo?.countryCode ?? initialData.countryCode ?? "",

        // API returns packingUnit / packingSize (capital U, capital S).
        // Form state uses packingunit / packingsize (all lowercase).
        // Explicit remap so edit mode pre-fills these inputs correctly.
        packingunit: initialData.packingUnit ?? initialData.packingunit ?? "",
        packingsize: initialData.packingSize ?? initialData.packingsize ?? "",

        // Flatten vendorInfo
        preferredVendor: initialData.vendorInfo?.preferredVendor ?? initialData.preferredVendor ?? "",
        salesAccount: initialData.vendorInfo?.salesAccount ?? initialData.salesAccount ?? "",
        purchaseAccount: initialData.vendorInfo?.purchaseAccount ?? initialData.purchaseAccount ?? "",

        // Flatten inventoryInfo
        valuationMethod: initialData.inventoryInfo?.valuationMethod ?? initialData.valuationMethod ?? "",
        trackingMethod: initialData.inventoryInfo?.trackingMethod ?? initialData.trackingMethod ?? "",
        reorderLevel: initialData.inventoryInfo?.reorderLevel ?? initialData.reorderLevel ?? "",
        minStockLevel: initialData.inventoryInfo?.minStockLevel ?? initialData.minStockLevel ?? "",
        maxStockLevel: initialData.inventoryInfo?.maxStockLevel ?? initialData.maxStockLevel ?? "",

        // Flatten batchInfo
        has_batch_no: initialData.batchInfo?.has_batch_no ?? initialData.has_batch_no ?? false,
        create_new_batch: initialData.batchInfo?.create_new_batch ?? initialData.create_new_batch ?? false,
        has_expiry_date: initialData.batchInfo?.has_expiry_date ?? initialData.has_expiry_date ?? false,

        expiryDate: initialData.batchInfo?.expiryDate ?? initialData.expiryDate ?? "",
        manufacturingDate: initialData.batchInfo?.manufacturingDate ?? initialData.manufacturingDate ?? "",
        shelfLifeInDays: initialData.batchInfo?.shelfLifeInDays ?? initialData.shelfLifeInDays ?? "",
        endOfLife: initialData.batchInfo?.endOfLife ?? initialData.endOfLife ?? "",
      });
      if (initialData?.itemTypeCode) {
        void fetchItemGroups(String(initialData.itemTypeCode));
      }
    } else {
      setForm(emptyForm);
    }

    setActiveTab("details");

    if (!isEditMode) {
      setSelectedLevel1("");
      setSelectedLevel2("");
      setSelectedLevel3("");
      setSelectedLevel4("");
    }
    void fetchSuppliers();
    //   void fetchItemClassList();
    //  void fetchItemClassList();
  }, [isOpen, isEditMode, initialData]);

  // Pre-populate HSN level selectors when editing an existing item.
  // Runs after itemClassOptions are loaded so the option values exist.
  useEffect(() => {
    if (!isEditMode || !initialData?.itemClassCode || itemClassOptions.length === 0) return;

    const code = String(initialData.itemClassCode);
    const exists = (c: string) => itemClassOptions.some((o) => o.cd === c);

    if (code.length >= 2 && exists(code.slice(0, 2))) setSelectedLevel1(code.slice(0, 2));
    if (code.length >= 4 && exists(code.slice(0, 4))) setSelectedLevel2(code.slice(0, 4));
    if (code.length >= 6 && exists(code.slice(0, 6))) setSelectedLevel3(code.slice(0, 6));
    if (code.length >= 8 && exists(code.slice(0, 8))) setSelectedLevel4(code.slice(0, 8));
  }, [isEditMode, initialData, itemClassOptions]);

  // ── HSN hierarchical helpers ───────────────────────────────────────────────

  const getCodesByLevel = (level: string, parentCode?: string) =>
    itemClassOptions.filter((opt) => {
      if (opt.lvl !== level) return false;
      if (level === "1") return true;
      if (!parentCode) return false;
      const prefixLen = parseInt(level, 10) * 2;
      return opt.cd.slice(0, prefixLen - 2) === parentCode.slice(0, prefixLen - 2);
    });

  const handleLevelChange = (level: number, value: string) => {
    // Reset all child levels when a parent changes.
    if (level === 1) { setSelectedLevel1(value); setSelectedLevel2(""); setSelectedLevel3(""); setSelectedLevel4(""); }
    else if (level === 2) { setSelectedLevel2(value); setSelectedLevel3(""); setSelectedLevel4(""); }
    else if (level === 3) { setSelectedLevel3(value); setSelectedLevel4(""); }
    else { setSelectedLevel4(value); }

    // The deepest selected level becomes the committed itemClassCode.
    const finalCode =
      level === 4 ? (value || selectedLevel3 || selectedLevel2 || selectedLevel1) :
        level === 3 ? (value || selectedLevel2 || selectedLevel1) :
          level === 2 ? (value || selectedLevel1) :
            value;

    setForm((prev) => ({ ...prev, itemClassCode: finalCode }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateItemDetails = (): boolean => {
    if (!form.itemClassCode?.trim()) {
      toast.error("HSN / Item Class Code is required.");
      return false;
    }

    const requiredFields: Array<{ field: string; label: string; isNumeric?: boolean }> = [
      { field: "itemTypeCode", label: "Item Type" },
      { field: "itemGroup", label: "Item Category" },
      { field: "itemName", label: "Item Name" },
      { field: "description", label: "Description" },
      { field: "packagingUnitCode", label: "Packaging Unit" },
      { field: "originNationCode", label: "Country of Origin" },
      { field: "unitOfMeasureCd", label: "Unit of Measurement" },
      { field: "svcCharge", label: "Service Charge" },
      { field: "ins", label: "Insurance" },
      { field: "sku", label: "SKU" },
      { field: "sellingPrice", label: "Selling Price", isNumeric: true },
      { field: "salesAccount", label: "Sales Account" },
      { field: "buyingPrice", label: "Buying Price", isNumeric: true },
      { field: "purchaseAccount", label: "Purchase Account" },
      { field: "taxPreference", label: "Tax Preference" },
      { field: "preferredVendor", label: "Preferred Vendor" },
    ];

    for (const { field, label, isNumeric } of requiredFields) {
      const val = form[field];
      const empty = isNumeric
        ? val === "" || val === null || val === undefined
        : !val || String(val).trim() === "";

      if (empty) {
        toast.error(`${label} is required.`);
        return false;
      }
    }

    return true;
  };

  const validateTaxDetails = (): boolean => {
    if (!form.taxCategory?.trim()) {
      toast.error("Please select a Tax Category.");
      return false;
    }
    return true;
  };

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleForm = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Tax category: when auto-populate is enabled, fill all tax fields from config.
    if (name === "taxCategory") {
      if (!autoPopulateTax) {
        setForm((prev) => ({ ...prev, taxCategory: value }));
        return;
      }

      const taxConfig = taxConfigs[value];
      if (!taxConfig) {
        // Unknown category — clear all tax fields to avoid stale data.
        setForm((prev) => ({
          ...prev,
          taxCategory: "",
          taxType: "",
          taxPerct: "",
          taxCode: "",
          taxDescription: "",
          taxName: "",
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        taxCategory: value,
        taxType: taxConfig.taxType,
        taxPerct: taxConfig.taxPerct,
        taxCode: taxConfig.taxCode,
        taxDescription: taxConfig.taxDescription,
        taxName: value,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicFieldChange = (name: string, value: any) => {
    if (name === "itemTypeCode") {
      // Reset itemGroup whenever type changes, then re-fetch filtered groups.
      setForm((prev) => ({ ...prev, [name]: value, itemGroup: "" }));

      if (value) {
        void fetchItemGroups(String(value)); // e.g. "1", "2", "3"
      } else {
        setItemGroups([]); // clear list when type is deselected / reset
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleCategoryChange = async (data: { name: string; id: string }) => {
    try {
      const response = await getItemGroupById(data.id);

      const group = response?.data;

      if (response?.status_code === 200 && group) {
        setForm((prev) => ({
          ...prev,
          itemGroup: group.groupName || "",
        }));
      }
    } catch (err) {
      showApiError("Error loading item category details");
    }
  };

  // ── Form lifecycle ─────────────────────────────────────────────────────────

  const reset = () => {
    setForm(emptyForm);
    setSelectedLevel1("");
    setSelectedLevel2("");
    setSelectedLevel3("");
    setSelectedLevel4("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 NEXT BUTTON FLOW ONLY (NO VALIDATION)

    if (activeTab === "details") {
      setActiveTab("taxDetails");
      return;
    }

    if (activeTab === "taxDetails" && !isServiceItem) {
      setActiveTab("inventoryDetails");
      return;
    }

    // 🔹 FINAL SUBMIT (ONLY ON LAST TAB)

    try {
      setLoading(true);
      showLoading(isEditMode ? "Updating item…" : "Creating item…");

      const payload = buildPayload(form);

      const itemCode = form.id;

      const response = isEditMode && itemCode
        ? await updateItemByItemCode(itemCode, payload)
        : await createItem(payload);

      closeSwal();

      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return;
      }

      onSubmit?.(response);
      handleClose();
    } catch (err: any) {
      closeSwal();
      console.error("[useItemForm] Save failed:", err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    form,
    setForm,
    autoPopulateTax,
    loading,
    activeTab,
    setActiveTab,
    isServiceItem,
    showBatchExpiry,
    fieldConfigs,
    taxConfigs,
    itemClassOptions,
    loadingItemClasses,
    selectedLevel1,
    selectedLevel2,
    selectedLevel3,
    selectedLevel4,
    handleForm,
    handleDynamicFieldChange,
    handleCategoryChange,
    handleLevelChange,
    getCodesByLevel,
    reset,
    handleClose,
    handleSubmit,
    itemGroups,
    loadingItemGroups,
    suppliers,
    loadingSuppliers,
  };
};