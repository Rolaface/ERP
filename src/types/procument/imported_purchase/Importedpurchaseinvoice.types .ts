import type { ImportPurchaseInvoiceItem } from "../../../types/procument/imported_purchase/processImportPurchaseInvoiceModal.types";

// One row per supplier invoice (PI) — decisions (approve/reject) are made
// at this invoice level only. Item rows underneath are read-only detail
// lines shown on expand. Lives in its own file so both the page and the
// expanded-row component can import it without one depending on the other.
export interface InvoiceGroup {
  key: string;
  supplierTpin: string;
  supplierName: string;
  invoiceNo: string | number;
  salesDate: string;
  items: ImportPurchaseInvoiceItem[];
  totalTaxable: number;
  totalTax: number;
  totalAmount: number;
}