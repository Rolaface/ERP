// ─── Stock Correction — Manual Correction Form ───────────────────────────────
// The "Manual Correction" tab body.
// Receives all state from the parent hook via props — zero internal state.

import React from "react";
import ItemSelect        from "../../../components/selects/ItemSelect";
import ItemGenericSelect from "../../../components/selects/ItemGenericSelect";
import { getUOMs }       from "../../../api/itemZraApi";
import { Button }        from "../../../components/ui/modal/formComponent";

import {
  FieldLabel,
  CellInput,
  SectionCard,
  CorrectionTypeToggle,
  VarianceBadge,
  UOMWrapper,
} from "./Stockcorrectionatoms";

import { CorrectionSidebar } from "./Correctionsidebar";
import { REASON_CODES, REASON_MAP, CORRECTION_TYPE_META } from "../../../types/Stockcorrection.constants";
import type { CorrectionFormState, CorrectionType } from "../../../types/Stockcorrection.types";

// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  form:          CorrectionFormState;
  setForm:       React.Dispatch<React.SetStateAction<CorrectionFormState>>;
  setField:      <K extends keyof CorrectionFormState>(name: K, value: CorrectionFormState[K]) => void;
  resetForm:     () => void;
  loading:       boolean;
  adjQty:        number;
  curQty:        number;
  newQty:        number;
  diff:          number;
  hasItem:       boolean;
  hasAdj:        boolean;
  isValid:       boolean;
  onSubmit:      (e: React.FormEvent) => void;
  onClose:       () => void;
}

export const ManualCorrectionForm: React.FC<Props> = ({
  form, setForm, setField, resetForm, loading,
  adjQty, curQty, newQty, diff, hasItem, hasAdj, isValid,
  onSubmit, onClose,
}) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0">

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex gap-5 items-start">

          {/* ── Main form area ──────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Step 1 — Item Selection */}
            <SectionCard step={1} title="Select Item">
              <div className="grid grid-cols-3 gap-4">

                {/* Item search */}
                <div className="flex flex-col gap-0.5">
                  <FieldLabel label="Item" required />
                  <ItemSelect
                    value={form.id}
                    onChange={(item) =>
                      setForm((prev) => ({
                        ...prev,
                        id:            item.id,
                        itemName:      item.itemName,
                        itemClassCode: item.itemCode,
                      }))
                    }
                  />
                </div>

                {/* Current stock — system value, read-only */}
                <div className="flex flex-col gap-0.5">
                  <FieldLabel label="Current Stock (System)" />
                  <div className="flex items-center h-9 rounded-lg border border-theme bg-app/60 px-3 gap-2">
                    {form.currentQty !== null ? (
                      <>
                        <span className="text-sm font-bold text-main tabular-nums">
                          {form.currentQty}
                        </span>
                        <span className="text-xs text-muted">units</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted/50 italic">
                        {hasItem ? "Loading…" : "Select item first"}
                      </span>
                    )}
                  </div>
                </div>

                {/* UOM */}
                <div className="flex flex-col gap-0.5">
                  <FieldLabel label= "Unit of Measure" />
                  <UOMWrapper>
                    <ItemGenericSelect
                      label=  "Unit of Measure"
                      fetchData={getUOMs}
                      value={form.unitOfMeasureCd || ""}
                      onChange={({ id }) => setField("unitOfMeasureCd", id as any)}
                      placeholder="Select UOM"
                      displayField="name"
                      variant="modal"
                    />
                  </UOMWrapper>
                </div>
              </div>
            </SectionCard>

            {/* Step 2 — Correction Details */}
            <SectionCard step={2} title="Correction Details">
              <div className="flex flex-col gap-4">

                {/* Correction type */}
                <div className="flex flex-col gap-1.5">
                  <FieldLabel label="Correction Type" required />
                  <CorrectionTypeToggle
                    value={form.correctionType}
                    onChange={(v) => setField("correctionType", v)}
                  />
                  <p className="text-[11px] text-muted">
                    {CORRECTION_TYPE_META[form.correctionType].description}
                  </p>
                </div>

                {/* Quantity + live variance row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel
                      label={form.correctionType === "set" ? "New (Physical) Quantity" : "Adjustment Quantity"}
                      required
                    />
                    <CellInput
                      type="number"
                      min={0}
                      step="1"
                      value={form.adjustmentQty}
                      onChange={(v) => setField("adjustmentQty", v as any)}
                      placeholder="0"
                    />
                  </div>

                  {hasItem && hasAdj && form.currentQty !== null && (
                    <div className="flex flex-col gap-1.5 justify-center">
                      <FieldLabel label="Stock After Correction" />
                      <div className="flex items-center h-9">
                        <VarianceBadge
                          current={curQty}
                          adjusted={adjQty}
                          type={form.correctionType}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason + Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel label="Reason for Correction" required />
                    <select
                      value={form.reason}
                      onChange={(e) => setField("reason", e.target.value as any)}
                      className="w-full h-9 rounded-lg border border-theme bg-card text-main text-sm px-3
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                        appearance-none cursor-pointer"
                    >
                      <option value="">Select reason…</option>
                      {REASON_CODES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel label="Notes / Remarks" />
                    <input
                      type="text"
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value as any)}
                      placeholder="Optional — add any extra context…"
                      className="w-full h-9 rounded-lg border border-theme bg-card text-main text-sm px-3
                        placeholder:text-muted/40
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <CorrectionSidebar
            form={form}
            newQty={newQty}
            diff={diff}
            hasItem={hasItem}
            hasAdj={hasAdj}
            curQty={curQty}
          />
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-t border-theme bg-app px-6 py-3 shrink-0">
        <span className="text-xs text-muted">
          {form.itemName
            ? `${form.itemName}${form.reason ? ` · ${REASON_MAP[form.reason]}` : ""}`
            : "No item selected"}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="danger"    type="button" onClick={resetForm}>Reset</Button>
          <Button
            variant="primary"
            loading={loading}
            type="submit"
            disabled={!isValid}
          >
            Apply Correction
          </Button>
        </div>
      </div>
    </form>
  );
};