
import React from "react";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import { getSalaryStructureById, type SalaryStructureDetail } from "../../../api/salaryStructureApi";

type PayrollPreviewModalProps = {
  open: boolean;
  structureName: string;
  currency?: string;
  payPeriodStart?: string;
  payPeriodEnd?: string;
  onPayPeriodStartChange?: (v: string) => void;
  onPayPeriodEndChange?: (v: string) => void;
  onClose: () => void;
  onRunPayroll?: () => void | Promise<void>;
  runPayrollDisabled?: boolean;
  runPayrollLoading?: boolean;
};

export default function PayrollPreviewModal({
  open,
  structureName,
  currency,
  payPeriodStart,
  payPeriodEnd,
  onPayPeriodStartChange,
  onPayPeriodEndChange,
  onClose,
  onRunPayroll,
  runPayrollDisabled,
  runPayrollLoading,
}: PayrollPreviewModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<SalaryStructureDetail | null>(null);
  const missingStructureAlertShownRef = React.useRef(false);

  const monthValue = React.useMemo(() => {
    const s = String(payPeriodStart ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [payPeriodStart]);

  const fillDatesForMonth = (yyyyMm: string) => {
    if (!/^\d{4}-\d{2}$/.test(yyyyMm)) return;
    const [yRaw, mRaw] = yyyyMm.split("-");
    const y = Number(yRaw);
    const m = Number(mRaw);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return;

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    const toIso = (d: Date) => {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    };

    onPayPeriodStartChange?.(toIso(start));
    onPayPeriodEndChange?.(toIso(end));
  };

  React.useEffect(() => {
    if (!open) return;
    const name = String(structureName ?? "").trim();
    if (!name) {
      setDetail(null);
      setError("Please select a salary structure");
      setLoading(false);

      if (!missingStructureAlertShownRef.current) {
        missingStructureAlertShownRef.current = true;
        void Swal.fire({
          icon: "error",
          title: "Salary Structure Not Found",
          text: "Please select a salary structure before running payroll.",
          confirmButtonText: "OK",
          confirmButtonColor: "#2563eb",
        }).then(() => onClose());
      }
      return;
    }

    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      try {
        const resp = await getSalaryStructureById(name);
        if (!mounted) return;

        if (!resp) {
          setDetail(null);
          setError("Salary structure not found");
          if (!missingStructureAlertShownRef.current) {
            missingStructureAlertShownRef.current = true;
            void Swal.fire({
              icon: "error",
              title: "Salary Structure Not Found",
              text: "The selected salary structure could not be loaded. Please select another one.",
              confirmButtonText: "OK",
              confirmButtonColor: "#2563eb",
            }).then(() => onClose());
          }
          return;
        }

        missingStructureAlertShownRef.current = false;
        setDetail(resp);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load salary structure");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [open, structureName, onClose]);

  const safeCurrency = String(currency ?? "").trim();
  const earningsRaw = Array.isArray((detail as any)?.earnings) ? (detail as any).earnings : [];
  const deductionsRaw = Array.isArray((detail as any)?.deductions) ? (detail as any).deductions : [];

  const enabledComponentKeys = React.useMemo(() => {
    const comps = Array.isArray((detail as any)?.components) ? (detail as any).components : [];
    const set = new Set<string>();
    comps.forEach((c: any) => {
      const name = String(c?.component ?? "").trim();
      if (!name) return;
      const enabled = Boolean(Number(c?.enabled ?? 0)) || c?.enabled === true;
      if (enabled) set.add(name.toLowerCase());
    });
    return set;
  }, [detail]);

  const displayComponentName = React.useCallback((name: unknown) => {
    const raw = String(name ?? "").trim();
    if (!raw) return "—";
    const key = raw.toLowerCase();
    if (key === "income tax") return "PAYE";
    if (key === "income tax (paye)") return "PAYE";
    if (key === "paye" || key === "p.a.y.e") return "PAYE";
    if (key === "it") return "PAYE";
    return raw;
  }, []);

  const normalizeComponentKey = React.useCallback(
    (name: unknown) => {
      const label = displayComponentName(name);
      return String(label ?? "").trim().toLowerCase();
    },
    [displayComponentName],
  );

  const earnings = React.useMemo(() => {
    if (!enabledComponentKeys || enabledComponentKeys.size === 0) return earningsRaw;
    return (earningsRaw || []).filter((r: any) => enabledComponentKeys.has(String(r?.component ?? "").trim().toLowerCase()));
  }, [earningsRaw, enabledComponentKeys]);

  const deductions = React.useMemo(() => {
    if (!enabledComponentKeys || enabledComponentKeys.size === 0) return deductionsRaw;
    return (deductionsRaw || []).filter((r: any) => enabledComponentKeys.has(String(r?.component ?? "").trim().toLowerCase()));
  }, [deductionsRaw, enabledComponentKeys]);

  const deductionsDeduped = React.useMemo(() => {
    const map = new Map<string, { component: string; amount: number }>();
    (deductions || []).forEach((row: any) => {
      const component = displayComponentName(row?.component);
      const key = normalizeComponentKey(row?.component);
      if (!key || key === "—") return;
      const amt = Number(row?.amount ?? 0) || 0;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { component, amount: amt });
      } else {
        map.set(key, { component: prev.component, amount: prev.amount + amt });
      }
    });
    return Array.from(map.values());
  }, [deductions, displayComponentName, normalizeComponentKey]);

  const fmtMoney = (v: any) => {
    const n = Number(v ?? 0);
    const prefix = safeCurrency ? `${safeCurrency} ` : "";
    return `${prefix}${(Number.isFinite(n) ? n : 0).toLocaleString()}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-theme rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 bg-app border-b border-theme flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-main">Salary Structure</div>
            <div className="text-xs text-muted mt-0.5 break-words">{String(structureName || (detail as any)?.name || "—")}</div>
          </div>
          <div className="flex items-center gap-2">
            {onRunPayroll && (
              <button
                type="button"
                onClick={() => onRunPayroll()}
                disabled={!!runPayrollDisabled}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white text-xs font-extrabold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {runPayrollLoading ? "Running..." : "Run Payroll"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-card text-muted hover:text-main transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(typeof onPayPeriodStartChange === "function" || typeof onPayPeriodEndChange === "function") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">
                  Month
                </div>
                <input
                  type="month"
                  value={monthValue}
                  onChange={(e) => fillDatesForMonth(e.target.value)}
                  className="w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">
                  Pay Period Start
                </div>
                <input
                  type="date"
                  value={String(payPeriodStart ?? "")}
                  onChange={(e) => onPayPeriodStartChange?.(e.target.value)}
                  className="w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">
                  Pay Period End
                </div>
                <input
                  type="date"
                  value={String(payPeriodEnd ?? "")}
                  onChange={(e) => onPayPeriodEndChange?.(e.target.value)}
                  className="w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-xs text-muted">Loading salary structure…</div>
          ) : error ? (
            <div className="text-xs text-danger">{error}</div>
          ) : !detail ? (
            <div className="text-xs text-muted">—</div>
          ) : (
            <>
              <div className="border border-theme rounded-xl bg-card p-4">
                <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Summary</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="bg-app border border-theme rounded-lg p-3">
                    <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Pay Period</div>
                    <div className="text-xs font-bold text-main mt-1 break-words">
                      {String(payPeriodStart || "—")} → {String(payPeriodEnd || "—")}
                    </div>
                  </div>
                  <div className="bg-app border border-theme rounded-lg p-3">
                    <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Salary Structure</div>
                    <div className="text-xs font-bold text-main mt-1 break-words">{String((detail as any)?.name ?? "—")}</div>
                  </div>
                  <div className="bg-app border border-theme rounded-lg p-3">
                    <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Company</div>
                    <div className="text-xs font-bold text-main mt-1 break-words">{String((detail as any)?.company ?? "—")}</div>
                  </div>
                  <div className="bg-app border border-theme rounded-lg p-3">
                    <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Status</div>
                    <div className="text-xs font-bold text-main mt-1">
                      {Boolean((detail as any)?.is_active) ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-theme rounded-xl bg-card p-4">
                  <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Earnings</div>
                  <div className="mt-3 space-y-2">
                    {earnings.length === 0 ? (
                      <div className="text-xs text-muted">—</div>
                    ) : (
                      earnings.map((row: any, idx: number) => (
                        <div key={`${row?.component ?? idx}`} className="border-b border-theme/60 last:border-0 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-bold text-main truncate">{displayComponentName(row?.component)}</div>
                            <div className="text-xs font-extrabold text-main tabular-nums whitespace-nowrap">
                              {fmtMoney(row?.amount)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border border-theme rounded-xl bg-card p-4">
                  <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Deductions</div>
                  <div className="mt-3 space-y-2">
                    {deductionsDeduped.length === 0 ? (
                      <div className="text-xs text-muted">—</div>
                    ) : (
                      deductionsDeduped.map((row: any, idx: number) => (
                        <div key={`${row?.component ?? idx}`} className="border-b border-theme/60 last:border-0 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-bold text-main truncate">{displayComponentName(row?.component)}</div>
                            <div className="text-xs font-extrabold text-main tabular-nums whitespace-nowrap">
                              {fmtMoney(row?.amount)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

