// CompensationTab.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Calculator, RefreshCw, Lock } from "lucide-react";
import { getCurrentCeiling } from "../../../api/employeeapi";
import {
  getSalaryStructures,
  type SalaryStructureDetail,
  type SalaryStructureLineItem,
  type SalaryStructureListItem,
} from "../../../api/salaryStructureApi";

type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: unknown) => void;
};

type FormDataShape = {
  salaryStructure?: string;
  currency?: string;
  paymentFrequency?: string;
  paymentMethod?: string;

  basicSalary?: string | number;
  housingAllowance?: string | number;
  mealAllowance?: string | number;
  transportAllowance?: string | number;
  otherAllowances?: string | number;
  grossSalary?: string | number;

  employeeNapsa?: string | number;
  employeerNapsa?: string | number;
  employeeNhima?: string | number;
  employeerNhima?: string | number;
  payAsYouEarn?: string | number;

  accountType?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  branchCode?: string;

  ceilingAmount?: string | number;
  ceilingYear?: string | number;

  [key: string]: unknown;
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
  "INDO ZAMBIA BANK"
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
  }, [isKnownBank, value]);

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
      onChange(String(bank ?? "").toUpperCase());
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
          onChange={(e) =>
            onChange(String(e.target.value ?? "").toUpperCase())
          }
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

const toText = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
};

const toNum = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const getErrorMessage = (e: unknown, fallback: string): string => {
  if (!e || typeof e !== "object") return fallback;
  const rec = e as Record<string, unknown>;
  return typeof rec.message === "string" ? rec.message : fallback;
};

const extractAmount = (
  detail: SalaryStructureDetail | null | undefined,
  opts: { componentNames?: string[]; abbrs?: string[] },
): number => {
  const earnings: SalaryStructureLineItem[] = Array.isArray(detail?.earnings)
    ? detail.earnings
    : [];
  const names = (opts.componentNames ?? []).map((s) =>
    String(s).trim().toLowerCase(),
  );
  const abbrs = (opts.abbrs ?? []).map((s) => String(s).trim().toLowerCase());
  const row = earnings.find((r) => {
    const cn = String(r.component ?? "")
      .trim()
      .toLowerCase();
    const ab = String(r.abbr ?? "")
      .trim()
      .toLowerCase();
    return (cn && names.includes(cn)) || (ab && abbrs.includes(ab));
  });
  const amount = toNum(row?.amount);
  return amount;
};

const CompensationTab: React.FC<CompensationTabProps> = ({
  formData,
  handleInputChange,
}) => {
  const form = (formData ?? {}) as FormDataShape;
  const currency =
    (typeof form.currency === "string" ? form.currency : "ZMW").trim() || "ZMW";

  const [ceilingLoading, setCeilingLoading] = useState(false);
  const [ceilingError, setCeilingError] = useState(false);

  const [salaryStructures, setSalaryStructures] = useState<
    SalaryStructureListItem[]
  >([]);
  const [salaryStructureLoading, setSalaryStructureLoading] = useState(false);
  const [salaryStructureError, setSalaryStructureError] = useState<
    string | null
  >(null);

  const [salaryStructureDetailLoading, setSalaryStructureDetailLoading] =
    useState(false);
  const [salaryStructureDetailError, setSalaryStructureDetailError] = useState<
    string | null
  >(null);
  const [salaryStructureDetail, setSalaryStructureDetail] =
    useState<SalaryStructureDetail | null>(null);

  // Fetch the current NAPSA ceiling on mount (skipped if already populated, e.g. edit mode)
  const fetchCeiling = useCallback(async () => {
    try {
      setCeilingLoading(true);
      setCeilingError(false);
      const res: unknown = await getCurrentCeiling();
      const root = res as Record<string, unknown>;
      const data =
        root?.data && typeof root.data === "object"
          ? (root.data as Record<string, unknown>)
          : undefined;

      const ceilingAmountRaw =
        data?.ceiling_amount ??
        root?.ceiling_amount ??
        data?.amount ??
        root?.amount;
      const ceilingYearRaw = data?.year ?? root?.year;

      const ceilingAmount =
        typeof ceilingAmountRaw === "number" ||
        typeof ceilingAmountRaw === "string"
          ? String(ceilingAmountRaw)
          : "";
      const ceilingYear =
        typeof ceilingYearRaw === "number" || typeof ceilingYearRaw === "string"
          ? String(ceilingYearRaw)
          : String(new Date().getFullYear());

      if (ceilingAmount) handleInputChange("ceilingAmount", ceilingAmount);
      if (ceilingYear) handleInputChange("ceilingYear", ceilingYear);
    } catch (err) {
      console.error("Ceiling fetch failed:", err);
      setCeilingError(true);
    } finally {
      setCeilingLoading(false);
    }
  }, [handleInputChange]);

  useEffect(() => {
    if (!form.ceilingAmount) {
      void fetchCeiling();
    }
  }, [fetchCeiling, form.ceilingAmount]);

  // Once fetched successfully, ceiling fields go read-only
  const ceilingLocked = !ceilingError && !!form.ceilingAmount;
  const lockedClass = "bg-app text-main cursor-default";
  const editableClass = "bg-card text-main";

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setSalaryStructureLoading(true);
      setSalaryStructureError(null);
      try {
        const rows = await getSalaryStructures();
        if (mounted) setSalaryStructures(Array.isArray(rows) ? rows : []);
      } catch (e: unknown) {
        if (mounted) {
          setSalaryStructures([]);
          setSalaryStructureError(
            getErrorMessage(e, "Failed to load salary structures"),
          );
        }
      } finally {
        if (mounted) setSalaryStructureLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const applySalaryStructure = useCallback(
    async (structureName: string) => {
      const name = String(structureName ?? "").trim();
      if (!name) {
        setSalaryStructureDetail(null);
        setSalaryStructureDetailError(null);
        setSalaryStructureDetailLoading(false);
        return;
      }

      setSalaryStructureDetailLoading(true);
      setSalaryStructureDetailError(null);
      try {
        const detail = await getSalaryStructureById(name);

        setSalaryStructureDetail(detail);

        const basic = extractAmount(detail, {
          componentNames: ["basic", "basic salary"],
          abbrs: ["basic"],
        });
        const housing = extractAmount(detail, {
          componentNames: ["housing allowance"],
          abbrs: ["ha"],
        });
        const meal = extractAmount(detail, {
          componentNames: ["meal allowance"],
          abbrs: ["ma", "meal"],
        });
        const transport = extractAmount(detail, {
          componentNames: ["transport allowance"],
          abbrs: ["ta", "transport"],
        });

        handleInputChange("basicSalary", basic ? String(basic) : "");
        handleInputChange("housingAllowance", housing ? String(housing) : "");
        handleInputChange("mealAllowance", meal ? String(meal) : "");
        handleInputChange(
          "transportAllowance",
          transport ? String(transport) : "",
        );
        handleInputChange("otherAllowances", "");

        const gross = basic + housing + meal + transport;
        handleInputChange("grossSalary", gross > 0 ? String(gross) : "");
      } catch (e: unknown) {
        setSalaryStructureDetail(null);
        const safeMessage = getErrorMessage(e, "").trim();
        setSalaryStructureDetailError(
          safeMessage || "Failed to load salary structure details",
        );
      } finally {
        setSalaryStructureDetailLoading(false);
      }
    },
    [handleInputChange],
  );

  useEffect(() => {
    const selected = toText(form.salaryStructure).trim();
    if (!selected) return;
    if (salaryStructureDetailLoading) return;
    if (salaryStructureDetail) return;
    void applySalaryStructure(selected);
  }, [
    applySalaryStructure,
    form.salaryStructure,
    salaryStructureDetail,
    salaryStructureDetailLoading,
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      <div className="bg-card p-5 rounded-lg border border-theme space-y-3">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Salary Structure
        </h4>
        <div>
          <label className="block text-xs text-main mb-1 font-medium">
            Select salary structure
          </label>
          <select
            value={toText(form.salaryStructure)}
            onChange={(e) => {
              const v = e.target.value;
              handleInputChange("salaryStructure", v);
              void applySalaryStructure(v);
            }}
            disabled={salaryStructureLoading || salaryStructureDetailLoading}
            className="w-full px-3 py-2 text-sm border border-theme bg-card rounded-lg focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            <option value="">Select a salary structure</option>
            {salaryStructures.map((s) => (
              <option key={String(s.id ?? s.name)} value={String(s.name)}>
                {String(s.name)}
              </option>
            ))}
          </select>
          {salaryStructureDetailError ? (
            <div className="text-[11px] text-danger mt-1">
              {salaryStructureDetailError}
            </div>
          ) : null}
          {salaryStructureError ? (
            <div className="text-[11px] text-danger mt-1">
              {salaryStructureError}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* ═══════════════ LEFT — Salary & Payroll ═══════════════ */}
        <div className="space-y-5">
          {/* Salary breakdown */}
          <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
                Salary Components
              </h4>
              <Calculator className="w-4 h-4 text-muted" />
            </div>

            {salaryStructureDetailLoading ? (
              <div className="text-xs text-muted">
                Loading salary structure…
              </div>
            ) : (
              (() => {
                type MoneyRow = { label: string; amount: number };
                type StatRow = MoneyRow & { includeInTotal: boolean };

                const selectedStructure = toText(form.salaryStructure).trim();
                const detailName = String(
                  salaryStructureDetail?.name ?? "",
                ).trim();
                const structureLabel =
                  detailName || selectedStructure || "Manual";

                const detail = salaryStructureDetail;
                const earnings: SalaryStructureLineItem[] =
                  detail && Array.isArray(detail.earnings)
                    ? detail.earnings
                    : [];
                const deductions: SalaryStructureLineItem[] =
                  detail && Array.isArray(detail.deductions)
                    ? detail.deductions
                    : [];

                const earningsRows: MoneyRow[] = salaryStructureDetail
                  ? earnings
                      .map((r) => ({
                        label: String(r.component ?? "").trim(),
                        amount: toNum(r.amount),
                      }))
                      .filter((r) => r.label && r.amount !== 0)
                  : [
                      {
                        label: "Basic Salary",
                        amount: toNum(form.basicSalary),
                      },
                      {
                        label: "Housing Allowance",
                        amount: toNum(form.housingAllowance),
                      },
                      {
                        label: "Meal Allowance",
                        amount: toNum(form.mealAllowance),
                      },
                      {
                        label: "Transport Allowance",
                        amount: toNum(form.transportAllowance),
                      },
                      {
                        label: "Other Allowances",
                        amount: toNum(form.otherAllowances),
                      },
                    ].filter((r) => r.amount !== 0);

                const grossFromRows = earningsRows.reduce(
                  (s, r) => s + toNum(r.amount),
                  0,
                );
                const grossFromField = toNum(form.grossSalary);
                const gross =
                  grossFromRows !== 0 ? grossFromRows : grossFromField;

                const structureDeductionsRows: MoneyRow[] =
                  salaryStructureDetail
                    ? deductions
                        .map((r) => ({
                          label: String(r.component ?? "").trim(),
                          amount: toNum(r.amount),
                        }))
                        .filter((r) => r.label && r.amount !== 0)
                    : [];

                const statutoryRows: StatRow[] = [
                  {
                    label: "NAPSA Employee",
                    amount: toNum(form.employeeNapsa),
                    includeInTotal: true,
                  },
                  {
                    label: "NAPSA Employer",
                    amount: toNum(form.employeerNapsa),
                    includeInTotal: false,
                  },
                  {
                    label: "NHIMA Employee",
                    amount: toNum(form.employeeNhima),
                    includeInTotal: true,
                  },
                  {
                    label: "NHIMA Employer",
                    amount: toNum(form.employeerNhima),
                    includeInTotal: false,
                  },
                  {
                    label: "PAYE",
                    amount: toNum(form.payAsYouEarn),
                    includeInTotal: true,
                  },
                ].filter((r) => r.amount !== 0);

                const totalEmployeeDeductions = statutoryRows
                  .filter((r) => r.includeInTotal)
                  .reduce((s, r) => s + toNum(r.amount), 0);

                const totalDeductions = salaryStructureDetail
                  ? structureDeductionsRows.reduce(
                      (s, r) => s + toNum(r.amount),
                      0,
                    )
                  : totalEmployeeDeductions;

                const net = gross - totalDeductions;
                const monthly = salaryStructureDetail ? gross / 12 : gross;

                if (
                  earningsRows.length === 0 &&
                  structureDeductionsRows.length === 0 &&
                  statutoryRows.length === 0 &&
                  gross === 0
                ) {
                  return (
                    <div className="text-xs text-muted">
                      {!selectedStructure
                        ? "Select a salary structure to preview its components."
                        : "—"}
                    </div>
                  );
                }

                const deductionsRowsToShow: MoneyRow[] = salaryStructureDetail
                  ? structureDeductionsRows
                  : statutoryRows;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-app border border-theme rounded-lg p-3">
                        <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">
                          Salary Structure
                        </div>
                        <div className="text-xs font-bold text-main mt-1 break-words">
                          {structureLabel}
                        </div>
                      </div>
                      <div className="bg-app border border-theme rounded-lg p-3">
                        <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">
                          Gross Pay
                        </div>
                        <div className="text-xs font-extrabold text-main mt-1 tabular-nums">
                          {currency} {Number(gross || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          Monthly: {currency}{" "}
                          {Number(monthly || 0).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div className="bg-app border border-theme rounded-lg p-3">
                        <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">
                          Net
                        </div>
                        <div className="text-xs font-extrabold text-main mt-1 tabular-nums">
                          {currency} {Number(net || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          Deductions: {currency}{" "}
                          {Number(totalDeductions || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="border border-theme rounded-xl bg-card p-4">
                        <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">
                          Earnings
                        </div>
                        <div className="mt-3 space-y-2">
                          {earningsRows.length === 0 ? (
                            <div className="text-xs text-muted">—</div>
                          ) : (
                            earningsRows.map((row, idx) => (
                              <div
                                key={`${row.label}-${idx}`}
                                className="border-b border-theme/60 last:border-0 py-2"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-main truncate">
                                      {row.label || "—"}
                                    </div>
                                  </div>
                                  <div className="text-xs font-extrabold text-main tabular-nums whitespace-nowrap">
                                    {currency}{" "}
                                    {Number(row.amount || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="border border-theme rounded-xl bg-card p-4">
                        <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">
                          Deductions
                        </div>
                        <div className="mt-3 space-y-2">
                          {deductionsRowsToShow.length === 0 ? (
                            <div className="text-xs text-muted">—</div>
                          ) : (
                            deductionsRowsToShow.map((row, idx) => (
                              <div
                                key={`${row.label}-${idx}`}
                                className="border-b border-theme/60 last:border-0 py-2"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-main truncate">
                                      {row.label || "—"}
                                    </div>
                                  </div>
                                  <div className="text-xs font-extrabold text-main tabular-nums whitespace-nowrap">
                                    {currency}{" "}
                                    {Number(row.amount || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            )}
          </div>

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
                    value={
                      toText(form[field as keyof FormDataShape], options[0]) ||
                      options[0]
                    }
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
                value={toText(form.accountType, "Savings") || "Savings"}
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
                  value={toText(form[field as keyof FormDataShape])}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}

            {/* Bank name — custom dropdown with manual fallback */}
            <BankNameField
              value={toText(form.bankName)}
              onChange={(val) => handleInputChange("bankName", val)}
            />

            {/* Branch Code */}
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                Branch Code <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={toText(form.branchCode)}
                onChange={(e) =>
                  handleInputChange(
                    "branchCode",
                    String(e.target.value ?? "").toUpperCase(),
                  )
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
                onClick={() => void fetchCeiling()}
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
                 Could not fetch from NAPSA. Enter manually.
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
                  value={toText(form.ceilingAmount)}
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
                  value={toText(form.ceilingYear)}
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
