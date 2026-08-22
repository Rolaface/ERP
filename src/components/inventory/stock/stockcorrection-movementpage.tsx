// ─── Stock Correction / Movement — Page ──────────────────────────────────────
// Two checkboxes at top (mutually exclusive) switch the ENTIRE rows table:
//   • Stock Correction checked → Branch / Correction Qty / Batch No. / Expiry Date
//   • Stock Movement  checked → From / To / Move Quantity
// Everything else (product search, stock summary, footer) stays the same.

import React, { useMemo, useState } from "react";
import {
  ModalInput,
  ModalSelect,
  NumericInput,
} from "../../../components/ui/modal/modalComponent";

// ─── Local Button (no Button export exists in the atoms file) ────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "secondary";
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "secondary", loading = false, disabled, className = "", children, ...props
}) => {
  const variantClass =
    variant === "primary" ? "bg-primary text-white hover:opacity-90 disabled:opacity-40"
    : variant === "danger" ? "bg-danger text-white hover:opacity-90 disabled:opacity-40"
    : "bg-card border border-theme text-main hover:border-primary/40";

  return (
    <button {...props} disabled={disabled || loading} className={[
      "h-9 px-4 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-2 disabled:cursor-not-allowed",
      variantClass, className,
    ].join(" ")}>
      {loading && (
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// ─── Mode checkbox (small square, matches screenshot) ────────────────────────

const ModeCheckbox: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
    <span onClick={onChange} className={[
      "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
      checked ? "bg-primary border-primary" : "bg-card border-theme hover:border-primary/50",
    ].join(" ")}>
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
    <span className="text-sm font-medium text-main">{label}</span>
  </label>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "movement" | "correction";

interface BranchOption { label: string; value: string; }

interface StockSummaryRow {
  srNo: number; branch: string; quantity: number; uom: string; mrp: number; batchSerial: string;
}

interface CorrectionRow {
  id: string; branchId: string; correctionQty: string; batchNo: string; expiryDate: string;
}

interface MoveRow {
  id: string; from: string; to: string; qty: string;
}

const MOCK_BRANCH_OPTIONS: BranchOption[] = [
  { label: "Taxso Demo Company (MRP-0)", value: "branch-1" },
];

const makeEmptyCorrectionRow = (): CorrectionRow => ({
  id: crypto.randomUUID(), branchId: "", correctionQty: "", batchNo: "", expiryDate: "",
});

const makeEmptyMoveRow = (): MoveRow => ({
  id: crypto.randomUUID(), from: "", to: "", qty: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

export const StockCorrectionMovementPage: React.FC = () => {
  const [productQuery, setProductQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [summary] = useState<StockSummaryRow[]>([
    { srNo: 1, branch: "Taxso Demo Company", quantity: 5, uom: "NOS", mrp: 0, batchSerial: "–" },
  ]);

  const [mode, setMode] = useState<Mode>("correction");

  // Correction-mode state
  const [correctionRows, setCorrectionRows] = useState<CorrectionRow[]>([makeEmptyCorrectionRow()]);
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [correctionReason, setCorrectionReason] = useState("");

  // Movement-mode state
  const [moveRows, setMoveRows] = useState<MoveRow[]>([makeEmptyMoveRow()]);
  const [movementReason, setMovementReason] = useState("");

  const branchOptions = useMemo(() => MOCK_BRANCH_OPTIONS, []);
  const totalQuantity = useMemo(() => summary.reduce((s, r) => s + r.quantity, 0), [summary]);

  // ── Correction row helpers ────────────────────────────────────────────────
  const updateCorrectionRow = <K extends keyof CorrectionRow>(id: string, key: K, value: CorrectionRow[K]) =>
    setCorrectionRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addCorrectionRow = () => setCorrectionRows((prev) => [...prev, makeEmptyCorrectionRow()]);
  const removeCorrectionRow = (id: string) =>
    setCorrectionRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  // ── Movement row helpers ──────────────────────────────────────────────────
  const updateMoveRow = <K extends keyof MoveRow>(id: string, key: K, value: MoveRow[K]) =>
    setMoveRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addMoveRow = () => setMoveRows((prev) => [...prev, makeEmptyMoveRow()]);
  const removeMoveRow = (id: string) =>
    setMoveRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  // ── Validation ───────────────────────────────────────────────────────────
  const isValid =
    mode === "correction"
      ? correctionReason.trim() !== "" &&
        correctionRows.every((r) => r.branchId && r.correctionQty.trim() !== "" && !Number.isNaN(Number(r.correctionQty)))
      : movementReason.trim() !== "" &&
        moveRows.every((r) => r.from && r.to && r.from !== r.to && r.qty.trim() !== "" && !Number.isNaN(Number(r.qty)));

  // ── Actions (wire to your real API) ──────────────────────────────────────
  const handleSearch = async () => {
    if (!productQuery.trim()) return;
    setSearching(true);
    try {
      // TODO: real product/stock lookup
      await new Promise((res) => setTimeout(res, 400));
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setCorrectionRows([makeEmptyCorrectionRow()]);
    setCorrectionReason("");
    setCorrectionDate(new Date().toISOString().split("T")[0]);
    setMoveRows([makeEmptyMoveRow()]);
    setMovementReason("");
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const payload =
        mode === "correction"
          ? {
              mode,
              rows: correctionRows.map((r) => ({ ...r, correctionQty: Number(r.correctionQty) })),
              correctionDate,
              reason: correctionReason,
            }
          : {
              mode,
              rows: moveRows.map((r) => ({ ...r, qty: Number(r.qty) })),
              reason: movementReason,
            };
    
      await new Promise((res) => setTimeout(res, 400));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-app">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-theme">
        <div>
          <h1 className="text-lg font-bold text-main">Stock Correction/Movement</h1>
          <p className="text-xs text-muted mt-0.5">
            <span className="text-primary">Dashboard</span> / Stock Correction/Movement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" type="button" onClick={handleReset}>Reset</Button>
          <Button variant="primary" type="button" loading={saving} disabled={!isValid} onClick={handleSave}>Save</Button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="bg-card border border-theme rounded-xl shadow-sm p-6 flex flex-col gap-6">

          {/* Product search */}
          <div className="flex items-end gap-3">
            <div className="w-full max-w-md">
              <ModalInput
                label="Product"
                value={productQuery}
                placeholder="Search product name…"
                onChange={(e) => setProductQuery(e.target.value)}
                trailingIcon={
                  <button type="button" title="Refresh" onClick={() => setProductQuery("")} className="text-primary hover:opacity-70 transition-opacity">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-4.9M20 15a8 8 0 01-14 4.9" />
                    </svg>
                  </button>
                }
              />
            </div>
            <Button variant="primary" type="button" loading={searching} onClick={handleSearch}>Search</Button>
          </div>

          {/* Existing stock summary */}
          <div>
            <div className="flex justify-end mb-1">
              <span className="text-xs font-semibold text-primary">Total Quantity: {totalQuantity}</span>
            </div>
            <div className="border border-theme rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-app/60">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-main">Sr No.</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-main">Branch</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-main">Quantity</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-main">MRP</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-main">Batch/Serial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {summary.map((row) => (
                    <tr key={row.srNo}>
                      <td className="px-4 py-2.5 text-main">{row.srNo}</td>
                      <td className="px-4 py-2.5 text-main">{row.branch}</td>
                      <td className="px-4 py-2.5 text-main">{row.quantity} ({row.uom})</td>
                      <td className="px-4 py-2.5 text-main">₹ {row.mrp.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-muted">{row.batchSerial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mode toggle — order matches screenshot: Movement first, then Correction ── */}
          <div className="flex items-center gap-8">
            <ModeCheckbox label="Stock Movement" checked={mode === "movement"} onChange={() => setMode("movement")} />
            <ModeCheckbox label="Stock Correction" checked={mode === "correction"} onChange={() => setMode("correction")} />
          </div>

          {/* ═══════════════ DYNAMIC TABLE — swaps fully by mode ═══════════════ */}
          {mode === "correction" ? (
            <div className="flex flex-col gap-2">
              <div className="border border-theme rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-app/60">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[26%]">
                        Branch<span className="text-danger">*</span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[22%]">
                        Correction Qty (e.g.: 10, -15)<span className="text-danger">*</span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[20%]">Batch No.</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[20%]">Expiry Date</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[12%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {correctionRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 align-top">
                          <ModalSelect
                            label=""
                            value={row.branchId}
                            options={branchOptions}
                            placeholder="Select branch"
                            onChange={(e) => updateCorrectionRow(row.id, "branchId", e.target.value)}
                            className="w-full"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <NumericInput
                            name={`qty-${row.id}`}
                            value={row.correctionQty === "" ? null : Number(row.correctionQty)}
                            onChange={(v) => updateCorrectionRow(row.id, "correctionQty", v == null ? "" : String(v))}
                            placeholder="Enter Quantity"
                            decimalScale={0}
                            allowNegative
                            className="w-full h-9"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <ModalInput
                            label=""
                            value={row.batchNo}
                            placeholder="Enter Batch No."
                            onChange={(e) => updateCorrectionRow(row.id, "batchNo", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <ModalInput
                            label=""
                            type="date"
                            name={`expiry-${row.id}`}
                            value={row.expiryDate}
                            onChange={(e) => updateCorrectionRow(row.id, "expiryDate", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <button
                            type="button"
                            title="Remove row"
                            onClick={() => removeCorrectionRow(row.id)}
                            disabled={correctionRows.length === 1}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" d="M9 9l6 6M15 9l-6 6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addCorrectionRow} className="self-end text-xs font-semibold text-primary hover:underline">
                + Add Row
              </button>

              {/* Correction date + reason */}
              <div className="grid grid-cols-2 gap-4 max-w-2xl mt-2">
                <ModalInput
                  label="Correction Date"
                  required
                  type="date"
                  name="correctionDate"
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                />
                <ModalInput
                  label="Reason of Stock Correction"
                  required
                  value={correctionReason}
                  placeholder="Enter reason…"
                  onChange={(e) => setCorrectionReason(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="border border-theme rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-app/60">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[35%]">
                        From<span className="text-danger">*</span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[35%]">
                        To<span className="text-danger">*</span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[20%]">Move Quantity</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-main w-[10%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {moveRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 align-top">
                          <ModalSelect
                            label=""
                            value={row.from}
                            options={branchOptions}
                            placeholder="Select"
                            onChange={(e) => updateMoveRow(row.id, "from", e.target.value)}
                            className="w-full"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <ModalSelect
                            label=""
                            value={row.to}
                            options={branchOptions.filter((b) => b.value !== row.from)}
                            placeholder="Select"
                            onChange={(e) => updateMoveRow(row.id, "to", e.target.value)}
                            className="w-full"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <NumericInput
                            name={`move-qty-${row.id}`}
                            value={row.qty === "" ? null : Number(row.qty)}
                            onChange={(v) => updateMoveRow(row.id, "qty", v == null ? "" : String(v))}
                            placeholder="Enter Quantity"
                            decimalScale={0}
                            allowNegative={false}
                            className="w-full h-9"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <button
                            type="button"
                            title="Remove row"
                            onClick={() => removeMoveRow(row.id)}
                            disabled={moveRows.length === 1}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" d="M9 9l6 6M15 9l-6 6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addMoveRow} className="self-end text-xs font-semibold text-primary hover:underline">
                + Add More
              </button>

              {/* Reason of movement */}
              <div className="max-w-md mt-2">
                <ModalInput
                  label="Reason of Stock Movement"
                  required
                  value={movementReason}
                  placeholder="Enter reason…"
                  onChange={(e) => setMovementReason(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockCorrectionMovementPage;