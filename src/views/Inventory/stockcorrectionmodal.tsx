import React from "react";
import { Wrench, ArrowRightLeft } from "lucide-react";

import { MinimizableModal } from "../../components/common/MinimizableModal";
import PaginatedRowsTable from "../../components/common/Paginatedrowstable";
import DatePickerInput from "../../components/calendar/DatePickerInput";

import {
  useStockCorrectionForm,
  CORRECTION_COLS,
  MOVEMENT_COLS,
  ROWS_PAGE_SIZE,
  REASON_OPTIONS,
} from "../../hooks/stock correction-movement/Usestockcorrectionform";
import type { StockCorrectionModalProps } from "../../hooks/stock correction-movement/Usestockcorrectionform";
import { SectionLabel, StockSummaryTable, SummaryRail } from "../../components/Stock-correction-movement/Summaryui";
import { CorrectionRowFields, ItemPicker, MovementRowFields, TransactionTypeToggle } from "../../components/Stock-correction-movement/Rowfields";

export type {
  StockCorrectionModalProps,
  StockCorrectionSubmitPayload,
} from "../../hooks/stock correction-movement/Usestockcorrectionform";

const StockCorrectionModal: React.FC<StockCorrectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedBatch,
  branchOptions,
}) => {
  const f = useStockCorrectionForm({
    isOpen,
    onClose,
    onSubmit,
    selectedBatch,
    branchOptions,
  });

  return (
    <MinimizableModal
      modalId={f.modalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Correction / Movement"
      subtitle={
        selectedBatch
          ? `Editing batch ${selectedBatch.batch_no ?? "-"}`
          : "Adjust inventory levels or transfer items between warehouses with full traceability and batch control."
      }
      icon={f.mode === "correction" ? Wrench : ArrowRightLeft}
      maxWidth="6xl"
      height="720px"
      footer={
        <>
          <button
            type="button"
            onClick={f.handleReset}
            disabled={f.saving}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold text-muted hover:text-main transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={f.handleSave}
            disabled={f.saving || !f.isValid}
            className="px-5 py-2 rounded-lg text-[12px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary,#1c3f6e)" }}
          >
            {f.saving ? "Saving..." : "Submit Transaction"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 h-full min-h-0 items-stretch">
        {/* ── LEFT: form ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 min-w-0 overflow-y-auto pr-1">
          {/* Posting Date + Item + Transaction Type — one row */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[150px] shrink-0">
              <DatePickerInput
                label="Posting Date"
                name="postingDate"
                required
                value={f.correctionDate}
                disableFuture
                onChange={(_, value) => f.setCorrectionDate(value)}
              />
            </div>

            <div className="flex-1 min-w-[220px] max-w-[380px]">
              <ItemPicker
                itemSelectResetKey={f.itemSelectResetKey}
                itemPrefillName={f.itemPrefillName}
                onItemPicked={f.handleItemPicked}
                onItemClear={f.handleItemClear}
              />
            </div>

            <div className="shrink-0">
              <TransactionTypeToggle mode={f.mode} onModeChange={f.setMode} />
            </div>
          </div>

          

          <StockSummaryTable rows={f.stockSummary} />

          <div>
            <SectionLabel>
              {f.mode === "correction"
                ? "Stock Adjustment Details"
                : "Movement Details"}
            </SectionLabel>

            <div className="mt-2">
              {f.mode === "correction" ? (
                <PaginatedRowsTable
                  columns={[
                    "Warehouse",
                    "Batch No.",
                    "Expiry Date",
                    "Available Stock",
                    "Correction Qty",
                    "",
                  ]}
                  gridTemplate={CORRECTION_COLS}
                  rows={f.correctionRows}
                  pageSize={ROWS_PAGE_SIZE}
                  onAddRow={f.addCorrectionRow}
                  addLabel="Add Row"
                  addRowVariant="solid"
                  renderRow={(row) => (
                    <CorrectionRowFields
                      row={row}
                      branchOptions={f.branchOptions}
                      batchOptionsForRow={f.getBatchOptionsForBranch(
                        row.branch,
                      )}
                      onChange={f.updateCorrectionRow}
                      onRemove={f.removeCorrectionRow}
                      removeDisabled={f.correctionRows.length === 1}
                    />
                  )}
                />
              ) : (
                <PaginatedRowsTable
                  columns={["From", "To", "Move Qty", ""]}
                  gridTemplate={MOVEMENT_COLS}
                  rows={f.movementRows}
                  pageSize={ROWS_PAGE_SIZE}
                  onAddRow={f.addMovementRow}
                  addLabel="Add Row"
                  addRowVariant="solid"
                  renderRow={(row) => (
                    <MovementRowFields
                      row={row}
                      branchOptions={f.branchOptions}
                      onChange={f.updateMovementRow}
                      onRemove={f.removeMovementRow}
                      removeDisabled={f.movementRows.length === 1}
                    />
                  )}
                />
              )}
            </div>

            {f.mode === "correction" ? (
              <div className="flex justify-end gap-2 mt-2 text-[12px]">
                <span className="text-muted">Total Correction Qty</span>
                <span
                  className="font-bold"
                  style={{ color: "var(--primary,#1c3f6e)" }}
                >
                  {f.netCorrectionQty > 0 ? "+" : ""}
                  {f.netCorrectionQty} {f.itemMeta.unit || "PCS"}
                </span>
              </div>
            ) : (
              <div className="flex justify-end gap-2 mt-2 text-[12px]">
                <span className="text-muted">Total Moved Qty</span>
                <span
                  className="font-bold"
                  style={{ color: "var(--primary,#1c3f6e)" }}
                >
                  {f.totalMovedQty} {f.itemMeta.unit || "PCS"}
                </span>
              </div>
            )}
          </div>

          <div>
            <SectionLabel>Reason / Remarks</SectionLabel>
            <textarea
              className="mt-2 w-full rounded-lg border border-theme bg-card px-3 py-2 text-[12px] text-main placeholder:text-muted focus:outline-none focus:ring-1"
              style={{ resize: "vertical" }}
              rows={2}
              placeholder="e.g. Annual Audit discrepancy, Physical stock adjustment, System correction, etc."
              value={f.reason}
              onChange={(e) => f.setReason(e.target.value)}
            />
          </div>
        </div>

        {/* ── RIGHT: summary rail ───────────────────────────────────────── */}
        <SummaryRail
          mode={f.mode}
          selectedItem={f.selectedItem}
          unit={f.itemMeta.unit}
          rowCount={
            f.mode === "correction"
              ? f.correctionRows.length
              : f.movementRows.length
          }
          currentTotalQty={f.currentTotalQty}
          netCorrectionQty={f.netCorrectionQty}
          totalMovedQty={f.totalMovedQty}
          projectedTotal={f.projectedTotal}
          heroValue={f.heroValue}
          heroIsNegative={f.heroIsNegative}
          movementExceedsStock={f.movementExceedsStock}
          reasonSummary={f.reasonSummary}
        />
      </div>
    </MinimizableModal>
  );
};

export default StockCorrectionModal;
