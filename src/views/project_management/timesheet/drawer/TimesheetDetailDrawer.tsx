import React, { useState } from "react";
import Drawer, { type DrawerAction } from "../../../../components/ui/Drawer/Drawer";
import {
  DrawerField as F,
  DrawerSummaryCards,
} from "../../../../components/ui/Drawer/DrawerPrimitives";
import type { TimesheetDetail } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import { useCurrencySymbols } from "../../../../hooks/Usecurrencysymbols";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  Draft: { label: "Draft", cls: "bg-draft" },
  Submitted: { label: "Approved", cls: "bg-info" },
  Billed: { label: "Billed", cls: "bg-success" },
  Cancelled: { label: "Cancelled", cls: "bg-danger" },
};

type Tab = "overview" | "logs" | "billing";

const fmtTime = (t?: string) => {
  if (!t) return "—";
  const [d, tm] = t.split(" ");
  return tm ? tm.slice(0, 5) : d;
};

const LOG_COLS = "minmax(0,1.3fr) minmax(0,1.6fr) 90px 60px 90px";
const LOG_COLS_NO_AMOUNT = "minmax(0,1.3fr) minmax(0,1.6fr) 90px 60px";

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  color: "var(--muted)",
  textTransform: "uppercase",
  fontWeight: 700,
  letterSpacing: "0.06em",
};

// ── Small helpers ────────────────────────────────────────────
const Ico: React.FC<{ d: string }> = ({ d }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICON = {
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", background: "var(--card)" }}>
    <p style={{ ...labelStyle, fontSize: 10, marginBottom: 8, color: "var(--text)" }}>{title}</p>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0", fontSize: 12 }}>
    <span style={{ color: "var(--muted)" }}>{label}</span>
    <span style={{ color: "var(--text)", fontWeight: strong ? 800 : 600, textAlign: "right" }}>{value || "—"}</span>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
    border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)",
  }}>
    {children}
  </span>
);

const MoneyCell: React.FC<{ label: string; value: string; color?: string }> = ({
  label, value, color = "var(--text)",
}) => (
  <div style={{ background: "var(--card)", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", minWidth: 0 }}>
    <p style={labelStyle}>{label}</p>
    <p style={{ fontSize: 14, fontWeight: 800, color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {value}
    </p>
  </div>
);

// ── Props ────────────────────────────────────────────────────
interface Props {
  open: boolean;
  data: TimesheetDetail | null;
  loading?: boolean;
  actionLoading?: boolean;
  canWrite?: boolean;       // Edit
  canSubmit?: boolean;      // Approve
  canCancel?: boolean;      // Cancel
  showFinancials?: boolean; // default true
  showEmployeeCard?: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const TimesheetDetailDrawer: React.FC<Props> = ({
  open, data, loading, actionLoading, canWrite, canSubmit, canCancel,
  showFinancials = true,
  showEmployeeCard = true,
  onClose, onApprove, onEdit, onCancel,
}) => {
  // Hooks hamesha early return se pehle
  const { formatAmount } = useCurrencySymbols(data?.currency ? [data.currency] : []);
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const currency = data?.currency ?? "";
  const meta = STATUS_META[data?.status ?? "Draft"] ?? STATUS_META.Draft;
  const logs = data?.time_logs ?? [];
  const money = (v?: number) => formatAmount(currency, v ?? 0, { withSymbol: true });
  const rate = data?.exchange_rate ?? 0;
  const billedPct = Math.min(100, Math.max(0, data?.per_billed ?? 0));
  const logHours = logs.reduce((a, l) => a + (l.hours ?? 0), 0);
  const logAmount = logs.reduce((a, l) => a + (l.is_billable ? l.billing_amount ?? 0 : 0), 0);
  const logCost = logs.reduce((a, l) => a + (l.costing_amount ?? 0), 0);

  // ── Header actions ──
  const actions: DrawerAction[] = [];
  if (data) {
    if (data.status === "Draft" && canWrite) {
      actions.push({ key: "edit", label: "Edit", variant: "primary", icon: <Ico d={ICON.edit} />, onClick: () => onEdit?.(data.name) });
    }
    if (data.status === "Draft" && canSubmit) {
      actions.push({
        key: "approve", label: actionLoading ? "Approving..." : "Approve", icon: <Ico d={ICON.check} />,
        disabled: actionLoading, onClick: () => onApprove?.(data.name),
      });
    }
    if (data.status === "Submitted" && canCancel) {
      actions.push({ key: "cancel", label: "Cancel", icon: <Ico d={ICON.x} />, onClick: () => onCancel?.(data.name) });
    }
  }

  const copyId = () => {
    if (!data) return;
    navigator.clipboard?.writeText(data.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "logs", label: `Time Logs (${logs.length})` },
    ...(showFinancials ? [{ id: "billing" as Tab, label: "Billing & Costing" }] : []),
  ];
  const logCols = showFinancials ? LOG_COLS : LOG_COLS_NO_AMOUNT;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(760px, 100vw)"
      scrollBody={false}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      }
      kicker="Timesheet Details"
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {data?.name ?? "—"}
          {data && (
            <button onClick={copyId} title="Copy ID"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 11 }}>
              {copied ? "✓" : "⧉"}
            </button>
          )}
        </span>
      }
      statusLabel={meta.label}
      statusClassName={meta.cls}
      headerActions={actions}
      loading={loading}
    >
      {data && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          {/* ── Fixed top: title, chips, KPIs, tabs ── */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{data.title}</span>
              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                <DateDisplay date={data.start_date} /> – <DateDisplay date={data.end_date} />
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              <Chip>{data.employee}</Chip>
              {data.employee_name && <Chip>{data.employee_name}</Chip>}
              {data.customer && <Chip>{data.customer}</Chip>}
              {data.parent_project && <Chip>{data.parent_project}</Chip>}
            </div>

            <DrawerSummaryCards
              items={[
                { label: "Total Hours", value: `${(data.total_hours ?? 0).toFixed(1)} hrs` },
                ...(showFinancials
                  ? [
                    { label: "Billable Hours", value: `${(data.total_billable_hours ?? 0).toFixed(1)} hrs` },
                    { label: "Costing", value: money(data.total_costing_amount) },
                    { label: "Billed Amount", value: money(data.total_billed_amount), emphasis: true },
                  ]
                  : []),
              ]}
            />

            <div style={{ display: "flex", gap: 4, marginTop: 10, borderBottom: "1px solid var(--border)" }}>
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: "transparent", border: "none",
                    color: tab === t.id ? "var(--primary)" : "var(--muted)",
                    borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
                    marginBottom: -1,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content (yahi scroll hota hai) ── */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 12 }}>
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10, alignItems: "start" }}>
                <Card title="Timesheet Information">
                  <Row label="Timesheet ID" value={data.name} />
                  <Row label="Title" value={data.title} />
                  <Row label="Status" value={meta.label} />
                  <Row label="Employee" value={data.employee} />
                  <Row label="Employee Name" value={data.employee_name} />
                  <Row label="Customer" value={data.customer} />
                  <Row label="Company" value={data.company} />
                  <Row label="Department" value={data.department} />
                  {showFinancials && <Row label="Currency" value={data.currency} />}
                  {showFinancials && <Row label="Exchange Rate" value={data.exchange_rate} />}
                  <Row label="Parent Project" value={data.parent_project} />
                  <Row label="Start Date" value={<DateDisplay date={data.start_date} />} />
                  <Row label="End Date" value={<DateDisplay date={data.end_date} />} />
                </Card>

                {(showEmployeeCard || showFinancials) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {showEmployeeCard && (
                      <Card title="Employee & Customer">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14,
                          }}>
                            {(data.employee_name || data.title || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{data.employee_name || data.title}</p>
                            <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{data.employee}</p>
                          </div>
                        </div>
                        <Row label="Customer" value={data.customer} />
                        <Row label="Company" value={data.company} />
                        <Row label="Department" value={data.department} />
                      </Card>
                    )}

                    {showFinancials && (
                      <Card title="Financial Summary">
                        <Row label="Total Billable Amount" value={money(data.total_billable_amount)} strong />
                        <Row label="Total Costing Amount" value={money(data.total_costing_amount)} strong />
                        {rate > 0 && (
                          <>
                            <Row label="Base Billable Amount" value={(data.total_billable_amount * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                            <Row label="Base Costing Amount" value={(data.total_costing_amount * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                          </>
                        )}
                        <Row label="Exchange Rate" value={data.exchange_rate} />
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}


            {tab === "logs" && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: logCols, padding: "6px 10px", gap: 4,
                  background: "var(--table-head)", color: "var(--table-head-text)",
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  <span>Activity</span><span>Description</span><span>Time</span>
                  <span style={{ textAlign: "right" }}>Hours</span>
                  {showFinancials && <span style={{ textAlign: "right" }}>Amount</span>}
                </div>

                {logs.length === 0 && (
                  <p style={{ padding: 16, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>No time logs</p>
                )}

                {logs.map((log, i) => (
                  <div key={log.name ?? i} className="idm-irow"
                    style={{
                      display: "grid", gridTemplateColumns: logCols, padding: "7px 10px", gap: 4,
                      borderTop: "1px solid var(--border)", alignItems: "start",
                    }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{log.activity_type}</p>
                      {(log.project_name || log.task_name) && (
                        <p style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
                          {[log.project_name, log.task_name].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text)", wordBreak: "break-word", lineHeight: 1.4 }}>{log.description || "—"}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                      {fmtTime(log.from_time)} – {fmtTime(log.to_time)}
                    </p>
                    <p style={{ fontSize: 12, textAlign: "right", fontWeight: 700 }}>{(log.hours ?? 0).toFixed(1)}h</p>
                    {showFinancials && (
                      <p style={{ fontSize: 12, textAlign: "right" }}>{log.is_billable ? money(log.billing_amount) : "—"}</p>
                    )}
                  </div>
                ))}

                {logs.length > 0 && (
                  <div style={{
                    display: "grid", gridTemplateColumns: logCols, padding: "8px 10px", gap: 4,
                    borderTop: "2px solid var(--border)", background: "var(--bg)", fontSize: 12, fontWeight: 800,
                  }}>
                    <span>Total</span><span /><span />
                    <span style={{ textAlign: "right" }}>{logHours.toFixed(1)}h</span>
                    {showFinancials && <span style={{ textAlign: "right" }}>{money(logAmount)}</span>}
                  </div>
                )}
              </div>
            )}

            {tab === "billing" && showFinancials && (
              <div style={{ background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)", padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 12 }}>
                  <MoneyCell label="Billable Amount" value={money(data.total_billable_amount)} color="var(--primary)" />
                  <MoneyCell label="Costing Amount" value={money(data.total_costing_amount)} />
                  <MoneyCell label="Billed Amount" value={money(data.total_billed_amount)} color="var(--success)" />
                  <MoneyCell label="Billable Hours" value={`${(data.total_billable_hours ?? 0).toFixed(1)} hrs`} />
                  <MoneyCell label="Billed Hours" value={`${(data.total_billed_hours ?? 0).toFixed(1)} hrs`} />
                  <MoneyCell label="Margin" value={money(data.total_billable_amount - data.total_costing_amount)} color="var(--success)" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...labelStyle, flexShrink: 0 }}>% Billed</span>
                  <div style={{ flex: 1, background: "var(--border)", borderRadius: 20, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${billedPct}%`, background: "var(--success)", height: 6, borderRadius: 20, transition: "width .3s" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "monospace" }}>{billedPct}%</span>
                </div>
                {logs.length > 0 && (
                  <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8 }}>
                    Logs costing total: {money(logCost)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default TimesheetDetailDrawer;