import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type {
  ImportDeclarationsApiResponse,
  ImportItem,
  ImportItemApiRaw,
  DecisionsMap,
  RemarksMap,
  MappedItemsMap,
  WarehouseMap,
  SubmitDeclarationPayload,
  SubmitImportItemPayload,
} from "../../types/inventory/Processimportmodal.types";
import type {
  ImportedDeclarationsApiResponse,
  ImportedDeclarationItemRaw,
  ImportedDeclarationDetailApiResponse,
  ImportedDeclarationDetailRaw,
} from "../../types/inventory/ImportedItem.types";

const api = createAxiosInstance(ERP_BASE);

export const ImportsAPI = API.imports;

// TODO: remove once backend endpoint for pending declarations is confirmed stable.
const USE_MOCK_PENDING_DATA = false;

const MOCK_PENDING_ITEMS: ImportItemApiRaw[] = [
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

function getMockPendingResponse(): ImportDeclarationsApiResponse {
  return {
    resultCd: "000",
    resultMsg: "It is succeeded",
    resultDt: new Date().toISOString().replace(/\D/g, "").slice(0, 14),
    data: { itemList: MOCK_PENDING_ITEMS },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Pending declarations (process-import modal)
// ─────────────────────────────────────────────────────────────────────────

export async function fetchPendingImportDeclarations(): Promise<ImportDeclarationsApiResponse> {
  if (USE_MOCK_PENDING_DATA) {
    console.log("[fetchPendingImportDeclarations] MOCK response injected");
    return getMockPendingResponse();
  }

  const resp: AxiosResponse<ImportDeclarationsApiResponse> = await api.get(
    ImportsAPI.getPendingDeclarations
  );
  console.log("🚀 ~ fetchPendingImportDeclarations ~ resp:", resp);

  // Updated to check for the numeric 200
  if (resp.data.status_code !== 200) {
    // Updated to use the 'message' field from the response
    throw new Error((resp.data as any).message || "Import declarations request failed");
  }

  return resp.data;
}

// target_warehouse and the rest of the item's customs detail now live on
// each item payload (see confirmed sample), not on the declaration wrapper —
// so this needs a per-item WarehouseMap instead of one global warehouse.
function buildDeclarationPayloads(
  items: ImportItem[],
  decisions: DecisionsMap,
  remarks: RemarksMap,
  mappedItems: MappedItemsMap,
  warehouses: WarehouseMap
): SubmitDeclarationPayload[] {
  const byDclNo = new Map<string, SubmitDeclarationPayload>();

  items.forEach((item) => {
    const decision = decisions[item.id];
    if (decision !== "approve" && decision !== "reject") return;

    const mapped = mappedItems[item.id];

    const itemPayload: SubmitImportItemPayload = {
      itemSeq: item.itemSeq,
      hsCd: item.hsCd,
      itemClsCd: mapped?.itemClassCode ?? "",
      itemCd: mapped?.itemCode ?? "",
      imptItemSttsCd: decision === "approve" ? "3" : "4",
      remark: remarks[item.id] ?? "",
      mapped_erp_item: mapped?.itemCode ?? "",
      target_warehouse: warehouses[item.id] ?? "",
      orgnNatCd: item.orgnNatCd,
      exptNatCd: item.exptNatCd,
      pkg: item.pkg,
      pkgUnitCd: item.pkgUnitCd,
      qty: item.qty,
      qtyUnitCd: item.qtyUnitCd,
      totWt: item.totWt,
      netWt: item.netWt,
      spplrNm: item.supplierNm,
      agntNm: item.agntNm,
      invcFcurAmt: item.amount,
      invcFcurCd: item.currencyCd,
      invcFcurExcrt: item.exchangeRate,
      dclRefNum: item.dclRefNum,
    };

    const existing = byDclNo.get(item.dclNo);
    if (existing) {
      existing.importItemList.push(itemPayload);
    } else {
      byDclNo.set(item.dclNo, {
        taskCd: item.taskCd,
        dclDe: item.dclDe,
        dclNo: item.dclNo,
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
  mappedItems: MappedItemsMap,
  warehouses: WarehouseMap
): Promise<{ resultCd: string; resultMsg: string }[]> {
  const declarationPayloads = buildDeclarationPayloads(
    items,
    decisions,
    remarks,
    mappedItems,
    warehouses
  );

  // One POST per declaration, matching the confirmed backend shape
  // (a single declaration object per request, not an array).
  return Promise.all(
    declarationPayloads.map(async (payload) => {
      const resp: AxiosResponse<{ resultCd: string; resultMsg: string }> = await api.post(
        ImportsAPI.submitDecisions,
        payload
      );
      return resp.data;
    })
  );
}

export async function fetchImportedDeclarations(): Promise<ImportedDeclarationItemRaw[]> {
  const resp: AxiosResponse<ImportedDeclarationsApiResponse> = await api.get(
    ImportsAPI.getImportedDeclarations
  );

  if (resp.data.status_code !== 200) {
    throw new Error(resp.data.message || "Import declarations request failed");
  }

  return resp.data.data;
}

export async function fetchImportedDeclarationDetail(
  id: string
): Promise<ImportedDeclarationDetailRaw> {
  const resp: AxiosResponse<ImportedDeclarationDetailApiResponse> = await api.get(
    ImportsAPI.getImportedDeclarationById,
    { params: { id } }
  );

  if (resp.data.message.status_code !== 200) {
    throw new Error(resp.data.message.message || "Declaration detail request failed");
  }

  return resp.data.message.data;
}