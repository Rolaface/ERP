export type SelectedStockItem = {
  itemCode: string;
  itemName?: string;
  description: string;

  // packing
  packingSize?: number;
  packingUnit?: number;

  // batch
  batchNo?: string;
  mfgDate?: string;
  expiryDate?: string;

  // stock
  qty?: number;

  // pricing
  price?: number;
  valuation_rate?: number;
  sellingPrice?: number;
  purchasePrice?: number;

  // warehouse
  warehouse?: string;

  // tax
  vatRate?: number;
  vatCode?: string;
  taxInfo?: any[];
};