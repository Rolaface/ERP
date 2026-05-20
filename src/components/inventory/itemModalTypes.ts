import type React from "react";

export type ItemModalTab = "details" | "taxDetails" | "inventoryDetails";

export interface ItemTaxRow {
  taxCategory: string;
  taxTemplate: string;
}

export interface ItemTaxInfo {
  taxCategory: string;
  taxPreference: string;
  taxType: string;
  taxCode: string;
  taxName: string;
  taxPerct: string;
  countryCode: string;
}

export interface SupplierOption {
  label: string;
  value: string;
}

export interface ItemGroupOption {
  id: string;
  groupName: string;
}

export interface ItemFormData {
  id: string;
  itemName: string;
  itemGroup: string;
  itemClassCode: string;
  itemTypeCode: string;
  countryOfOrigin: string;
  originNationCode:string;
  packagingUnitCode: string;
packingUnit: number | null;
packingSize: number | null;
  svcCharge: string;
  ins: string;
  sellingPrice: string | number;
  buyingPrice: string | number;
  unitOfMeasureCd: string;
  description: string;
  sku: string;
  taxPreference: string;
  preferredVendor: string;
  salesAccount: string;
  purchaseAccount: string;
  countryCode: string;
  dimensionUnit: string;
  weight: string | number;
  weightUnit: string;
  dimensionLength: string | number;
  dimensionWidth: string | number;
  dimensionHeight: string | number;
  valuationMethod: string;
  trackingMethod: string;
  reorderLevel: string | number;
  minStockLevel: string | number;
  maxStockLevel: string | number;
  brand: string;
  expiryDate: string;
  manufacturingDate: string;
  shelfLife: string | number;
  endOfLife: string;
  trackInventory: boolean;
  allowSales: boolean;
  allowPurchase: boolean;
  has_batch_no: boolean;
  batchNo: string;
  create_new_batch: boolean;
  has_expiry_date: boolean;
}

export type ItemFormChangeHandler = (
  event: React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) => void;

export type ItemFieldSetter = <K extends keyof ItemFormData>(
  field: K,
  value: ItemFormData[K],
) => void;

export interface LookupSelection {
  name: string;
  id: string;
}
