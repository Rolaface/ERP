import type { StockCorrectionSubmitPayload } from "../hooks/stock correction-movement/Usestockcorrectionform";

export const buildCorrectionPayload = (
  payload: StockCorrectionSubmitPayload,
) => {
  if (payload.mode === "movement") {
    return {
      stock_entry_type: payload.stockEntryType,
      posting_date: payload.date,
      items: (payload.movementRows ?? []).map((row) => ({
        item_code: payload.item!.value,
        qty: Number(row.qty),
        source_warehouse: row.from,
        ...(payload.stockEntryType === "Material Transfer"
          ? { target_warehouse: row.to }
          : {}),
        batch_no: row.batchNo,
      })),
    };
  }

  // Opening Stock — separate shape: purpose flag at top, no posting_time/
  // top-level warehouse/is_opening_stock, warehouse moves inside each item.
  if (payload.isOpeningStock) {
    return {
      purpose: "Opening Stock",
      posting_date: payload.date,
      items: (payload.correctionRows ?? []).map((row) => ({
        item_code: payload.item!.value,
        qty: Number(row.qty),
        valuation_rate: row.valuationRate,
        warehouse: row.branch,
        batch_no: row.batchNo,
      })),
    };
  }

  // Regular stock correction
  return {
    warehouse: payload.correctionRows?.[0]?.branch,
    posting_date: payload.date,
    posting_time: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
    }),
    is_opening_stock: 0,
    items: (payload.correctionRows ?? []).map((row) => ({
      item_code: payload.item!.value,
      qty: Number(row.qty),
      batch_no: row.batchNo,
    })),
  };
};