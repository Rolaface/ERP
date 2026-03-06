// ─── Stock Correction Modal — Orchestrator ────────────────────────────────────
//
//  FILE STRUCTURE OF THIS FEATURE MODULE
//  ──────────────────────────────────────
//  StockCorrectionModal.tsx          ← you are here (thin shell / wiring)
//  types/
//    stockCorrection.types.ts        ← all TypeScript interfaces & enums
//  constants/
//    stockCorrection.constants.ts    ← reason codes, CSV defs, toggle meta
//  hooks/
//    useStockCorrection.ts           ← ALL business logic, state, API calls
//  components/
//    StockCorrectionAtoms.tsx        ← reusable UI primitives (FieldLabel, CellInput, …)
//    ManualCorrectionForm.tsx        ← "Manual Correction" tab body
//    CorrectionSidebar.tsx           ← right-hand summary / audit panel
//    BulkUploadZone.tsx              ← drag-drop upload, CSV parser, preview table
//
//  Adding a new feature?
//    • New field type  → StockCorrectionAtoms.tsx
//    • New business rule → useStockCorrection.ts
//    • New tab         → add component + new ActiveTab value in types
//    • New reason code → stockCorrection.constants.ts only
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import Modal from "../../ui/modal/modal";

import { useStockCorrection }    from "./../../../types/Usestockcorrection";
import { ManualCorrectionForm }  from "./Manualcorrectionform";
import { BulkUploadZone }        from "./Bulkuploadzone";

// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onSubmit?: () => void;
}

const StockCorrectionModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const correction = useStockCorrection(isOpen, onSubmit, onClose);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={correction.handleClose}
      title="Stock Correction"
      subtitle="Adjust existing stock quantities with full audit trail"
      maxWidth="6xl"
      height="90vh"
    >
      <div className="h-full flex flex-col bg-app">

        {/* ── Tab bar ───────────────────────────────────────────────────────── */}
        <div className="bg-app border-b border-theme px-6 shrink-0 flex items-center justify-between">
          <div className="flex">
            {(["manual", "bulk"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => correction.setActiveTab(tab)}
                className={[
                  "py-3 px-1 mr-6 bg-transparent border-none text-xs font-semibold tracking-wide",
                  "border-b-2 transition-colors duration-150",
                  correction.activeTab === tab
                    ? "text-primary border-primary"
                    : "text-muted border-transparent hover:text-main",
                ].join(" ")}
              >
                {tab === "manual" ? "Manual Correction" : "Bulk Upload"}
              </button>
            ))}
          </div>

          {/* Audit notice pill */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            All corrections are logged with timestamp &amp; user
          </div>
        </div>

        {/* ── Tab content ───────────────────────────────────────────────────── */}
        {correction.activeTab === "manual" ? (
          <ManualCorrectionForm
            form           ={correction.form}
            setForm        ={correction.setForm}
            setField       ={correction.setField}
            resetForm      ={correction.resetForm}
            loading        ={correction.loading}
            adjQty         ={correction.adjQty}
            curQty         ={correction.curQty}
            newQty         ={correction.newQty}
            diff           ={correction.diff}
            hasItem        ={correction.hasItem}
            hasAdj         ={correction.hasAdj}
            isValid        ={correction.isValid}
            onSubmit       ={correction.handleManualSubmit}
            onClose        ={correction.handleClose}
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 px-6 py-5">
            <BulkUploadZone
              rows         ={correction.bulkRows}
              onRowsChange ={correction.setBulkRows}
              onSubmit     ={correction.handleBulkSubmit}
              loading      ={correction.bulkLoading}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StockCorrectionModal;