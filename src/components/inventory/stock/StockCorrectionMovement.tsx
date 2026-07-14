// ─── Stock Correction / Movement — Page ──────────────────────────────────────
// Rebuilt on top of the shared form atoms (ModalInput, ModalSelect, NumericInput)
// so it matches every other screen in the app instead of hand-rolled inputs.
//
// Structure:
//   1. Product search bar
//   2. Existing stock summary table (per branch)
//   3. Mode switch: Stock Movement vs Stock Correction (mutually exclusive)
//   4. Correction rows — dynamic, add/remove, one row per branch/batch
//   5. Correction date + reason
//
// Zero business logic lives here beyond simple row add/remove — wire the
// TODO-marked handlers (search, save, reset) to your actual API/hook.

import React, { useCallback, useMemo, useState } from "react";
// ⚠️ IMPORTANT: point this at the ONE file where ModalInput / ModalSelect /
// NumericInput actually live in your project (the file you shared earlier
// with ModalSelect, ModalInput, NumericInput, ToggleSwitch, etc. all in it).
// Using two different paths for atoms that live in the same file — or
// importing a `Button` that isn't exported anywhere — is exactly what makes
// the page fail to load/compile. There is no `Button` in your shared atoms
// file, so one is defined locally below instead of importing a broken path.
import {
  ModalInput,
  ModalSelect,
  NumericInput,
} from "../../../components/ui/modal/modalComponent";

// ─── Local Button ─────────────────────────────────────────────────────────────
// Not present in the shared atoms file — kept local, matching the same
// design tokens (bg-primary / bg-danger / border-theme) used everywhere else.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "secondary";
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const variantClass =
    variant === "primary"
      ? "bg-primary text-white hover:opacity-90 disabled:opacity-40"
      : variant === "danger"
        ? "bg-danger text-white hover:opacity-90 disabled:opacity-40"
        : "bg-card border border-theme text-main hover:border-primary/40";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "h-9 px-4 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-2",
        "disabled:cursor-not-allowed",
        variantClass,
        className,
      ].join(" ")}
    >
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchOption {
  label: string;
  value: string;
}

interface StockSummaryRow {
  srNo: number;
  branch: string;
  quantity: number;
  uom: string;
  mrp: number;
  batchSerial: string;
}

interface CorrectionRow {
  id: string; // stable key for React + removal, independent of array index
  branchId: string;
  correctionQty: string; // kept as string while typing; parse on submit
  batchNo: string;
  expiryDate: string; // yyyy-mm-dd (native <input type="date"> format)
}

type Mode = "movement" | "correction";

// ─── Small local atom: checkbox that reads like the screenshot ───────────────
// (Your ToggleSwitch atom is a pill switch — visually different from the plain
// square checkbox + label pattern used here, so this stays a tiny local piece
// rather than being forced into an atom that doesn't match the design.)

const ModeCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
    <span
      onClick={onChange}
      className={[
        "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
        checked ? "bg-primary border-primary" : "bg-card border-theme hover:border-primary/50",
      ].join(" ")}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
    <span className="text-sm font-medium text-main">{label}</span>
  </label>
);

// ─── Mock data — replace with real fetch results ─────────────────────────────

const MOCK_BRANCH_OPTIONS: BranchOption[] = [
  { label: "Taxso Demo Company (MRP-0)", value: "branch-1" },
];

const makeEmptyRow = (): CorrectionRow => ({
  id: crypto.randomUUID(),
  branchId: "",
  correctionQty: "",
  batchNo: "",
  expiryDate: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

export const StockCorrectionMovementPage: React.FC = () => {
  const [productQuery, setProductQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState<StockSummaryRow[]>([
    { srNo: 1, branch: "Taxso Demo Company", quantity: 5, uom: "NOS", mrp: 0, batchSerial: "–" },
  ]);

  const [mode, setMode] = useState<Mode>("correction");
  const [rows, setRows] = useState<CorrectionRow[]>([makeEmptyRow()]);
  const [correctionDate, setCorrectionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState("");

  const totalQuantity = useMemo(
    () => summary.reduce((sum, r) => sum + r.quantity, 0),
    [summary],
  );

  const branchOptions = useMemo(() => MOCK_BRANCH_OPTIONS, []);

  // ── Row helpers ──────────────────────────────────────────────────────────
  const updateRow = useCallback(
    <K extends keyof CorrectionRow>(id: string, key: K, value: CorrectionRow[K]) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    },
    [],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, makeEmptyRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ── Validation ───────────────────────────────────────────────────────────
  const isValid =
    reason.trim().length > 0 &&
    rows.every((r) => r.branchId && r.correctionQty.trim() !== "" && !Number.isNaN(Number(r.correctionQty)));

  // ── Actions (wire these to your real API) ───────────────────────────────
  const handleSearch = async () => {
    if (!productQuery.trim()) return;
    setSearching(true);
    try {
      // TODO: replace with actual product/stock lookup
      await new Promise((res) => setTimeout(res, 400));
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setProductQuery("");
    setRows([makeEmptyRow()]);
    setReason("");
    setCorrectionDate(new Date().toISOString().split("T")[0]);
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const payload = {
        mode,
        rows: rows.map((r) => ({ ...r, correctionQty: Number(r.correctionQty) })),
        correctionDate,
        reason,
      };
      // TODO: replace with actual save call
      console.log("Saving stock correction:", payload);
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
          <Button variant="danger" type="button" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="primary" type="button" loading={saving} disabled={!isValid} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      {/* ── Body card ────────────────────────────────────────────────────── */}
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
                  <button
                    type="button"
                    title="Refresh"
                    onClick={() => setProductQuery("")}
                    className="text-primary hover:opacity-70 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-4.9M20 15a8 8 0 01-14 4.9" />
                    </svg>
                  </button>
                }
              />
            </div>
            <Button variant="primary" type="button" loading={searching} onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Existing stock summary */}
          <div>
            <div className="flex justify-end mb-1">
              <span className="text-xs font-semibold text-primary">
                Total Quantity: {totalQuantity}
              </span>
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
                      <td className="px-4 py-2.5 text-main">
                        {row.quantity} ({row.uom})
                      </td>
                      <td className="px-4 py-2.5 text-main">₹ {row.mrp.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-muted">{row.batchSerial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mode selection */}
          <div className="flex items-center gap-8">
            <ModeCheckbox
              label="Stock Movement"
              checked={mode === "movement"}
              onChange={() => setMode("movement")}
            />
            <ModeCheckbox
              label="Stock Correction"
              checked={mode === "correction"}
              onChange={() => setMode("correction")}
            />
          </div>

          {/* Correction rows */}
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
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 align-top">
                      <ModalSelect
                        label=""
                        aria-label="Branch"
                        value={row.branchId}
                        options={branchOptions}
                        placeholder="Select branch"
                        onChange={(e) => updateRow(row.id, "branchId", e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <NumericInput
                        name={`qty-${row.id}`}
                        value={row.correctionQty === "" ? null : Number(row.correctionQty)}
                        onChange={(v) => updateRow(row.id, "correctionQty", v == null ? "" : String(v))}
                        placeholder="Enter Quantity"
                        decimalScale={0}
                        allowNegative
                        className="w-full h-9"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <ModalInput
                        label=""
                        aria-label="Batch No."
                        value={row.batchNo}
                        placeholder="Enter Batch No."
                        onChange={(e) => updateRow(row.id, "batchNo", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <ModalInput
                        label=""
                        aria-label="Expiry Date"
                        type="date"
                        name={`expiry-${row.id}`}
                        value={row.expiryDate}
                        onChange={(e) => updateRow(row.id, "expiryDate", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <button
                        type="button"
                        title="Remove row"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
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
            <button
              type="button"
              onClick={addRow}
              className="w-full text-xs font-semibold text-primary hover:bg-primary/5 py-2.5 border-t border-theme transition-colors"
            >
              + Add Row
            </button>
          </div>

          {/* Correction date + reason */}
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
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
              value={reason}
              placeholder="Enter reason…"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCorrectionMovementPage;