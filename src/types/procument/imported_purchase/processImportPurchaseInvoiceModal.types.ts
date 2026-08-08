// Raw shapes now match the actual ZRA response you shared.

export interface ImportPurchaseInvoiceSaleItemRaw {
  itemSeq: number;
  itemCd: string;
  itemClsCd: string;
  itemNm: string;
  bcd: string | null;
  pkgUnitCd: string;
  pkg: number;
  qtyUnitCd: string;
  qty: number;
  prc: number;
  splyAmt: number;
  dcRt: number;
  dcAmt: number;
  vatCatCd: string;
  iplCatCd: string | null;
  tlCatCd: string | null;
  exciseTxCatCd: string | null;
  vatTaxblAmt: number;
  exciseTaxblAmt: number;
  iplTaxblAmt: number;
  tlTaxblAmt: number;
  taxblAmt: number;
  vatAmt: number;
  iplAmt: number;
  tlAmt: number;
  exciseTxAmt: number;
  totAmt: number;
}

export interface ImportPurchaseInvoiceSaleRaw {
  spplrTpin: string;
  spplrNm: string;
  spplrBhfId: string;
  spplrInvcNo: number;
  rcptTyCd: string;
  pmtTyCd: string;
  cfmDt: string; // "2026-07-08 20:03:36"
  salesDt: string; // "20260708"
  stockRlsDt: string | null;
  totItemCnt: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
  remark: string | null;
  itemList: ImportPurchaseInvoiceSaleItemRaw[];
}

export interface ImportPurchaseInvoiceSalesApiResponse {
  resultCd: string; // "000" = success
  resultMsg: string;
  resultDt: string;
  data: {
    saleList: ImportPurchaseInvoiceSaleRaw[];
  };
}

// Flattened invoice+item row (one per line item) — what fetchPendingPurchaseInvoiceImports
// hands back to the hook after flattening saleList[].itemList[].
// Invoice-level totAmt is prefixed `inv` to avoid colliding with the item's own totAmt.
export interface ImportPurchaseInvoiceItemApiRaw {
  spplrTpin: string;
  spplrNm: string;
  spplrBhfId: string;
  spplrInvcNo: string;
  rcptTyCd: string;
  pmtTyCd: string;
  cfmDt: string;
  salesDt: string;
  stockRlsDt: string | null;
  invTotItemCnt: number;
  invTotTaxblAmt: number;
  invTotTaxAmt: number;
  invTotAmt: number;
  invRemark: string | null;

  itemSeq: number;
  itemCd: string;
  itemClsCd: string;
  itemNm: string;
  bcd: string | null;
  pkgUnitCd: string;
  pkg: number;
  qtyUnitCd: string;
  qty: number;
  prc: number;
  splyAmt: number;
  dcRt: number;
  dcAmt: number;
  vatCatCd: string;
  taxblAmt: number;
  vatAmt: number;
  totAmt: number; // item-level total
}

// UI-facing row used by the page/hook.
export interface ImportPurchaseInvoiceItem {
  id: string; // `${spplrTpin}-${spplrInvcNo}-${itemSeq}`
  invoiceNo: string;
  supplierTpin: string;
  supplierName: string;
  supplierBranchId: string;
  receiptTypeCd: string;
  paymentTypeCd: string;
  confirmedAt: string;
  salesDate: string; // YYYYMMDD
  stockReleaseDate: string | null; // NEW — was in raw/flattened data, wasn't mapped through before
  itemSeq: number;
  itemCd: string;
  itemClassCd: string;
  itemName: string;
  barcode: string | null; // NEW — same story, was dropped in mapRawItem
  packageUnitCd: string;
  packageCount: number;
  qtyUnitCd: string;
  qty: number;
  unitPrice: number;
  supplyAmount: number;
  discountRate: number;
  discountAmount: number;
  vatCategoryCd: string;
  taxableAmount: number;
  vatAmount: number;
  itemTotalAmount: number;
  invoiceTotalAmount: number;
  invoiceTaxAmount: number;
  invoiceItemCount: number;
  remark: string | null;
  mappedInvoiceCode: string | null;
}

export interface ImportPurchaseInvoiceItemsTotals {
  totalItems: number;
  totalPackages: number;
  totalAmount: number; // was totalWeight — no weight field in this payload
}

export type DecisionsMap = Record<string, "approve" | "reject" | null>;
export type RemarksMap = Record<string, string>;

export interface MappedPurchaseInvoice {
  purchaseInvoiceNo: string;
  purchaseInvoiceId: string;
}
export type MappedPurchaseInvoicesMap = Record<string, MappedPurchaseInvoice>;

export type CompanyMap = Record<string, string>;

export interface MappedSupplier {
  id: string;
  name: string;
}
export type SuppliersMap = Record<string, MappedSupplier>;

export interface SubmitPurchaseInvoiceItemPayload {
  itemSeq: number;
  itemCd: string;
  itemClsCd: string;
  purchaseInvoiceRefCd: string;
  purchaseInvoiceCd: string;
  imptItemSttsCd: string; // "3" approve / "4" reject — kept for backend continuity
  remark: string;
  mapped_purchase_invoice: string;
  mapped_erp_supplier: string;
  target_company: string;
  pkg: number;
  pkgUnitCd: string;
  qty: number;
  qtyUnitCd: string;
  prc: number;
  taxblAmt: number;
  vatAmt: number;
  totAmt: number;
}

// Grouped by supplier + supplier invoice number (was grouped by dclNo).
export interface SubmitPurchaseInvoicePayload {
  spplrTpin: string;
  spplrInvcNo: number;
  spplrBhfId: string;
  salesDt: string;
  itemList: SubmitPurchaseInvoiceItemPayload[];
}