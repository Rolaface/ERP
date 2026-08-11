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
  WarehouseMap,SuppliersMap,
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


const USE_MOCK_PENDING_DECLARATIONS = false;

const MOCK_PENDING_DECLARATIONS: ImportItemApiRaw[] = [
  {
    dclNo: "24ZM000123456",
    dclDe: "20240115",
    itemSeq: 1,
    itemNm: "Stainless Steel Bolts M8x40",
    hsCd: "7318159000",
    taskCd: "IM",
    imptItemsttsCd: "2",
    orgnNatCd: "CN",
    exptNatCd: "CN",
    qty: 5000,
    qtyUnitCd: "PCS",
    totWt: 250.5,
    netWt: 240,
    pkg: 10,
    pkgUnitCd: "CTN",
    agntNm: "Zamlink Clearing Agents",
    spplrNm: "Shenzhen Hardware Co. Ltd",
    invcFcurAmt: 1200.0,
    invcFcurCd: "USD",
    invcFcurExcrt: 26.35,
    dclRefNum: "REF-24-001123",
  },
  {
    dclNo: "24ZM000123456",
    dclDe: "20240115",
    itemSeq: 2,
    itemNm: "PVC Pipe Fittings 32mm",
    hsCd: "3917400000",
    taskCd: "IM",
    imptItemsttsCd: "2",
    orgnNatCd: "CN",
    exptNatCd: "CN",
    qty: 2000,
    qtyUnitCd: "PCS",
    totWt: 180,
    netWt: 172,
    pkg: 4,
    pkgUnitCd: "CTN",
    agntNm: "Zamlink Clearing Agents",
    spplrNm: "Shenzhen Hardware Co. Ltd",
    invcFcurAmt: 640.0,
    invcFcurCd: "USD",
    invcFcurExcrt: 26.35,
    dclRefNum: "REF-24-001123",
  },
  {
    dclNo: "24ZM000198765",
    dclDe: "20240202",
    itemSeq: 1,
    itemNm: "Cotton T-Shirts (Assorted)",
    hsCd: "6109100000",
    taskCd: "IM",
    imptItemsttsCd: "2",
    orgnNatCd: "IN",
    exptNatCd: "IN",
    qty: 1500,
    qtyUnitCd: "PCS",
    totWt: 450,
    netWt: 430,
    pkg: 30,
    pkgUnitCd: "BAG",
    agntNm: "Lusaka Freight Solutions",
    spplrNm: "Mumbai Textiles Pvt Ltd",
    invcFcurAmt: 4500.0,
    invcFcurCd: "USD",
    invcFcurExcrt: 26.4,
    dclRefNum: "REF-24-001987",
  },
  {
    dclNo: "24ZM000255111",
    dclDe: "20240310",
    itemSeq: 1,
    itemNm: "Laptop Batteries Li-ion 4400mAh",
    hsCd: "8507600000",
    taskCd: "IM",
    imptItemsttsCd: "2",
    orgnNatCd: "VN",
    exptNatCd: "SG",
    qty: 800,
    qtyUnitCd: "PCS",
    totWt: 320,
    netWt: 300,
    pkg: 16,
    pkgUnitCd: "CTN",
    agntNm: "Copperbelt Logistics",
    spplrNm: "Vietnam Power Cells Co.",
    invcFcurAmt: 9600.0,
    invcFcurCd: "USD",
    invcFcurExcrt: 26.28,
    dclRefNum: "REF-24-002551",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Pending declarations (process-import modal)
// ─────────────────────────────────────────────────────────────────────────

export async function fetchPendingImportDeclarations(): Promise<ImportDeclarationsApiResponse> {
  console.log("Fetching pending import declarations...", USE_MOCK_PENDING_DECLARATIONS ? "(using mock data)" : "");
  if (USE_MOCK_PENDING_DECLARATIONS) {
    // Simulated network delay so loading states are visible while testing
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      status_code: 200,
      message: "OK (mock data)",
      data: MOCK_PENDING_DECLARATIONS,
    } as ImportDeclarationsApiResponse;
  }

  const resp: AxiosResponse<ImportDeclarationsApiResponse> = await api.get(
    ImportsAPI.getPendingDeclarations
  );

  if (resp.data.status_code !== 200) {
    throw new Error((resp.data as any).message || "Import declarations request failed");
  }

  return resp.data;
}


function buildDeclarationPayloads(
  items: ImportItem[],
  decisions: DecisionsMap,
  remarks: RemarksMap,
  mappedItems: MappedItemsMap,
  warehouses: WarehouseMap,
  suppliers: SuppliersMap
): SubmitDeclarationPayload[] {
  const byDclNo = new Map<string, SubmitDeclarationPayload>();

  items.forEach((item) => {
    const decision = decisions[item.id];
    if (decision !== "approve" && decision !== "reject") return;

    const mapped = mappedItems[item.id];

    const itemPayload: SubmitImportItemPayload = {
      itemSeq: item.itemSeq, 
       itemNm: item.itemNm,         

      hsCd: item.hsCd,
      itemClsCd: mapped?.itemClassCode ?? "",
      itemCd: mapped?.itemCode ?? "",
      imptItemSttsCd: decision === "approve" ? "3" : "4",
      remark: remarks[item.id] ?? "",
      mapped_erp_item: mapped?.itemCode ?? "",
      mapped_erp_supplier: suppliers[item.id]?.id ?? "",
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
  warehouses: WarehouseMap,
    suppliers: SuppliersMap
): Promise<{ resultCd: string; resultMsg: string }[]> {
  const declarationPayloads = buildDeclarationPayloads(
    items,
    decisions,
    remarks,
    mappedItems,
    warehouses,
    suppliers

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