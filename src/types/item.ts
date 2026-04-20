// ─── UPDATED TYPES TO MATCH API RESPONSE ────────────────────────────────────

export interface TaxRate {
  tax_type: string;
  tax_rate: number;
}

export interface TaxInfo {
  taxCategory: string;
  taxName: string;
  taxRates: TaxRate[];
}

export interface BatchInfo {
  has_batch_no: boolean;
  has_expiry_date: boolean;
}

export interface Item {
  id: string;
  itemName: string;
  itemGroup: string;
  itemClassCode: string;
  unitOfMeasureCd: string;
  sellingPrice: number;
  buyingPrice: number;
  brand: string;
  description: string;
  weight: string;
  weightUnit: string;
  countryOfOrigin: string;
  dimensionLength: number;
  dimensionWidth: number;
  dimensionHeight: number;
  packingUnit: number;
  packingSize: number;

  // Nested objects from API
  vendorInfo: {
    preferredVendor: string;
  };
  taxInfo: TaxInfo[];
  inventoryInfo: {
    valuationMethod: string;
    trackingMethod: string;
    reorderLevel: string;
    minStockLevel: string;
    maxStockLevel: string;
  };
  batchInfo: BatchInfo;

  // Legacy flat fields (kept for backward compat, may be undefined)
  sku?: string;
  svcCharge?: string;
  ins?: string;
  taxPreference?: string;
  originNationCode?: string;
  itemTypeCode?: string;
  dimensionUnit?: string;
}

export interface ItemSummary {
  id: string;
  itemName: string;
  brand: string;
  itemGroup: string;
  itemClassCode: string;
  unitOfMeasureCd: string;
  sellingPrice: number;
  preferredVendor: string;
  minStockLevel: string;
  maxStockLevel: string;
  taxCategory: string;
  date: string;
  orgSarNo: string;
  registrationType: string;
  stockEntryType: string;
  totalTaxableAmount: number;
  warehouse: string;
  preferredVendorName:string;
}