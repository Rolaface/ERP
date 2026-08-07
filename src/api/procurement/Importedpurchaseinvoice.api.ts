import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type {
  ImportPurchaseInvoiceSalesApiResponse,
  ImportPurchaseInvoiceItemApiRaw,
  ImportPurchaseInvoiceItem,
  DecisionsMap,
  RemarksMap,
} from "../../types/procument/imported_purchase/processImportPurchaseInvoiceModal.types";
import type {
  ImportedPurchaseInvoicesApiResponse,
  ImportedPurchaseInvoiceItemRaw,
  ImportedPurchaseInvoiceDetailApiResponse,
  ImportedPurchaseInvoiceDetailRaw,
} from "../../types/procument/imported_purchase/Importedpurchaseinvoice.types";

const api = createAxiosInstance(ERP_BASE);

// ASSUMPTION: config/api.ts purchaseInvoiceImports namespace — see earlier note.
export const PurchaseInvoiceImportsAPI = API.purchaseInvoiceImports;

const USE_DUMMY_PENDING_IMPORTS = false;

const dummyPendingImports: ImportPurchaseInvoiceItemApiRaw[] = [
  {
    spplrTpin: "1000000000",
    spplrNm: "Dummy Supplier Pvt Ltd",
    spplrBhfId: "000",
    spplrInvcNo: "DUMMY-INV-001",
    rcptTyCd: "S",
    pmtTyCd: "01",
    cfmDt: "20260101120000",
    salesDt: "20260101",
    stockRlsDt: "20260101120000",
    invTotItemCnt: 1,
    invTotTaxblAmt: 1000,
    invTotTaxAmt: 160,
    invTotAmt: 1160,
    invRemark: "Dummy invoice remark",
    itemSeq: 1,
    itemCd: "DUMMY-ITEM-001",
    itemClsCd: "50101500",
    itemNm: "Dummy Item",
    bcd: "",
    pkgUnitCd: "NT",
    pkg: 1,
    qtyUnitCd: "U",
    qty: 1,
    prc: 1000,
    splyAmt: 1000,
    dcRt: 0,
    dcAmt: 0,
    vatCatCd: "A",
    taxblAmt: 1000,
    vatAmt: 160,
    totAmt: 1160,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// The ZRA-style endpoint wraps everything under a top-level "message" key:
//   { message: { resultCd, resultMsg, resultDt, data: { saleList } } }
// This type + the accessor below are the ONLY place that needs to know
// about that wrapper — everything downstream still works with the plain
// { resultCd, resultMsg, data } shape.
// ─────────────────────────────────────────────────────────────────────────
interface PendingImportsEnvelope {
  message: ImportPurchaseInvoiceSalesApiResponse;
}

// Flattens saleList[].itemList[] into one row per line item, carrying the
// parent sale's fields along (prefixed `inv*` where they'd collide).
function flattenSales(
  saleList: ImportPurchaseInvoiceSalesApiResponse["data"]["saleList"]
): ImportPurchaseInvoiceItemApiRaw[] {
  const rows: ImportPurchaseInvoiceItemApiRaw[] = [];

  saleList.forEach((sale) => {
    sale.itemList.forEach((item) => {
      rows.push({
        spplrTpin: sale.spplrTpin,
        spplrNm: sale.spplrNm,
        spplrBhfId: sale.spplrBhfId,
        spplrInvcNo: sale.spplrInvcNo,
        rcptTyCd: sale.rcptTyCd,
        pmtTyCd: sale.pmtTyCd,
        cfmDt: sale.cfmDt,
        salesDt: sale.salesDt,
        stockRlsDt: sale.stockRlsDt,
        invTotItemCnt: sale.totItemCnt,
        invTotTaxblAmt: sale.totTaxblAmt,
        invTotTaxAmt: sale.totTaxAmt,
        invTotAmt: sale.totAmt,
        invRemark: sale.remark,

        itemSeq: item.itemSeq,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemNm: item.itemNm,
        bcd: item.bcd,
        pkgUnitCd: item.pkgUnitCd,
        pkg: item.pkg,
        qtyUnitCd: item.qtyUnitCd,
        qty: item.qty,
        prc: item.prc,
        splyAmt: item.splyAmt,
        dcRt: item.dcRt,
        dcAmt: item.dcAmt,
        vatCatCd: item.vatCatCd,
        taxblAmt: item.taxblAmt,
        vatAmt: item.vatAmt,
        totAmt: item.totAmt,
      });
    });
  });

  return rows;
}

export async function fetchPendingPurchaseInvoiceImports(): Promise<ImportPurchaseInvoiceItemApiRaw[]> {
  if (USE_DUMMY_PENDING_IMPORTS) {
    return dummyPendingImports;
  }

  const resp: AxiosResponse<PendingImportsEnvelope> = await api.get(
    PurchaseInvoiceImportsAPI.get
  );

  // The real payload is nested under `message` — reading resp.data.resultCd
  // / resp.data.data directly is always undefined, which makes every fetch
  // look "failed" and leaves the table empty.
  const body = resp.data?.message;

  if (!body) {
    throw new Error("Purchase invoice import request returned an unexpected shape");
  }

  if (body.resultCd !== "000") {
    throw new Error(body.resultMsg || "Purchase invoice import request failed");
  }

  const saleList = body.data?.saleList ?? [];
  return flattenSales(saleList);
}

// ─────────────────────────────────────────────────────────────────────────
// save_purchase_sales payload — ONE invoice object per call, decision lives
// at invoice level as "Approved"/"Rejected" (transaction_progress), not
// per-item like the old imptItemSttsCd flow.
//
// ASSUMPTION: bcd / stockRlsDt aren't currently carried on the mapped
// ImportPurchaseInvoiceItem (mapRawItem drops them). Sending null for now —
// if backend needs real values, add `bcd` + `stockRlsDt` to mapRawItem and
// the ImportPurchaseInvoiceItem type, then read them here instead of null.
//
// ASSUMPTION: iplCatCd/tlCatCd/exciseTxCatCd + their *Amt/*TaxblAmt siblings
// aren't part of our purchase-invoice-import flow (no Excise/IPL/TL category
// selection in the UI) — defaulting to null/0 like the sample shows for a
// plain VAT-only line.
// ─────────────────────────────────────────────────────────────────────────

const SAVE_PURCHASE_SALES_ENDPOINT =
  "/api/method/zra_smart_invoice.modules.purchase_invoice.api.save_purchase_sales";

interface SaveSalesItemPayload {
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

interface SaveSalesInvoicePayload {
  transaction_progress: "Approved" | "Rejected";
  spplrTpin: string;
  spplrNm: string;
  spplrBhfId: string;
  spplrInvcNo: string | number;
  rcptTyCd: string;
  pmtTyCd: string;
  cfmDt: string;
  salesDt: string;
  stockRlsDt: string | null;
  totItemCnt: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
  remark: string | null;
  itemList: SaveSalesItemPayload[];
}

function buildSaveSalesPayloads(
  items: ImportPurchaseInvoiceItem[],
  decisions: DecisionsMap,
  remarks: RemarksMap
): SaveSalesInvoicePayload[] {
  const byInvoice = new Map<string, SaveSalesInvoicePayload>();

  items.forEach((item) => {
    const decision = decisions[item.id];
    if (decision !== "approve" && decision !== "reject") return;

    const key = `${item.supplierTpin}-${item.invoiceNo}`;
    const progress: "Approved" | "Rejected" =
      decision === "approve" ? "Approved" : "Rejected";

    const itemPayload: SaveSalesItemPayload = {
      itemSeq: item.itemSeq,
      itemCd: item.itemCd,
      itemClsCd: item.itemClassCd,
      itemNm: item.itemName,
      bcd: null,
      pkgUnitCd: item.packageUnitCd,
      pkg: item.packageCount,
      qtyUnitCd: item.qtyUnitCd,
      qty: item.qty,
      prc: item.unitPrice,
      splyAmt: item.supplyAmount,
      dcRt: item.discountRate,
      dcAmt: item.discountAmount,
      vatCatCd: item.vatCategoryCd,
      iplCatCd: null,
      tlCatCd: null,
      exciseTxCatCd: null,
      vatTaxblAmt: item.taxableAmount,
      exciseTaxblAmt: 0,
      iplTaxblAmt: 0,
      tlTaxblAmt: 0,
      taxblAmt: item.taxableAmount,
      vatAmt: item.vatAmount,
      iplAmt: 0,
      tlAmt: 0,
      exciseTxAmt: 0,
      totAmt: item.itemTotalAmount,
    };

    const existing = byInvoice.get(key);
    if (existing) {
      existing.itemList.push(itemPayload);
      existing.totItemCnt += 1;
      existing.totTaxblAmt += item.taxableAmount;
      existing.totTaxAmt += item.vatAmount;
      existing.totAmt += item.itemTotalAmount;
      // UI only allows whole-invoice approve/reject (group-level actions),
      // so all items in a group should already share the same decision.
      existing.transaction_progress = progress;
    } else {
      byInvoice.set(key, {
        transaction_progress: progress,
        spplrTpin: item.supplierTpin,
        spplrNm: item.supplierName,
        spplrBhfId: item.supplierBranchId,
        spplrInvcNo: item.invoiceNo,
        rcptTyCd: item.receiptTypeCd,
        pmtTyCd: item.paymentTypeCd,
        cfmDt: item.confirmedAt,
        salesDt: item.salesDate,
        stockRlsDt: null,
        totItemCnt: 1,
        totTaxblAmt: item.taxableAmount,
        totTaxAmt: item.vatAmount,
        totAmt: item.itemTotalAmount,
        remark: remarks[item.id] ?? item.remark ?? null,
        itemList: [itemPayload],
      });
    }
  });

  return Array.from(byInvoice.values());
}

export async function submitPurchaseInvoiceImportDecisions(
  items: ImportPurchaseInvoiceItem[],
  decisions: DecisionsMap,
  remarks: RemarksMap
): Promise<any[]> {
  const payloads = buildSaveSalesPayloads(items, decisions, remarks);

  return Promise.all(
    payloads.map(async (payload) => {
      const resp = await api.post(SAVE_PURCHASE_SALES_ENDPOINT, payload);
      return resp.data;
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Imported purchase invoices (main list page) — unchanged, separate endpoint
// ─────────────────────────────────────────────────────────────────────────

const USE_DUMMY_IMPORTED_PURCHASE_INVOICES = true;

const dummyImportedPurchaseInvoices: ImportedPurchaseInvoiceItemRaw[] = [
  {
    id: "1",
    declaration_no: "DEC-2026-0001",
    declaration_date: "2026-08-07",
    item_name: "RVAT Testing Item",
    supplier_name: "Dummy Supplier Pvt Ltd",
    quantity: 10,
    quantity_unit: "BX",
    currency: "ZMW",
    invoice_amount: 1160,
    checker: "John Doe",
    checked_at: "2026-08-07 14:30:00",
    status: "Imported",
    status_code: "3",
  },
  {
    id: "2",
    declaration_no: "DEC-2026-0002",
    declaration_date: "2026-08-06",
    item_name: "Software Maintenance",
    supplier_name: "ABC Technologies",
    quantity: 5,
    quantity_unit: "EA",
    currency: "ZMW",
    invoice_amount: 522,
    checker: "Jane Smith",
    checked_at: "2026-08-06 11:45:00",
    status: "Rejected",
    status_code: "4",
  },
];

export async function fetchImportedPurchaseInvoices(): Promise<ImportedPurchaseInvoiceItemRaw[]> {
  if (USE_DUMMY_IMPORTED_PURCHASE_INVOICES) {
    return dummyImportedPurchaseInvoices;
  }

  const resp: AxiosResponse<ImportedPurchaseInvoicesApiResponse> = await api.get(
    PurchaseInvoiceImportsAPI.getImportedPurchaseInvoices
  );

  if (resp.data.status_code !== 200) {
    throw new Error(
      resp.data.message || "Imported purchase invoices request failed"
    );
  }

  return resp.data.data;
}