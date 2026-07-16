import type { StockCorrectionSubmitPayload } from "../hooks/stock correction-movement/Usestockcorrectionform";

export const buildCorrectionPayload = (
  payload: StockCorrectionSubmitPayload,
) => ({
  warehouse: payload.correctionRows?.[0]?.branch,
  posting_date: payload.date,
  posting_time: new Date().toLocaleTimeString("en-GB", {
    hour12: false,
  }),
  items: (payload.correctionRows ?? []).map((row) => ({
    item_code: payload.item!.value,
    qty: Number(row.qty),
     batch_no: row.batchNo, 
    // valuation_rate: row.valuation_rate ?? null,
  })),
});