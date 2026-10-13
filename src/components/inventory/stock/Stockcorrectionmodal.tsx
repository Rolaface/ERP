import React from "react";

import { MinimizableModal } from "../../common/MinimizableModal";
import DatePickerInput from "../../calendar/DatePickerInput";

import {
  useStockCorrectionForm,
  CORRECTION_COLS,
  MOVEMENT_COLS,
  CONSUME_COLS,
  PRODUCE_COLS,
} from "../../../hooks/stock correction-movement/Usestockcorrectionform";
import type { StockCorrectionModalProps } from "../../../hooks/stock correction-movement/Usestockcorrectionform";
import {
  FieldLabel,
  GhostButton,
  ScmTable,
  SectionHeader,
  SummaryRail,
} from "../../Stock-correction-movement/Summaryui";
import {
  CorrectionRowFields,
  ItemPicker,
  MovementRowFields,
  ConsumeRowFields,
  ProduceRowFields,
  TransactionTypeSelect,
  StockEntryTypeToggle,
  MODE_META,
} from "../../Stock-correction-movement/Rowfields";

export type {
  StockCorrectionModalProps,
  StockCorrectionSubmitPayload,
} from "../../../hooks/stock correction-movement/Usestockcorrectionform";

const NEED_ITEM = (
  <>
    <b className="block text-main mb-0.5">Choose an item to get started</b>
    Its warehouse, batch and available stock will appear here.
  </>
);

// `isViewMode` is intentionally kept as a local prop (intersected here, not added
// to the shared StockCorrectionModalProps type) so read-only rendering doesn't
// require touching the hook/types file. When true: fields are visually + functionally
// disabled (pointer-events off) and the footer shows only a "Close" button.
const StockCorrectionModal: React.FC<
  StockCorrectionModalProps & { isViewMode?: boolean }
> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedBatch,
  branchOptions,
  modalId,
  isViewMode = false,
}) => {
  const f = useStockCorrectionForm({
    isOpen,
    onClose,
    onSubmit,
    selectedBatch,
    branchOptions,
  });

  const resolvedModalId = modalId ?? f.modalId;
  const isIssue = f.stockEntryType === "Material Issue";

  const submitLabel =
    f.mode === "correction"
      ? "Post correction"
      : f.mode === "manufacture"
        ? "Post production"
        : isIssue
          ? "Post issue"
          : "Post transfer";

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewMode ? "Batch Correction — View" : "Stock Correction / Movement"
      }
      subtitle={
        selectedBatch
          ? `${isViewMode ? "Viewing" : "Editing"} batch ${selectedBatch.batch_no ?? "-"}`
          : MODE_META[f.mode].headline
      }
      icon={MODE_META[f.mode].icon}
      maxWidth="5xl"
      height="580px"
      footer={
        isViewMode ? (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto h-[34px] px-4 rounded-lg text-[12px] font-bold text-white bg-primary transition-all hover:brightness-110"
          >
            Close
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={f.handleReset}
              disabled={f.saving}
              className="h-[34px] px-4 rounded-lg text-[12px] font-bold text-muted hover:text-main hover:bg-[var(--border)] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={f.handleSave}
              disabled={f.saving || !f.isValid}
              className="h-[34px] px-4 rounded-lg text-[12px] font-bold text-white bg-primary transition-all enabled:hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {f.saving ? "Saving..." : submitLabel}
            </button>
          </div>
        )
      }
    >
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_236px] gap-4 h-full min-h-0 items-stretch"
        style={
          isViewMode
            ? { pointerEvents: "none", opacity: 0.75, userSelect: "none" }
            : undefined
        }
      >
        {/* ── LEFT: form ─────────────────────────────────────────────── */}
        <div className="flex flex-col min-w-0 overflow-y-auto pr-1">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2.5 mb-3.5">
            <TransactionTypeSelect mode={f.mode} onModeChange={f.setMode} />

            {f.mode === "movement" && (
              <div className="shrink-0">
                <StockEntryTypeToggle
                  stockEntryType={f.stockEntryType}
                  onChange={f.setStockEntryType}
                />
              </div>
            )}

            <div className="w-[120px] shrink-0">
              <DatePickerInput
                label="Posting Date"
                name="postingDate"
                required
                value={f.correctionDate}
                disableFuture
                onChange={(_, value) => f.setCorrectionDate(value)}
              />
            </div>

            {f.mode !== "manufacture" && (
              <div className="flex-1 min-w-[200px]">
                <ItemPicker
                  mode={f.mode}
                  selectedItem={f.selectedItem}
                  onItemPicked={f.handleItemPicked}
                  onItemClear={f.handleItemClear}
                />
              </div>
            )}

            {f.mode === "correction" && (
              <label className="flex items-center gap-1.5 h-[28px] text-[12px] font-semibold text-main cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={f.isOpeningStock}
                  onChange={(e) => f.setIsOpeningStock(e.target.checked)}
                  className="h-4 w-4 m-0 rounded accent-[var(--primary)]"
                />
                Opening Stock
              </label>
            )}
          </div>

          {f.mode === "correction" && (
            <>
              <SectionHeader title="Stock adjustment" />
              <ScmTable
                columns={[
                  { label: "Warehouse" },
                  { label: "Batch" },
                  { label: "Expiry" },
                  { label: "Available", align: "right" },
                  { label: "Rate", align: "right" },
                  { label: "Adjustment", align: "right" },
                  { label: "Updated", align: "right" },
                ]}
                gridTemplate={CORRECTION_COLS}
                rows={f.correctionRows}
                empty={!f.selectedItem ? NEED_ITEM : undefined}
                renderRow={(row) => (
                  <CorrectionRowFields
                    row={row}
                    isOpeningStock={f.isOpeningStock}
                    onChange={f.updateCorrectionRow}
                  />
                )}
              />
            </>
          )}

          {f.mode === "movement" && (
            <>
              <SectionHeader title={isIssue ? "Issue lines" : "Transfer lines"} />
              <ScmTable
                columns={[
                  { label: "From" },
                  { label: "Batch" },
                  { label: "To" },
                  { label: "Qty", align: "right" },
                  { label: "Available", align: "right" },
                  { label: "" },
                ]}
                gridTemplate={MOVEMENT_COLS}
                rows={f.movementRows}
                empty={!f.selectedItem ? NEED_ITEM : undefined}
                renderRow={(row) => (
                  <MovementRowFields
                    row={row}
                    stockEntryType={f.stockEntryType}
                    batchNo={f.stockSummary[0]?.batchNo}
                    availableQty={f.selectedItem ? f.currentTotalQty : null}
                    onChange={f.updateMovementRow}
                    onRemove={f.removeMovementRow}
                    removeDisabled={f.movementRows.length === 1}
                  />
                )}
              />
            </>
          )}

          {f.mode === "manufacture" && (
            <>
              <SectionHeader
                title="Raw materials consumed"
                action={<GhostButton onClick={f.addConsumeRow}>Add material</GhostButton>}
              />
              <ScmTable
                columns={[
                  { label: "Item" },
                  { label: "Warehouse" },
                  { label: "Batch" },
                  { label: "Available", align: "right" },
                  { label: "Consume", align: "right" },
                  { label: "" },
                ]}
                gridTemplate={CONSUME_COLS}
                rows={f.consumeRows}
                renderRow={(row) => (
                  <ConsumeRowFields
                    row={row}
                    onItemPicked={f.pickConsumeItem}
                    onItemClear={f.clearConsumeItem}
                    onQtyChange={f.updateConsumeQty}
                    onRemove={f.removeConsumeRow}
                    removeDisabled={f.consumeRows.length === 1}
                  />
                )}
              />

              <SectionHeader title="Finished product produced" />
              <ScmTable
                columns={[
                  { label: "Item" },
                  { label: "Target warehouse" },
                  { label: "Produce qty", align: "right" },
                ]}
                gridTemplate={PRODUCE_COLS}
                rows={[f.produceRow]}
                renderRow={(row) => (
                  <ProduceRowFields
                    row={row}
                    onItemPicked={f.pickProduceItem}
                    onChange={f.updateProduceRow}
                  />
                )}
              />
            </>
          )}

          <div>
            <FieldLabel>Reason / Remarks</FieldLabel>
            <textarea
              className="block w-full min-h-[56px] rounded-lg border border-theme bg-card px-2.5 py-2 text-[12px] leading-[1.45] text-main placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              style={{ resize: "vertical" }}
              rows={2}
              placeholder="e.g. Annual audit discrepancy, physical count adjustment"
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
          postingDate={f.correctionDate}
          currentTotalQty={f.currentTotalQty}
          netCorrectionQty={f.netCorrectionQty}
          totalMovedQty={f.totalMovedQty}
          heroValue={f.heroValue}
          heroIsNegative={f.heroIsNegative}
          movementExceedsStock={f.movementExceedsStock}
          isIssue={isIssue}
          fromLabel={
            f.branchOptions.find((b) => b.value === f.movementRows[0]?.from)
              ?.label ?? f.movementRows[0]?.from
          }
          toLabel={
            isIssue
              ? undefined
              : f.branchOptions.find((b) => b.value === f.movementRows[0]?.to)
                  ?.label ?? f.movementRows[0]?.to
          }
          warehouseLabel={
            f.visibleStockSummary[0]?.branchLabel ?? f.correctionRows[0]?.branch
          }
          batchNo={f.visibleStockSummary[0]?.batchNo ?? f.correctionRows[0]?.batchNo}
          expiryDate={
            f.visibleStockSummary[0]?.expiryDate ?? f.correctionRows[0]?.expiryDate
          }
          batchAvailableQty={
            f.visibleStockSummary[0]?.availableQty ??
            f.correctionRows[0]?.availableQty ??
            undefined
          }
          consumeRows={f.consumeRows}
          produceRow={f.produceRow}
          totalConsumedQty={f.totalConsumedQty}
          valuationRate={
            f.isOpeningStock
              ? f.correctionRows[0]?.valuationRate ?? undefined
              : f.visibleStockSummary[0]?.valuationRate
          }
        />
      </div>
    </MinimizableModal>
  );
};

export default StockCorrectionModal;
