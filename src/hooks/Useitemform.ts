import { useCallback, useEffect, useState } from "react";
import { createItem, updateItemByItemCode } from "../api/itemApi";
import {
  closeSwal,
  showApiError,
  showLoading,
  showValidationError,
} from "../utils/alert";
import type {
  ItemFormData,
  ItemModalTab,
  ItemTaxRow,
  SupplierOption,
} from "../components/inventory/itemModalTypes";
import type { ModalSubmitHandler, ModalValidationError } from "../types/modal";
import { getSupplierList } from "../api/lookupApi";
import { showSuccess } from "../utils/alert";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";

interface ItemNestedInitialData extends Partial<ItemFormData> {
  vendorInfo?: Partial<
    Pick<ItemFormData, "preferredVendor" | "salesAccount" | "purchaseAccount">
  >;
  inventoryInfo?: Partial<
    Pick<
      ItemFormData,
      | "valuationMethod"
      | "trackingMethod"
      | "reorderLevel"
      | "minStockLevel"
      | "maxStockLevel"
      | "piecesPerBox"
    >
  >;
  batchInfo?: Partial<
    Pick<
      ItemFormData,
      | "has_batch_no"
      | "create_new_batch"
      | "has_expiry_date"
      | "expiryDate"
      | "manufacturingDate"
      | "shelfLife"
      | "endOfLife"
    >
  >;
}

interface UseItemFormProps {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: ItemNestedInitialData | null;
  onSubmit?: ModalSubmitHandler;
  onClose: () => void;
  isZraEnabled?: boolean;
}

// interface SupplierApiItem {
//   supplierName: string;
//   supplierId: string;
// }

// interface SupplierApiResponse {
//   status_code?: number;
//   message?: string;
//   data?: {
//     suppliers?: SupplierApiItem[];
//   };
// }
interface SupplierApiItem {
  value: string;
  label: string;
  description: string;
}

interface Pagination {
  page: number;
  page_size: number;
  items_in_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface SupplierApiResponse {
  status_code: number;
  status: "success" | "fail";
  message: string;
  data: SupplierApiItem[];
  pagination: Pagination;
}
interface SaveItemResponse {
  status_code: number;
  status: "success" | "fail";
  message: string;
  data: string;
}

type ItemValidationError = ModalValidationError<ItemModalTab>;

const itemDetailFields: Array<{ field: keyof ItemFormData; label: string }> = [
  { field: "itemGroup", label: "Item Category" },
  { field: "itemName", label: "Item Name" },
  { field: "description", label: "Description" },
  { field: "itemClassCode", label: "HSN Code" },
  { field: "unitOfMeasureCd", label: "Unit of Measurement" },
];
export const emptyForm: ItemFormData = {
  id: "",
  itemName: "",
  itemGroup: "",
  itemClassCode: "",
  itemTypeCode: "",
  originNationCode: "",
  countryOfOrigin: "",
  packagingUnitCode: "",
  packingUnit: 1,
  packingSize: 1,
  svcCharge: "",
  useYn: false,
  rentalYn: false,
  ins: "",
  sellingPrice: "",
  buyingPrice: "",
  unitOfMeasureCd: "",
  packaging_uom: "",
  description: "",
  sku: "",
  taxPreference: "",
  preferredVendor: "",
  preferredVendorName: "",
  salesAccount: "",
  purchaseAccount: "",
  countryCode: "",
  dimensionUnit: "",
  dimensionUOM: "",
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
  piecesPerBox: "",
  brand: "",
  expiryDate: "",
  manufacturingDate: "",
  shelfLife: "",
  endOfLife: "",
  trackInventory: true,
  allowSales: true,
  allowPurchase: true,
  has_batch_no: false,
  batchNo: "",
  create_new_batch: false,
  has_expiry_date: false,
  isMtvItem: false,
  mtvItemCode: "",
  mtvManufacturerTpin: "",
  mtvRrp: "",
};

const buildPayload = (form: ItemFormData, taxRows: ItemTaxRow[]) => ({
  id: form.id,
  itemName: form.itemName,
  itemGroup: form.itemGroup,
  itemClassCode: form.itemClassCode,
  itemTypeCode: Number(form.itemTypeCode),

  packagingUnitCode: form.packagingUnitCode,
  packingUnit: form.packingUnit || "",
  packingSize: form.packingSize || "",
  piecesPerBox: form.piecesPerBox || "",
  svcCharge: form.svcCharge,
  useYn: form.useYn,
  rentalYn: form.rentalYn,
  ins: form.ins,
  sellingPrice: Number(form.sellingPrice),
  buyingPrice: Number(form.buyingPrice),
  unitOfMeasureCd: form.unitOfMeasureCd,
  packaging_uom: form.packaging_uom,
  description: form.description,
  sku: form.sku,
  weight: form.weight,
  weightUnit: form.weightUnit,
  dimensionLength: form.dimensionLength,
  dimensionWidth: form.dimensionWidth,
  dimensionHeight: form.dimensionHeight,
  dimensionUOM: form.dimensionUnit,
  brand: form.brand,
  countryOfOrigin: form.originNationCode,
  isMtvItem: form.isMtvItem,
  manufacturerItemCd: form.mtvItemCode,
  mtvManufacturerTpin: form.mtvManufacturerTpin,
  mtvRrp: form.mtvRrp,
  is_stock_item: form.trackInventory,
  is_sales_item: form.allowSales,
  is_purchase_item: form.allowPurchase,
  vendorInfo: {
    preferredVendor: form.preferredVendor,
    salesAccount: form.salesAccount,
    purchaseAccount: form.purchaseAccount,
  },
  taxInfo: taxRows.map((row) => ({
    taxCategory: row.taxCategory,
    taxPreference: "",
    taxType: "",
    taxCode: "",
    taxName: row.taxTemplate,
    taxPerct: "",
  })),
  inventoryInfo: {
    valuationMethod: form.valuationMethod,
    trackingMethod: form.trackingMethod,
    reorderLevel: form.reorderLevel,
    minStockLevel: form.minStockLevel,
    maxStockLevel: form.maxStockLevel,
    piecesPerBox: form.piecesPerBox,
  },

  ...(Number(form.itemTypeCode) !== 3 && {
    batchInfo: {
      has_batch_no: form.has_batch_no,
      create_new_batch: false,
      has_expiry_date: form.has_expiry_date,
      expiryDate: form.has_expiry_date ? form.expiryDate : "",
      manufacturingDate: form.has_expiry_date ? form.manufacturingDate : "",
      shelfLife: Number(form.shelfLife),
      endOfLife: form.endOfLife,
    },
  }),
});

const mapApiToForm = (item: any) => {
  return {
    ...item,

    // BASIC
    itemName: item.itemName || "",
    itemGroup: item.itemGroup || "",
    itemClassCode: item.itemClassCode || "",
    description: item.description || "",
    unitOfMeasureCd: item.unitOfMeasureCd || "",
    packaging_uom: item.packaging_uom || "",
    // PRICING
    buyingPrice: String(item.buyingPrice || ""),
    sellingPrice: String(item.sellingPrice || ""),

    // PACKING
    packingUnit: String(item.packingUnit || 1),
    packingSize: String(item.packingSize || 1),

    // INVENTORY
    brand: item.brand || "",
    weight: String(item.weight || ""),
    weightUnit: (item.weightUnit || "").toLowerCase(),

    dimensionLength: String(item.dimensionLength || ""),
    dimensionWidth: String(item.dimensionWidth || ""),
    dimensionHeight: String(item.dimensionHeight || ""),

    // COUNTRY
    originNationCode: item.countryOfOrigin || "",
    dimensionUnit: item.dimensionUOM || "cm",
    // VENDOR
    preferredVendor: item.vendorInfo?.preferredVendor || "",
    preferredVendorName: item.vendorInfo?.preferredVendorName || "",

    // INVENTORY INFO
    valuationMethod: item.inventoryInfo?.valuationMethod || "",
    trackingMethod: item.inventoryInfo?.trackingMethod || "",
    reorderLevel: item.inventoryInfo?.reorderLevel || "",
    maxStockLevel: item.inventoryInfo?.maxStockLevel || "",
    minStockLevel: item.inventoryInfo?.minStockLevel || "",
    piecesPerBox: item.inventoryInfo?.piecesPerBox || "",
    trackInventory: Boolean(item.is_stock_item ?? true),
    allowSales: Boolean(item.is_sales_item ?? true),
    allowPurchase: Boolean(item.is_purchase_item ?? true),
    // BATCH
    has_batch_no: item.batchInfo?.has_batch_no || false,
    has_expiry_date: item.batchInfo?.has_expiry_date || false,
    shelfLife: String(item.batchInfo?.shelfLife || ""),

    // MTV
    isMtvItem: Boolean(item.isMtvItem ?? false),
    mtvItemCode: item.mtvItemCode || "",
    mtvManufacturerTpin: item.mtvManufacturerTpin || "",
    mtvRrp: item.mtvRrp || "",

    // TAX
    taxRows:
      item.taxInfo?.map((t: any) => ({
        taxCategory: t.taxCategory || "",
        taxTemplate: t.taxName || "",
      })) || [],
  };
};

export const useItemForm = ({
  isOpen,
  isEditMode,
  initialData,
  onSubmit,
  onClose,
  isZraEnabled = false,
}: UseItemFormProps) => {
  const [form, setForm] = useState<ItemFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ItemModalTab>("details");
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [taxRows, setTaxRows] = useState<ItemTaxRow[]>([]);

  const isServiceItem = Number(form.itemTypeCode) === 3;

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);

      const response = (await getSupplierList({
        page: 1,
        page_size: 100,
        search: "",
      })) as unknown as SupplierApiResponse;

      if (!response || response.status_code !== 200) {
        showApiError(response?.message || "Failed to load suppliers");
        return;
      }

      const mapped = (response.data ?? []).map((supplier) => ({
        label: supplier.label,
        value: supplier.value,
      }));

      setSuppliers(mapped);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && initialData) {
      const mapped = mapApiToForm(initialData);
      setForm({
        ...emptyForm,
        ...mapped,
      });
      setTaxRows(mapped.taxRows || []);
    } else {
      setForm(emptyForm);
    }

    setActiveTab("details");
  }, [initialData, isEditMode, isOpen]);

  const getDetailsValidationError = (): ItemValidationError | null => {
    for (const { field, label } of itemDetailFields) {
      const value = form[field];
      const stringValue =
        typeof value === "string" || typeof value === "number"
          ? String(value)
          : "";
      const empty = stringValue.trim() === "";

      if (empty)
        return {
          tab: "details",
          field,
          message: `${label} is required.`,
        };
    }
    if (isZraEnabled) {
      const packagingEmpty =
        !form.packaging_uom || String(form.packaging_uom).trim() === "";
      if (packagingEmpty) {
        return {
          tab: "details",
          field: "packaging_uom",
          message: "Packaging Unit is required.",
        };
      }
      const sellingPriceEmpty =
        !form.sellingPrice || String(form.sellingPrice).trim() === "";
      if (sellingPriceEmpty) {
        return {
          tab: "details",
          field: "sellingPrice",
          message: "Selling Price is required.",
        };
      }
    }

    return null;
  };

  const getTaxValidationError = (
    taxRows: ItemTaxRow[],
  ): ItemValidationError | null => {
    return null;
  };

  const getValidationErrorForTab = (
    tab: ItemModalTab,
    taxRows: ItemTaxRow[],
  ): ItemValidationError | null => {
    if (tab === "details") return getDetailsValidationError();
    if (tab === "taxDetails") return getTaxValidationError(taxRows);
    return null;
  };

  const getFirstValidationError = (
    taxRows: ItemTaxRow[],
  ): ItemValidationError | null => {
    return getDetailsValidationError() || getTaxValidationError(taxRows);
  };

  const validateAndShow = (error: ItemValidationError | null): boolean => {
    if (!error) return true;
    setActiveTab(error.tab);
    showValidationError(error.message);
    return false;
  };

  const handleForm = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const reset = () => {
    setForm(emptyForm);
    setTaxRows([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const saveItem = async (taxRows: ItemTaxRow[]): Promise<boolean> => {
    try {
      setLoading(true);
      showLoading(isEditMode ? "Updating item..." : "Creating item...");

      const payload = buildPayload(form, taxRows);
      const itemCode = form.id;
      const response = (
        isEditMode && itemCode
          ? await updateItemByItemCode(itemCode, payload)
          : await createItem(payload)
      ) as SaveItemResponse;

      closeSwal();

      const isSuccess = response.status === "success";

      if (!isSuccess) {
        closeSwal();
        showApiError(response || "Something went wrong");
        return false;
      }

      await showSuccess(response.message);
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.ITEM_LIST);
      const canClose = await onSubmit?.(response.data);
      if (canClose === false) return false;
      handleClose();
      return true;
    } catch (error) {
      closeSwal();
      showApiError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (taxRows: ItemTaxRow[]) => {
    const error = getValidationErrorForTab(activeTab, taxRows);
    if (!validateAndShow(error)) return;

    if (activeTab === "details") {
      setActiveTab("taxDetails");
      return;
    }

    if (activeTab === "taxDetails" && !isServiceItem && form.trackInventory) {
      setActiveTab("inventoryDetails");
    }
  };

  const handleSave = async (
    event: React.FormEvent | undefined,
    taxRows: ItemTaxRow[],
  ) => {
    event?.preventDefault();

    const error = getFirstValidationError(taxRows);
    if (!validateAndShow(error)) return false;

    return saveItem(taxRows);
  };

  const handleSubmit = async (
    event: React.FormEvent,
    taxRows: ItemTaxRow[],
  ) => {
    await handleSave(event, taxRows);
  };

  return {
    form,
    setForm,
    loading,
    activeTab,
    setActiveTab,
    isServiceItem,
    handleForm,
    reset,
    handleClose,
    handleSubmit,
    handleSave,
    handleNext,
    getFirstValidationError,
    getValidationErrorForTab,
    taxRows,
    setTaxRows,
    suppliers,
    loadingSuppliers,
  };
};
