// ReportsApprovals.tsx — Payroll Reports page
import React, { useState } from "react";
import { Download, BarChart3, Check, X, Clock } from "lucide-react";
import type { PayrollRecord } from "../../../types/payrolltypes";

const fmtZMW = (n: number) => Number(n || 0).toLocaleString("en-ZM");

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL REPORTS
// ─────────────────────────────────────────────────────────────────────────────
interface PayrollReportsProps {
  records: PayrollRecord[];
}

const StatCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className={`rounded-xl p-5 flex flex-col items-start bg-card shadow-sm`}>
    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
      {label}
    </p>
    <p className="text-2xl font-bold text-main">{value}</p>
  </div>
);

export const PayrollReports: React.FC<PayrollReportsProps> = ({ records }) => {
  const [tab, setTab] = useState<
    "summary" | "department" | "tax" | "compliance"
  >("summary");

  const paid = records.filter((r) => r.status === "Paid");

  const summary = {
    employees: paid.length,
    gross: paid.reduce((s, r) => s + r.grossPay, 0),
    deductions: paid.reduce((s, r) => s + r.totalDeductions, 0),
    net: paid.reduce((s, r) => s + r.netPay, 0),
    tax: paid.reduce((s, r) => s + r.taxDeduction, 0),
    pf: paid.reduce((s, r) => s + r.pfDeduction, 0),
    esi: paid.reduce((s, r) => s + r.esiDeduction, 0),
  };

  const deptData = Object.values(
    paid.reduce(
      (
        acc: Record<
          string,
          { dept: string; count: number; gross: number; net: number }
        >,
        r,
      ) => {
        if (!acc[r.department])
          acc[r.department] = {
            dept: r.department,
            count: 0,
            gross: 0,
            net: 0,
          };
        acc[r.department].count++;
        acc[r.department].gross += r.grossPay;
        acc[r.department].net += r.netPay;
        return acc;
      },
      {},
    ),
  );
  const maxGross = Math.max(...deptData.map((d) => d.gross), 1);

  const handleDownloadNEFT = () => {
    const content =
      "NEFT export is disabled until real payroll APIs are connected.";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NEFT_Payroll_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-main flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Payroll Reports
        </h2>
        <button
          onClick={handleDownloadNEFT}
          className="flex items-center gap-2 px-4 py-2 bg-success text-white text-xs font-bold rounded-lg hover:opacity-90 transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Download NEFT File
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-theme">
        {(["summary", "department", "tax", "compliance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-bold capitalize border-b-2 -mb-0.5 transition-all ${
              tab === t
                ? "text-primary border-[var(--primary)]"
                : "text-muted border-transparent hover:text-main"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Summary */}
      {tab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Employees"
              value={String(summary.employees)}
            />
            <StatCard
              label="Gross Payout"
              value={`ZMW ${fmtZMW(summary.gross)}`}
            />
            <StatCard
              label="Total Deductions"
              value={`ZMW ${fmtZMW(summary.deductions)}`}
            />
            <StatCard label="Net Payout" value={`ZMW ${fmtZMW(summary.net)}`} />
          </div>

          <div className="bg-card rounded-xl p-5 shadow-sm mt-4">
            <h4 className="text-sm font-semibold text-main mb-4">
              Statutory Deductions Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "PAYE", val: summary.tax },
                { label: "Provident Fund", val: summary.pf },
                { label: "ESI", val: summary.esi },
              ].map(({ label, val }) => (
                <div key={label} className={`rounded-lg bg-muted/5 px-5 py-4`}>
                  <p className="text-xs text-muted mb-1.5">{label}</p>
                  <p className="text-lg font-bold text-main tabular-nums">
                    ZMW {fmtZMW(val)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => alert("Downloading summary report…")}
            className="flex items-center gap-2 px-4 py-2 border border-theme text-primary text-xs font-bold rounded-lg hover:bg-app transition"
          >
            <Download className="w-3.5 h-3.5" /> Download Summary Report
          </button>
        </div>
      )}

      {/* Department */}
      {tab === "department" && (
        <div className="space-y-4">
          {/* Bar chart */}
          <div className="bg-card rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-main mb-5">
              Department-wise Gross Pay
            </h4>
            <div className="flex items-end gap-6 h-40 mb-4">
              {deptData.map((d) => {
                const h = Math.round((d.gross / maxGross) * 120);
                return (
                  <div
                    key={d.dept}
                    className="flex flex-col items-center gap-2 flex-1"
                  >
                    <div
                      className="flex items-end gap-1 w-full justify-center"
                      style={{ height: 128 }}
                    >
                      <div
                        title={`Gross: ZMW ${fmtZMW(d.gross)}`}
                        className="bg-primary/80 rounded-t-md flex-1 transition-all hover:bg-primary cursor-pointer max-w-[24px]"
                        style={{ height: h }}
                      />
                      <div
                        title={`Net: ZMW ${fmtZMW(d.net)}`}
                        className="bg-success/80 rounded-t-md flex-1 transition-all hover:bg-success cursor-pointer max-w-[24px]"
                        style={{ height: Math.round((d.net / maxGross) * 120) }}
                      />
                    </div>
                    <span className="text-[10px] text-muted font-semibold text-center leading-tight">
                      {d.dept}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-3 h-3 rounded bg-primary/80 inline-block" />{" "}
                Gross
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-3 h-3 rounded bg-success/80 inline-block" />{" "}
                Net
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl overflow-hidden shadow-sm mt-4">
            <table className="w-full">
              <thead className="bg-muted/5">
                <tr>
                  {[
                    "Department",
                    "Employees",
                    "Gross Pay",
                    "Net Pay",
                    "Avg Net Pay",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptData.map((d) => (
                  <tr
                    key={d.dept}
                    className={`hover:bg-muted/5 transition-colors`}
                  >
                    <td className="px-5 py-3 text-sm font-semibold text-main">
                      {d.dept}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">{d.count}</td>
                    <td className="px-5 py-3 text-sm font-medium text-main tabular-nums">
                      ZMW {fmtZMW(d.gross)}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-main tabular-nums">
                      ZMW {fmtZMW(d.net)}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted tabular-nums">
                      ZMW {fmtZMW(Math.round(d.net / d.count))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax */}
      {tab === "tax" && (
        <div className="space-y-4">
          {[
            {
              title: "PAYE",
              color: "border-danger/30 bg-danger/5",
              items: [
                ["Total TDS Collected", `ZMW ${fmtZMW(summary.tax)}`],
                [
                  "Avg TDS / Employee",
                  `ZMW ${fmtZMW(paid.length ? Math.round(summary.tax / paid.length) : 0)}`,
                ],
                [
                  "New Regime Employees",
                  `${paid.filter((r) => r.taxRegime === "New").length}`,
                ],
                [
                  "Old Regime Employees",
                  `${paid.filter((r) => r.taxRegime === "Old").length}`,
                ],
              ],
            },
            {
              title: "Provident Fund (PF)",
              color: "border-info/30 bg-info/5",
              items: [
                ["Employee Contribution (12%)", `ZMW ${fmtZMW(summary.pf)}`],
                ["Employer Contribution (12%)", `ZMW ${fmtZMW(summary.pf)}`],
                ["Total PF Remittance", `ZMW ${fmtZMW(summary.pf * 2)}`],
              ],
            },
            {
              title: "ESI",
              color: "border-warning/30 bg-warning/5",
              items: [
                // ["Total ESI Collected", `ZMW ${fmtZMW(summary.esi)}`],
              ],
            },
          ].map(({ title, items }) => (
            <div key={title} className={`rounded-xl bg-card shadow-sm p-6`}>
              <h4 className="text-sm font-bold text-main mb-4">{title}</h4>
              <div className="space-y-3">
                {items.map(([l, v]) => (
                  <div
                    key={l}
                    className="flex justify-between items-center bg-muted/5 p-3 rounded-lg"
                  >
                    <span className="text-sm text-muted">{l}</span>
                    <span className="text-sm font-semibold text-main tabular-nums">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => alert("Downloading tax report…")}
            className="flex items-center gap-2 px-4 py-2 border border-theme text-primary text-xs font-bold rounded-lg hover:bg-app transition"
          >
            <Download className="w-3.5 h-3.5" /> Download Tax Report
          </button>
        </div>
      )}

      {/* Compliance */}
      {tab === "compliance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "PF Compliance",
                val: `${records.filter((r) => r.pfNumber).length}/${records.length}`,
                ok: true,
              },
              {
                title: "PAN Verified",
                val: `${records.filter((r) => r.panNumber).length}/${records.length}`,
                ok: true,
              },
              {
                title: "Bank Account Configured",
                val: `${records.filter((r) => r.bankAccount).length}/${records.length}`,
                ok:
                  records.filter((r) => r.bankAccount).length ===
                  records.length,
              },
              {
                title: "Tax Regime Declared",
                val: `${records.filter((r) => r.taxRegime).length}/${records.length}`,
                ok: true,
              },
            ].map(({ title, val, ok }) => (
              <div
                key={title}
                className={`rounded-xl p-4 flex items-center gap-3 ${ok ? "bg-success/5" : "bg-danger/5"}`}
              >
                <div
                  className={`p-2 rounded-full ${ok ? "bg-success/15" : "bg-danger/15"}`}
                >
                  {ok ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-danger" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-main">{title}</p>
                  <p
                    className={`text-lg font-extrabold ${ok ? "text-success" : "text-danger"}`}
                  >
                    {val}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => alert("Downloading compliance report…")}
            className="flex items-center gap-2 px-4 py-2 border border-theme text-primary text-xs font-bold rounded-lg hover:bg-app transition"
          >
            <Download className="w-3.5 h-3.5" /> Download Compliance Report
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL WORKFLOW MANAGER
// ─────────────────────────────────────────────────────────────────────────────
interface ApprovalWorkflowManagerProps {
  records: PayrollRecord[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const ApprovalWorkflowManager: React.FC<
  ApprovalWorkflowManagerProps
> = ({ records, onApprove, onReject }) => {
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const pending = records.filter((r) => r.status === "Pending");

  const doReject = () => {
    if (!rejecting || !reason.trim()) return;
    onReject(rejecting, reason);
    setRejecting(null);
    setReason("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-extrabold text-main flex items-center gap-2">
        <Clock className="w-5 h-5 text-warning" /> Approval Workflow
      </h3>

      {pending.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Check className="w-10 h-10 mx-auto mb-2 text-success opacity-60" />
          <p className="text-sm font-semibold">No pending approvals</p>
        </div>
      ) : (
        pending.map((r) => (
          <div
            key={r.id}
            className="rounded-xl p-5 bg-card shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-main">{r.employeeName}</p>
                <p className="text-xs text-muted mt-0.5">
                  {r.employeeId} • {r.department} • {r.designation}
                </p>
              </div>
              <span className="text-xs font-extrabold border border-warning/20 bg-warning/10 text-warning px-2.5 py-1 rounded-full">
                Pending
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Gross Pay", val: r.grossPay, color: "text-main" },
                {
                  label: "Deductions",
                  val: r.totalDeductions,
                  color: "text-danger",
                },
                { label: "Net Pay", val: r.netPay, color: "text-success" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-muted/5 rounded-lg p-4">
                  <p className="text-xs text-muted mb-1 font-medium">{label}</p>
                  <p className={`text-sm font-semibold ${color} tabular-nums`}>
                    ZMW {fmtZMW(val)}
                  </p>
                </div>
              ))}
            </div>

            {rejecting === r.id && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection…"
                rows={2}
                className="w-full px-3 py-2 border border-theme rounded-lg text-xs bg-app text-main focus:outline-none focus:border-danger transition resize-none"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onApprove(r.id)}
                className="flex-1 py-2 bg-success text-white text-xs font-bold rounded-lg hover:opacity-90 transition flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              {rejecting === r.id ? (
                <>
                  <button
                    onClick={doReject}
                    className="flex-1 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:opacity-90 transition flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Confirm Reject
                  </button>
                  <button
                    onClick={() => {
                      setRejecting(null);
                      setReason("");
                    }}
                    className="px-4 py-2 border border-theme text-muted text-xs font-semibold rounded-lg hover:bg-app transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setRejecting(r.id)}
                  className="flex-1 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:opacity-90 transition flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
