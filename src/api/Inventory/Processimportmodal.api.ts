import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type {
  ImportDeclarationsApiResponse,
  ImportItem,
  DecisionsMap,
  RemarksMap,
  MappedItemsMap,
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


const TARGET_WAREHOUSE = "Main Warehouse";

// ─────────────────────────────────────────────────────────────────────────
// Pending declarations (process-import modal)
// ─────────────────────────────────────────────────────────────────────────

export async function fetchPendingImportDeclarations(): Promise<ImportDeclarationsApiResponse> {
  const resp: AxiosResponse<ImportDeclarationsApiResponse> = await api.get(
    ImportsAPI.getPendingDeclarations
  );

  if (resp.data.resultCd !== "000") {
    throw new Error(resp.data.resultMsg || "Import declarations request failed");
  }

  return resp.data;
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

  return resp.data.data; // ← unwrap here, hook keeps getting a flat array
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