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


const api = createAxiosInstance(ERP_BASE);

export const PurchaseInvoiceImportsAPI = API.purchaseInvoiceImports;

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

type MappedItemsMap = Record<string, { itemCode: string } | undefined>;
type WarehousesMap = Record<string, string | undefined>;

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
  mapped_erp_item: string | null;
  mapped_erp_warehouse: string | null;
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

export function buildSaveSalesPayloads(
  items: ImportPurchaseInvoiceItem[],
  decisions: DecisionsMap,
  remarks: RemarksMap,
  mappedItems: MappedItemsMap = {},
  warehouses: WarehousesMap = {},
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
      mapped_erp_item: mappedItems[item.id]?.itemCode ?? null,
      mapped_erp_warehouse: warehouses[item.id] ?? null,
    };

    const existing = byInvoice.get(key);
    if (existing) {
      existing.itemList.push(itemPayload);
      existing.totItemCnt += 1;
      existing.totTaxblAmt += item.taxableAmount;
      existing.totTaxAmt += item.vatAmount;
      existing.totAmt += item.itemTotalAmount;
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
  remarks: RemarksMap,
  mappedItems: MappedItemsMap = {},
  warehouses: WarehousesMap = {},
): Promise<any[]> {
  const payloads = buildSaveSalesPayloads(items, decisions, remarks, mappedItems, warehouses);

  return Promise.all(
    payloads.map(async (payload) => {
      const resp = await api.post(SAVE_PURCHASE_SALES_ENDPOINT, payload);
      return resp.data;
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Imported purchase invoices (main list page)
// ─────────────────────────────────────────────────────────────────────────

export async function fetchImportedPurchaseInvoices(): Promise<
  ImportPurchaseInvoiceItemApiRaw[]
> {
  const resp: AxiosResponse = await api.get(
    PurchaseInvoiceImportsAPI.getImportedPurchaseInvoices
  );

  if (resp.data?.status_code !== 200) {
    throw new Error(
      resp.data?.message || "Imported purchase invoices request failed"
    );
  }

  const saleList = resp.data?.data?.saleList ?? [];

  return flattenSales(saleList);
}