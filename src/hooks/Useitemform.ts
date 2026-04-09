/* eslint-disable camelcase */
import { useCallback, useEffect, useState } from "react";
import { createItem, updateItemByItemCode } from "../api/itemApi";
import { getItemGroupTree } from "../api/itemGroupApi";
import {
  closeSwal,
  showApiError,
  showLoading,
  showValidationError,
} from "../utils/alert";
import type {
  ItemFormData,
  ItemGroupOption,
  ItemModalTab,
  ItemTaxRow,
  SupplierOption,
} from "../components/inventory/itemModalTypes";
import { getSupplierList } from "../api/lookupApi";

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
      | "shelfLifeInDays"
      | "endOfLife"
    >
  >;
}

interface UseItemFormProps {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: ItemNestedInitialData | null;
  onSubmit?: (res: unknown) => void;
  onClose: () => void;
}

interface ItemGroupTreeNode {
  name: string;
  item_group_name: string;
  children?: ItemGroupTreeNode[];
}

interface ItemGroupTreeResponse {
  message?: {
    data?: {
      item_groups?: ItemGroupTreeNode[];
    };
  };
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
  status_code?: number;
}

export const emptyForm: ItemFormData = {
  id: "",
  itemName: "",
  itemGroup: "",
  itemClassCode: "",
  itemTypeCode: "",
  originNationCode: "",
  packagingUnitCode: "",
  packingUnit: 1,
  packingSize: 1,
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

const buildPayload = (form: ItemFormData, taxRows: ItemTaxRow[]) => ({
  id: form.id,
  itemName: form.itemName,
  itemGroup: form.itemGroup,
  itemClassCode: form.itemClassCode,
  itemTypeCode: Number(form.itemTypeCode),
  originNationCode: form.originNationCode,
  packagingUnitCode: form.packagingUnitCode,
  packingUnit: form.packingUnit || "",
  packingSize: form.packingSize || "",
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
  taxInfo: taxRows.map((row) => ({
    taxCategory: row.taxCategory,
    taxPreference: "",
    taxType: "",
    taxCode: "",
    taxName: row.taxTemplate,
    taxPerct: "",
    countryCode: form.countryCode || form.originNationCode || "",
  })),
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
      endOfLife: form.endOfLife,
    },
  }),
});

const flattenItemGroups = (nodes: ItemGroupTreeNode[]): ItemGroupOption[] =>
  nodes.flatMap((node) => [
    { id: node.name, groupName: node.item_group_name },
    ...flattenItemGroups(node.children ?? []),
  ]);

export const useItemForm = ({
  isOpen,
  isEditMode,
  initialData,
  onSubmit,
  onClose,
}: UseItemFormProps) => {
  const [form, setForm] = useState<ItemFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ItemModalTab>("details");
  const [itemGroups, setItemGroups] = useState<ItemGroupOption[]>([]);
  const [loadingItemGroups, setLoadingItemGroups] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const isServiceItem = Number(form.itemTypeCode) === 3;

  const fetchItemGroups = useCallback(async () => {
    try {
      setLoadingItemGroups(true);

      const response = (await getItemGroupTree()) as ItemGroupTreeResponse;
      const treeData = response.message?.data?.item_groups;
      setItemGroups(Array.isArray(treeData) ? flattenItemGroups(treeData) : []);
    } catch {
      showApiError("Error fetching item groups");
    } finally {
      setLoadingItemGroups(false);
    }
  }, []);

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
    } catch {
      showApiError("Error fetching suppliers");
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    void fetchItemGroups();
  }, [fetchItemGroups, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && initialData) {
      setForm({
        ...emptyForm,
        ...initialData,
        packingUnit: initialData.packingUnit ?? "",
        packingSize: initialData.packingSize ?? "",
        preferredVendor:
          initialData.vendorInfo?.preferredVendor ??
          initialData.preferredVendor ??
          "",
        salesAccount:
          initialData.vendorInfo?.salesAccount ??
          initialData.salesAccount ??
          "",
        purchaseAccount:
          initialData.vendorInfo?.purchaseAccount ??
          initialData.purchaseAccount ??
          "",
        valuationMethod:
          initialData.inventoryInfo?.valuationMethod ??
          initialData.valuationMethod ??
          "",
        trackingMethod:
          initialData.inventoryInfo?.trackingMethod ??
          initialData.trackingMethod ??
          "",
        reorderLevel:
          initialData.inventoryInfo?.reorderLevel ??
          initialData.reorderLevel ??
          "",
        minStockLevel:
          initialData.inventoryInfo?.minStockLevel ??
          initialData.minStockLevel ??
          "",
        maxStockLevel:
          initialData.inventoryInfo?.maxStockLevel ??
          initialData.maxStockLevel ??
          "",
        has_batch_no:
          initialData.batchInfo?.has_batch_no ??
          initialData.has_batch_no ??
          false,
        create_new_batch:
          initialData.batchInfo?.create_new_batch ??
          initialData.create_new_batch ??
          false,
        has_expiry_date:
          initialData.batchInfo?.has_expiry_date ??
          initialData.has_expiry_date ??
          false,
        expiryDate:
          initialData.batchInfo?.expiryDate ?? initialData.expiryDate ?? "",
        manufacturingDate:
          initialData.batchInfo?.manufacturingDate ??
          initialData.manufacturingDate ??
          "",
        shelfLifeInDays:
          initialData.batchInfo?.shelfLifeInDays ??
          initialData.shelfLifeInDays ??
          "",
        endOfLife:
          initialData.batchInfo?.endOfLife ?? initialData.endOfLife ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setActiveTab("details");
    void fetchSuppliers();
  }, [fetchSuppliers, initialData, isEditMode, isOpen]);

  const validateItemDetails = (): boolean => {
    const requiredFields: Array<{ field: keyof ItemFormData; label: string }> =
      [
        { field: "itemTypeCode", label: "Item Type" },
        { field: "itemGroup", label: "Item Category" },
        { field: "itemName", label: "Item Name" },
        { field: "description", label: "Description" },
        { field: "itemClassCode", label: "HSN Code" },
        { field: "unitOfMeasureCd", label: "Unit of Measurement" },
        { field: "originNationCode", label: "Country of Origin" },
      ];

    for (const { field, label } of requiredFields) {
      const value = form[field];
      const stringValue =
        typeof value === "string" || typeof value === "number"
          ? String(value)
          : "";
      const empty = stringValue.trim() === "";

      if (empty) {
        showValidationError(`${label} is required.`);
        return false;
      }
    }

    return true;
  };

  const validateTaxDetails = (taxRows: ItemTaxRow[]): boolean => {
    if (taxRows.length === 0) {
      showValidationError("At least one tax row is required.");
      return false;
    }

    for (const [index, row] of taxRows.entries()) {
      if (!row.taxCategory.trim()) {
        showValidationError(`Tax Category is required in row ${index + 1}.`);
        return false;
      }

      if (!row.taxTemplate.trim()) {
        showValidationError(`Tax Template is required in row ${index + 1}.`);
        return false;
      }
    }

    return true;
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
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (
    event: React.FormEvent,
    taxRows: ItemTaxRow[],
  ) => {
    event.preventDefault();

    if (activeTab === "details") {
      if (!validateItemDetails()) return;
      setActiveTab("taxDetails");
      return;
    }

    if (activeTab === "taxDetails") {
      if (!validateTaxDetails(taxRows)) return;
      if (!isServiceItem) {
        setActiveTab("inventoryDetails");
        return;
      }
    }

    if (!validateTaxDetails(taxRows)) {
      setActiveTab("taxDetails");
      return;
    }

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

      if (!response || ![200, 201].includes(response.status_code ?? 0)) {
        showApiError(response);
        return;
      }

      onSubmit?.(response);
      handleClose();
    } catch (error) {
      closeSwal();
      showApiError(error);
    } finally {
      setLoading(false);
    }
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
    itemGroups,
    loadingItemGroups,
    suppliers,
    loadingSuppliers,
  };
};
