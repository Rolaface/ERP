import type {
  ImportDeclarationsApiResponse,
  ImportItem,
  ImportItemApiRaw,
  DecisionsMap,
  RemarksMap,
  MappedItemsMap,
  SubmitDeclarationPayload,
  SubmitImportItemPayload,
} from "../../types/inventory/Processimportmodal.types";
import type {
  ImportedDeclarationsApiResponse,
  ImportedDeclarationItemRaw,
} from "../../types/inventory/ImportedItem.types";

// TODO: confirm the real base path/endpoint with backend — placeholder for now.
const PENDING_DECLARATIONS_ENDPOINT = "/api/customs/pending-import-declarations";
const SUBMIT_DECISIONS_ENDPOINT = "/api/customs/import-declarations/decisions";
// TODO: confirm real endpoint with backend — placeholder for now.
const IMPORTED_DECLARATIONS_ENDPOINT = "/api/customs/imported-declarations";

// TODO: no source for this yet (not in the fetch payload, no warehouse
// picker in the UI) — hardcoded until there's a real place to get it from.
const TARGET_WAREHOUSE = "Main Warehouse";

// Flip to false once the real backend endpoint above is live — that's the
// only change needed here, nothing in the hook or UI depends on this flag.
const USE_MOCK_DATA = true;

const MOCK_ITEMS: ImportItemApiRaw[] = [
  {
    taskCd: "7969427",
    dclDe: "20231209",
    itemSeq: 15,
    dclNo: "C 82386-2023-KZU",
    hsCd: "21039000",
    itemNm: "VERI PERI VERI HOT AFRICAN SAUCE 250ML",
    imptItemsttsCd: "2",
    orgnNatCd: "ZA",
    exptNatCd: "ZA",
    pkg: 1,
    pkgUnitCd: "PK",
    qty: 100,
    qtyUnitCd: "GRO",
    totWt: 5.92,
    netWt: 5.92,
    spplrNm: null,
    agntNm: "PENTAGRAND CONSORTIUM LIMITED",
    invcFcurAmt: 13.8,
    invcFcurCd: "USD",
    invcFcurExcrt: 23.05,
    dclRefNum: null,
  },
  {
    taskCd: "7949193",
    dclDe: "20231209",
    itemSeq: 1,
    dclNo: "C 80633-2023-KZU",
    hsCd: "19021900",
    itemNm: "SPAGHETTI TOSCANA 1KG",
    imptItemsttsCd: "2",
    orgnNatCd: "LT",
    exptNatCd: "ZA",
    pkg: 1,
    pkgUnitCd: "PK",
    qty: 100,
    qtyUnitCd: "GRO",
    totWt: 76.2,
    netWt: 76.2,
    spplrNm: null,
    agntNm: "PENTAGRAND CONSORTIUM LIMITED",
    invcFcurAmt: 93.24,
    invcFcurCd: "USD",
    invcFcurExcrt: 23.05,
    dclRefNum: null,
  },
  {
    taskCd: "7101003",
    dclDe: "20231118",
    itemSeq: 3,
    dclNo: "C3458-2019-TZDL",
    hsCd: "48203000",
    itemNm: "LEVER ARCH FILE A4",
    imptItemsttsCd: "2",
    orgnNatCd: "CN",
    exptNatCd: "ZA",
    pkg: 5,
    pkgUnitCd: "PK",
    qty: 100,
    qtyUnitCd: "GRO",
    totWt: 30.8,
    netWt: 30.8,
    spplrNm: null,
    agntNm: "GLOBAL SUPPLIES ZM",
    invcFcurAmt: 86.8,
    invcFcurCd: "USD",
    invcFcurExcrt: 22.05,
    dclRefNum: null,
  },
];

function getMockResponse(): ImportDeclarationsApiResponse {
  return {
    resultCd: "000",
    resultMsg: "It is succeeded",
    resultDt: new Date().toISOString().replace(/\D/g, "").slice(0, 14),
    data: { itemList: MOCK_ITEMS },
  };
}

export async function fetchPendingImportDeclarations(): Promise<ImportDeclarationsApiResponse> {
  if (USE_MOCK_DATA) {
    return getMockResponse();
  }

  const response = await fetch(PENDING_DECLARATIONS_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Failed to fetch import declarations (${response.status})`);
  }

  const payload: ImportDeclarationsApiResponse = await response.json();

  if (payload.resultCd !== "000") {
    throw new Error(payload.resultMsg || "Import declarations request failed");
  }

  return payload;
}

// Groups the flat, decided items (approve/reject only — pending items are
// skipped) into one payload per declaration (dclNo), matching the confirmed
// backend shape. taskCd/dclDe come from the item since the fetch payload has
// no separate declaration-level record.
function buildDeclarationPayloads(
  items: ImportItem[],
  decisions: DecisionsMap,
  remarks: RemarksMap,
  mappedItems: MappedItemsMap
): SubmitDeclarationPayload[] {
  const byDclNo = new Map<string, SubmitDeclarationPayload>();

  items.forEach((item) => {
    const decision = decisions[item.id];
    if (decision !== "approve" && decision !== "reject") return; // skip pending

    const mappedCode = mappedItems[item.id] ?? "";

    const itemPayload: SubmitImportItemPayload = {
      itemSeq: item.itemSeq,
      hsCd: item.hsCd,
      itemClsCd: "", // TODO: no source yet
      itemCd: mappedCode,
      imptItemSttsCd: decision === "approve" ? "3" : "4",
      remark: remarks[item.id] ?? "",
      mapped_erp_item: mappedCode,
      qty: item.qty,
      qtyUnitCd: item.qtyUnitCd,
      invcFcurAmt: item.amount,
    };

    const existing = byDclNo.get(item.dclNo);
    if (existing) {
      existing.importItemList.push(itemPayload);
    } else {
      byDclNo.set(item.dclNo, {
        taskCd: item.taskCd,
        dclDe: item.dclDe,
        dclNo: item.dclNo,
        target_warehouse: TARGET_WAREHOUSE,
        importItemList: [itemPayload],
      });
    }
  });

  return Array.from(byDclNo.values());
}

export async function submitImportDecisions(
  items: ImportItem[],
  decisions: DecisionsMap,
  remarks: RemarksMap,
  mappedItems: MappedItemsMap
): Promise<{ resultCd: string; resultMsg: string }[]> {
  const declarationPayloads = buildDeclarationPayloads(items, decisions, remarks, mappedItems);
  console.log(
    "Submit Payload:",
    JSON.stringify(declarationPayloads, null, 2)
  );

  if (USE_MOCK_DATA) {
    return declarationPayloads.map(() => ({
      resultCd: "000",
      resultMsg: "Mock submit succeeded",
    }));
  }

  // One POST per declaration, matching the confirmed backend shape
  // (a single declaration object per request, not an array).
  return Promise.all(
    declarationPayloads.map(async (payload) => {
      const response = await fetch(SUBMIT_DECISIONS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to submit decisions for ${payload.dclNo} (${response.status})`
        );
      }

      return response.json();
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Already-processed/posted declarations (outer table) — separate endpoint,
// separate shape (checker, checked_at, final status already resolved by
// backend). Kept in this file alongside the pending-items API since both
// belong to the same import-declarations feature.
// ─────────────────────────────────────────────────────────────────────────

const MOCK_IMPORTED_ITEMS: ImportedDeclarationItemRaw[] = [
  {
    task_code: "7949193",
    declaration_no: "C 80633-2023-KZU",
    declaration_date: "2023-12-09",
    item_sequence: 1,
    hs_code: "19021900",
    item_name: "SPAGHETTI TOSCANA 1KG",
    origin_country: "LT",
    export_country: "ZA",
    quantity: 100.0,
    quantity_unit: "GRO",
    package_count: 1,
    package_unit: "PK",
    total_weight: 76.2,
    net_weight: 76.2,
    invoice_amount: 93.24,
    currency: "USD",
    exchange_rate: 23.05,
    base_invoice_amount: 2149.18,
    supplier_name: null,
    agent_name: "PENTAGRAND CONSORTIUM LIMITED",
    status: "Approved",
    status_code: "3",
    mapped_erp_item: "SPG-TOS-1KG",
    remarks: "Item mapped to local ERP successfully",
    checker: "mary.mukuka@example.com",
    checked_at: "2026-08-01 13:02:42",
  },
];
export async function fetchImportedDeclarations(): Promise<ImportedDeclarationsApiResponse> {
  if (USE_MOCK_DATA) {
    console.log("[fetchImportedDeclarations] MOCK response:", MOCK_IMPORTED_ITEMS);
    return MOCK_IMPORTED_ITEMS;
  }

  const response = await fetch(IMPORTED_DECLARATIONS_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Failed to fetch imported declarations (${response.status})`);
  }

  const payload: ImportedDeclarationsApiResponse = await response.json();
  console.log("[fetchImportedDeclarations] REAL API response:", payload);
  return payload;
}