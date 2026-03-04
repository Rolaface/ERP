// CompensationTab.tsx
import React, { useState, useEffect } from "react";
import { RefreshCw, Lock } from "lucide-react";
import { getCurrentCeiling } from "../../../api/employeeapi";
import {
  getSalaryStructures,
  type SalaryStructureListItem,
} from "../../../api/salaryStructureApi";

type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean | any) => void;
};

// Zambian banks list — update here if new banks are added
const ZAMBIAN_BANKS = [
  "ZANACO",
  "STANBIC BANK ZAMBIA",
  "STANDARD CHARTERED BANK ZAMBIA",
  "CITI BANK ZAMBIA",
  "FIRST NATIONAL BANK ZAMBIA",
  "ACCESS BANK ZAMBIA",
  "INVESTRUST BANK",
  "ECOBANK ZAMBIA",
  "ATLAS MARA BANK ZAMBIA",
  "UNITED BANK FOR AFRICA ZAMBIA",
  "FINANCE BANK ZAMBIA",
  "NEDBANK ZAMBIA",
  "ABSA BANK ZAMBIA",
  "CITIBANK ZAMBIA",
];

// ─────────────────────────────────────────────────────────
// AllowanceRow is defined outside to prevent remount on parent re-render
// ─────────────────────────────────────────────────────────
 

// ─────────────────────────────────────────────────────────
// BankNameField — custom dropdown with 5-item scroll + manual entry fallback
// isOther state tracks "Not listed" intent separately from value,
// so clearing the input on manual entry doesn't hide the text field
// ─────────────────────────────────────────────────────────
type BankNameFieldProps = {
  value: string;
  onChange: (val: string) => void;
};

const BankNameField: React.FC<BankNameFieldProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [isOther, setIsOther] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // tracks active typing state
  const ref = React.useRef<HTMLDivElement>(null);

  const isKnownBank = ZAMBIAN_BANKS.includes(value);

  // Edit mode — if loaded value isn't in the list, mark as manual but not editing
  useEffect(() => {
    if (value !== "" && !isKnownBank) {
      setIsOther(true);
      setIsEditing(false); // value already exists, no need to show input
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (bank: string) => {
    if (bank === "__other__") {
      // Enter manual mode — open input for typing
      setIsOther(true);
      setIsEditing(true);
      onChange("");
    } else {
      setIsOther(false);
      setIsEditing(false);
      onChange(bank);
    }
    setOpen(false);
  };

  // Hide input once user finishes typing and value is set
  const handleInputBlur = () => {
    if (value.trim() !== "") {
      setIsEditing(false);
    }
  };

  // Clicking the button when a manual value exists → re-open for editing
  const handleButtonClick = () => {
    if (isOther && value !== "") {
      setIsEditing(true); // let them edit the typed value
    }
    setOpen((prev) => !prev);
  };

  const displayLabel = isKnownBank
    ? value
    : isOther && value
      ? value
      : "Select a bank";

  return (
    <div ref={ref}>
      <label className="block text-xs text-main mb-1 font-medium">
        Bank Name <span className="text-danger">*</span>
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
      >
        <span
          className={
            displayLabel === "Select a bank" ? "text-muted" : "text-main"
          }
        >
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown list — 5 items visible, rest scroll */}
      {open && (
        <div className="relative z-50">
          <ul
            className="absolute top-1 left-0 w-full bg-card border border-theme rounded-lg shadow-lg overflow-y-auto"
            style={{ maxHeight: "185px" }}
          >
            {ZAMBIAN_BANKS.map((bank) => (
              <li
                key={bank}
                onClick={() => handleSelect(bank)}
                className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-primary/10 hover:text-primary transition
                  ${
                    value === bank && isKnownBank
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-main"
                  }`}
              >
                {bank}
              </li>
            ))}

            <li
              onClick={() => handleSelect("__other__")}
              className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-app border-t border-theme transition
                ${isOther ? "text-primary font-medium" : "text-muted"}`}
            >
              Not listed (enter manually)
            </li>
          </ul>
        </div>
      )}

      {/* Input only shows while actively editing manual entry — hides on blur once value is set */}
      {isOther && isEditing && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleInputBlur}
          placeholder="Type bank name here..."
          autoFocus
          className="w-full mt-2 px-3 py-2 text-sm border border-primary bg-card text-main rounded-lg focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────

const CompensationTab: React.FC<CompensationTabProps> = ({
  formData,
  handleInputChange,
}) => {
  const [ceilingLoading, setCeilingLoading] = useState(false);
  const [ceilingError, setCeilingError] = useState(false);

  const [salaryStructures, setSalaryStructures] = useState<SalaryStructureListItem[]>(
    [],
  );
  const [salaryStructureLoading, setSalaryStructureLoading] = useState(false);
  const [salaryStructureError, setSalaryStructureError] = useState<string | null>(
    null,
  );

  // Fetch the current NAPSA ceiling on mount (skipped if already populated, e.g. edit mode)
  const fetchCeiling = async () => {
    try {
      setCeilingLoading(true);
      setCeilingError(false);
      const res = await getCurrentCeiling();

      const ceilingAmount =
        res?.data?.ceiling_amount ??
        res?.ceiling_amount ??
        res?.data?.amount ??
        res?.amount ??
        "";
      const ceilingYear =
        res?.data?.year ?? res?.year ?? String(new Date().getFullYear());

      if (ceilingAmount)
        handleInputChange("ceilingAmount", String(ceilingAmount));
      if (ceilingYear) handleInputChange("ceilingYear", String(ceilingYear));
    } catch (err) {
      console.error("Ceiling fetch failed:", err);
      setCeilingError(true);
    } finally {
      setCeilingLoading(false);
    }
  };

  useEffect(() => {
    if (!formData.ceilingAmount) {
      fetchCeiling();
    }
  }, []);

  // Once fetched successfully, ceiling fields go read-only
  const ceilingLocked = !ceilingError && !!formData.ceilingAmount;
  const lockedClass = "bg-app text-main cursor-default";
  const editableClass = "bg-card text-main";

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setSalaryStructureLoading(true);
      setSalaryStructureError(null);
      try {
        const rows = await getSalaryStructures();
        if (!mounted) return;
        setSalaryStructures(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (!mounted) return;
        setSalaryStructures([]);
        setSalaryStructureError(e?.message || "Failed to load salary structures");
      } finally {
        if (!mounted) return;
        setSalaryStructureLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      <div className="bg-card p-5 rounded-lg border border-theme space-y-3">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Salary Structure
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Select salary structure
            </label>
            <select
              value={String(formData.salaryStructure ?? "")}
              onChange={(e) => {
                const v = e.target.value;
                handleInputChange("salaryStructure", v);
              }}
              disabled={salaryStructureLoading}
              className="w-full px-3 py-2 text-sm border border-theme bg-card rounded-lg focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            >
              <option value="">Select a salary structure</option>
              {salaryStructures.map((s) => (
                <option key={String(s.id ?? s.name)} value={String(s.name)}>
                  {String(s.name)}
                </option>
              ))}
            </select>
            {salaryStructureError ? (
              <div className="text-[11px] text-danger mt-1">{salaryStructureError}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Basic Salary <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              value={String(formData.basicSalary ?? "")}
              onChange={(e) => handleInputChange("basicSalary", e.target.value)}
              placeholder="e.g. 4000"
              min={0}
              className="w-full px-3 py-2 text-sm border border-theme bg-card rounded-lg focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* ═══════════════ LEFT — Salary & Payroll ═══════════════ */}
        <div className="space-y-5">
          {/* Payroll config — currency, frequency, method */}
          <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
              Payroll Configuration
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  {
                    label: "Currency",
                    field: "currency",
                    options: ["ZMW", "USD"],
                  },
                  {
                    label: "Frequency",
                    field: "paymentFrequency",
                    options: ["Monthly", "Bi-weekly"],
                  },
                  {
                    label: "Method",
                    field: "paymentMethod",
                    options: ["Bank Transfer", "Cash", "Mobile Money"],
                  },
                ] as const
              ).map(({ label, field, options }) => (
                <div key={field}>
                  <label className="block text-xs text-main mb-1 font-medium">
                    {label}
                  </label>
                  <select
                    value={formData[field] || options[0]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-theme bg-card rounded-lg focus:ring-2 focus:ring-primary/20"
                  >
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════ RIGHT — Bank & NAPSA ═══════════════ */}
        <div className="space-y-5">
          {/* Bank account details */}
          <div className="bg-card p-5 rounded-lg border border-theme space-y-3">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
              Bank Account Details
            </h4>

            {/* Account type */}
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                Account Type <span className="text-danger">*</span>
              </label>
              <select
                value={formData.accountType || "Savings"}
                onChange={(e) =>
                  handleInputChange("accountType", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-theme bg-card rounded-lg focus:ring-2 focus:ring-primary/20"
              >
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </select>
            </div>

            {/* Account Name & Number */}
            {(
              [
                {
                  label: "Account Name",
                  field: "accountName",
                  placeholder: "Account holder name",
                },
                {
                  label: "Account Number",
                  field: "accountNumber",
                  placeholder: "Bank account number",
                },
              ] as const
            ).map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="block text-xs text-main mb-1 font-medium">
                  {label} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 text-sm border border-theme bg-card rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}

            {/* Bank name — custom dropdown with manual fallback */}
            <BankNameField
              value={formData.bankName || ""}
              onChange={(val) => handleInputChange("bankName", val)}
            />

            {/* Branch Code */}
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                Branch Code <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.branchCode || ""}
                onChange={(e) =>
                  handleInputChange("branchCode", e.target.value)
                }
                placeholder="e.g., 027"
                className="w-full px-3 py-2 text-sm border border-theme bg-card rounded-lg focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* NAPSA Ceiling — auto-fetched, locked after successful fetch */}
          <div className="bg-card p-5 rounded-lg border border-theme space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
                  NAPSA Ceiling
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Auto-fetched from NAPSA API
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCeiling}
                disabled={ceilingLoading}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${ceilingLoading ? "animate-spin" : ""}`}
                />
                {ceilingLoading ? "Fetching..." : "Refresh"}
              </button>
            </div>

            {ceilingError && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                ⚠ Could not fetch from NAPSA. Enter manually.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-main mb-1 font-medium">
                  Ceiling Amount
                  {ceilingLocked && (
                    <Lock className="inline w-3 h-3 ml-1 text-muted" />
                  )}
                </label>
                <input
                  type="number"
                  value={formData.ceilingAmount || ""}
                  onChange={(e) =>
                    handleInputChange("ceilingAmount", e.target.value)
                  }
                  placeholder={ceilingLoading ? "Fetching..." : "e.g., 50000"}
                  readOnly={ceilingLocked}
                  className={`w-full px-3 py-2 text-sm border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 ${ceilingLocked ? lockedClass : editableClass}`}
                />
              </div>
              <div>
                <label className="block text-xs text-main mb-1 font-medium">
                  Ceiling Year
                  {ceilingLocked && (
                    <Lock className="inline w-3 h-3 ml-1 text-muted" />
                  )}
                </label>
                <input
                  type="number"
                  value={formData.ceilingYear || ""}
                  onChange={(e) =>
                    handleInputChange("ceilingYear", e.target.value)
                  }
                  placeholder={ceilingLoading ? "Fetching..." : "e.g., 2025"}
                  readOnly={ceilingLocked}
                  className={`w-full px-3 py-2 text-sm border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 ${ceilingLocked ? lockedClass : editableClass}`}
                />
              </div>
            </div>

            {ceilingLocked && (
              <p className="text-[11px] text-success">✓ Fetched from NAPSA</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompensationTab;
