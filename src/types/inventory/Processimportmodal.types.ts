// ─── Raw API shape (as returned by the customs/import-declarations endpoint) ──
// NOTE: the API returns a FLAT list of items (itemList), not grouped by
// declaration. taskCd, dclDe, hsCd etc. all live on the ITEM, not on a
// separate "declaration" object — there is no declaration-level record at
// all. Declarations are derived client-side by grouping items on dclNo.

export interface ImportItemApiRaw {
  taskCd: string;
  dclDe: string; // YYYYMMDD, e.g. "20231209"
  itemSeq: number;
  dclNo: string; // e.g. "C 80633-2023-KZU"
  hsCd: string;
  itemNm: string;
  imptItemsttsCd: string; // status code — meaning not yet confirmed, treat as opaque
  orgnNatCd: string;
  exptNatCd: string;
  pkg: number;
  pkgUnitCd: string;
  qty: number;
  qtyUnitCd: string;
  totWt: number;
  netWt: number;
  spplrNm: string | null; // observed as always null in sample data — do not rely on it in UI
  agntNm: string;
  invcFcurAmt: number;
  invcFcurCd: string;
  invcFcurExcrt: number;
  dclRefNum: string | null;
}

export interface ImportDeclarationsApiResponse {
  resultCd: string; // "000" = success
  status_code: number; // 200 = success
  resultMsg: string;
  resultDt: string; // YYYYMMDDHHmmss
  data: {
    itemList: ImportItemApiRaw[];
  };
}

// ─── UI-facing (derived) shapes ────────────────────────────────────────────────

export type DecisionType = "approve" | "reject" | null;

export interface DecisionsMap {
  [itemId: string]: DecisionType;
}

export interface RemarksMap {
  [itemId: string]: string;
}

export interface MappedItem {
  itemCode: string;
  itemClassCode: string;
}

export interface MappedItemsMap {
  [itemId: string]: MappedItem;
}

export interface MappedSupplier {
  id: string;
  name: string;
}
export type SuppliersMap = Record<string, MappedSupplier>;

// Per-item warehouse selection — keyed the same way as DecisionsMap/RemarksMap
// (by ImportItem.id), since target_warehouse is now chosen per row, not once
// for the whole modal.
export type WarehouseMap = Record<string, string>;

// ─── Submit payload shapes (confirmed backend format) ──────────────────────────
// Submitted per-declaration: one POST per dclNo group, each containing only
// the items that have a decision (approve/reject) — pending items are not sent.
// target_warehouse and the full item detail (origin/export country, qty,
// weights, supplier/agent, currency) now live on each item payload, not on
// the declaration wrapper — see confirmed sample payload.

export type SubmitStatusCode = "3" | "4"; // 3 = approve, 4 = reject

export interface SubmitImportItemPayload {
  itemSeq: number;
  hsCd: string;
  itemClsCd: string; // no source yet — sent as "" until a real value exists
  itemCd: string; // same value as mapped_erp_item in the confirmed sample
  imptItemSttsCd: SubmitStatusCode;
  remark: string;
  mapped_erp_item: string;
  target_warehouse: string; // moved from declaration level — chosen per item
  mapped_erp_supplier: string;
  orgnNatCd: string;
  exptNatCd: string;
  pkg: number;
  pkgUnitCd: string;
  qty: number;
  qtyUnitCd: string;
  totWt: number;
  netWt: number;
  spplrNm: string | null;
  agntNm: string;
  invcFcurAmt: number;
  invcFcurCd: string;
  invcFcurExcrt: number;
  dclRefNum: string | null;
}

export interface SubmitDeclarationPayload {
  taskCd: string;
  dclDe: string;
  dclNo: string;
  importItemList: SubmitImportItemPayload[];
}

export interface ImportItem {
  id: string; // synthetic key: `${dclNo}-${itemSeq}`
  dclNo: string;
  dclDe: string; // raw YYYYMMDD — format at render time, not here
  itemSeq: number;
  itemNm: string;
  hsCd: string;
  taskCd: string;
  statusCd: string; // raw imptItemsttsCd, meaning not yet confirmed
  orgnNatCd: string;
  exptNatCd: string;
  qty: number;
  qtyUnitCd: string;
  totWt: number;
  netWt: number;
  pkg: number;
  pkgUnitCd: string;
  agntNm: string;
  supplierNm: string | null; // raw spplrNm — often null in practice, still shown as "—"
  amount: number;
  currencyCd: string;
  exchangeRate: number;
  dclRefNum: string | null;
  mappedItemCode: string | null; // set once item-matching UI is wired to a real product lookup
}

export interface ImportItemsTotals {
  totalItems: number;
  totalWeight: number;
  totalPackages: number;
}