import React from "react";
import Drawer, {
  type DrawerAction,
} from "../../../../components/ui/Drawer/Drawer";
import { DrawerSummaryCards } from "../../../../components/ui/Drawer/DrawerPrimitives";
import type { TimesheetDetail } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import {
  fmtDateTime,
  useTimesheetDrawer,
  type ActionIcon,
} from "../../../../hooks/project_management/timeheet/drawer/useTimesheetDrawer";

const LOG_CSS = `
.ts-log-grid { display: grid; grid-template-columns: var(--ts-cols); }
@media (max-width: 780px) {
  .ts-log-grid { grid-template-columns: minmax(0, 1fr); }
  .ts-log-head { display: none !important; }
  .ts-log-grid > * { text-align: left !important; }
  .ts-log-grid > [data-label]::before {
    content: attr(data-label);
    display: block;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 1px;
  }
  .ts-log-grid > :empty { display: none; }
}
`;

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  color: "var(--muted)",
  textTransform: "uppercase",
  fontWeight: 700,
  letterSpacing: "0.06em",
};

const ICON_PATH: Record<ActionIcon, string> = {
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4Z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
};

const Ico: React.FC<{ name: ActionIcon }> = ({ name }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={ICON_PATH[name]} />
  </svg>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div
    style={{
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "10px 12px",
      background: "var(--card)",
    }}
  >
    <p
      style={{
        ...labelStyle,
        fontSize: 10,
        marginBottom: 8,
        color: "var(--text)",
      }}
    >
      {title}
    </p>
    {children}
  </div>
);

const Row: React.FC<{
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}> = ({ label, value, strong }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: "3px 0",
      fontSize: 12,
    }}
  >
    <span style={{ color: "var(--muted)" }}>{label}</span>
    <span
      style={{
        color: "var(--text)",
        fontWeight: strong ? 800 : 600,
        textAlign: "right",
      }}
    >
      {value || "—"}
    </span>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: 6,
      border: "1px solid var(--border)",
      background: "var(--bg)",
      color: "var(--text)",
    }}
  >
    {children}
  </span>
);

const MoneyCell: React.FC<{
  label: string;
  value: string;
  color?: string;
}> = ({ label, value, color = "var(--text)" }) => (
  <div
    style={{
      background: "var(--card)",
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid var(--border)",
      minWidth: 0,
    }}
  >
    <p style={labelStyle}>{label}</p>
    <p
      style={{
        fontSize: 14,
        fontWeight: 800,
        color,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {value}
    </p>
  </div>
);

const fmtBase = (v: number) =>
  v.toLocaleString(undefined, { maximumFractionDigits: 2 });

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface Props {
  open: boolean;
  data: TimesheetDetail | null;
  loading?: boolean;
  actionLoading?: boolean;
  canWrite?: boolean;
  canSubmit?: boolean;
  canCancel?: boolean;
  showFinancials?: boolean;
  showEmployeeCard?: boolean;
  onClose: () => void;
  onSendForApproval?: (id: string) => void;
  onApprove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const TimesheetDetailDrawer: React.FC<Props> = ({
  open,
  data,
  loading,
  actionLoading,
  canWrite,
  canSubmit,
  canCancel,
  showFinancials = true,
  showEmployeeCard = true,
  onClose,
  onSendForApproval,
  onApprove,
  onEdit,
  onCancel,
}) => {
  const d = useTimesheetDrawer({
    data,
    actionLoading,
    canWrite,
    canSubmit,
    canCancel,
    showFinancials,
    onSendForApproval,
    onApprove,
    onEdit,
    onCancel,
  });

  if (!open) return null;

  const logGridVars = { "--ts-cols": d.logCols } as React.CSSProperties;

  const headerActions: DrawerAction[] = d.actions.map(({ icon, ...a }) => ({
    ...a,
    icon: <Ico name={icon} />,
  }));

  const periodNode = d.periodStart ? (
    <>
      <DateDisplay date={d.periodStart} />
      {d.periodEnd && d.periodEnd !== d.periodStart && (
        <>
          {" – "}
          <DateDisplay date={d.periodEnd} />
        </>
      )}
    </>
  ) : null;

  // ID ki jagah naam dikhao, naam na ho to ID fallback
  const customerLabel = data?.customer_name || data?.customer;
  const parentProjectLabel =
    data?.parent_project_name || data?.parent_project;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(760px, 100vw)"
      scrollBody={false}
      icon={
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      }
      kicker="Timesheet Details"
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {data?.name ?? "—"}
          {data && (
            <button
              onClick={d.copyId}
              title="Copy ID"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 11,
              }}
            >
              {d.copied ? "✓" : "⧉"}
            </button>
          )}
        </span>
      }
      statusLabel={d.meta.label}
      statusClassName={d.meta.cls}
      headerActions={headerActions}
      loading={loading}
    >
      {data && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 6,
              }}
            >
              <span
                style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}
              >
                {data.title}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontFamily: "monospace",
                }}
              >
                <DateDisplay date={d.periodStart ?? data.start_date} /> –{" "}
                <DateDisplay date={d.periodEnd ?? data.end_date} />
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <Chip>{data.employee}</Chip>
              {data.employee_name && <Chip>{data.employee_name}</Chip>}
              {customerLabel && <Chip>{customerLabel}</Chip>}
              {parentProjectLabel && <Chip>{parentProjectLabel}</Chip>}
            </div>

            <DrawerSummaryCards
              items={[
                {
                  label: "Total Hours",
                  value: `${(data.total_hours ?? 0).toFixed(1)} hrs`,
                },
                ...(showFinancials
                  ? [
                      {
                        label: "Billable Hours",
                        value: `${(data.total_billable_hours ?? 0).toFixed(1)} hrs`,
                      },
                      {
                        label: "Costing",
                        value: d.money(data.total_costing_amount),
                      },
                      {
                        label: "Billed Amount",
                        value: d.money(data.total_billed_amount),
                        emphasis: true,
                      },
                    ]
                  : []),
              ]}
            />

            <div
              style={{
                display: "flex",
                gap: 4,
                marginTop: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              {d.tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => d.setTab(t.id)}
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    color: d.tab === t.id ? "var(--primary)" : "var(--muted)",
                    borderBottom:
                      d.tab === t.id
                        ? "2px solid var(--primary)"
                        : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 12 }}
          >
            {d.tab === "overview" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <Card title="Timesheet Information">
                  <Row label="Timesheet ID" value={data.name} />
                  <Row label="Title" value={data.title} />
                  <Row label="Status" value={d.meta.label} />
                  <Row label="Employee" value={data.employee} />
                  <Row label="Employee Name" value={data.employee_name} />
                  <Row label="Customer" value={customerLabel} />
                  <Row label="Company" value={data.company} />
                  <Row label="Department" value={data.department} />
                  {showFinancials && (
                    <Row label="Currency" value={data.currency} />
                  )}
                  {showFinancials && (
                    <Row label="Exchange Rate" value={data.exchange_rate} />
                  )}
                  <Row label="Parent Project" value={parentProjectLabel} />
                  <Row label="Timesheet Period" value={periodNode} />
                </Card>

                {(showEmployeeCard || showFinancials) && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {showEmployeeCard && (
                      <Card title="Employee & Customer">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: "var(--primary)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 14,
                            }}
                          >
                            {getInitials(
                              data.employee_name || data.title || "?",
                            )}
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "var(--text)",
                              }}
                            >
                              {data.employee_name || data.title}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                fontFamily: "monospace",
                              }}
                            >
                              {data.employee}
                            </p>
                          </div>
                        </div>
                        <Row label="Customer" value={customerLabel} />
                        <Row label="Company" value={data.company} />
                        <Row label="Department" value={data.department} />
                      </Card>
                    )}

                    {showFinancials && (
                      <Card title="Financial Summary">
                        <Row
                          label="Total Billable Amount"
                          value={d.money(data.total_billable_amount)}
                          strong
                        />
                        <Row
                          label="Total Costing Amount"
                          value={d.money(data.total_costing_amount)}
                          strong
                        />
                        {d.rate > 0 && (
                          <>
                            <Row
                              label="Base Billable Amount"
                              value={fmtBase(
                                (data.total_billable_amount ?? 0) * d.rate,
                              )}
                            />
                            <Row
                              label="Base Costing Amount"
                              value={fmtBase(
                                (data.total_costing_amount ?? 0) * d.rate,
                              )}
                            />
                          </>
                        )}
                        <Row label="Exchange Rate" value={data.exchange_rate} />
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {d.tab === "logs" && (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <style>{LOG_CSS}</style>
                <div
                  className="ts-log-grid ts-log-head"
                  style={{
                    ...logGridVars,
                    padding: "6px 10px",
                    gap: 4,
                    background: "var(--table-head)",
                    color: "var(--table-head-text)",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Activity</span>
                  <span>Description</span>
                  <span>Time</span>
                  <span style={{ textAlign: "right" }}>Hours</span>
                  {showFinancials && (
                    <span style={{ textAlign: "right" }}>Amount</span>
                  )}
                </div>

                {d.logs.length === 0 && (
                  <p
                    style={{
                      padding: 16,
                      fontSize: 12,
                      color: "var(--muted)",
                      textAlign: "center",
                    }}
                  >
                    No time logs
                  </p>
                )}

                {d.logs.map((log, i) => {
                  const projectLabel = log.project_name || log.project;
                  const taskLabel = log.task_name || log.task;
                  return (
                    <div
                      key={log.name ?? i}
                      className="idm-irow ts-log-grid"
                      style={{
                        ...logGridVars,
                        padding: "7px 10px",
                        gap: 6,
                        borderTop: "1px solid var(--border)",
                        alignItems: "start",
                      }}
                    >
                      <div data-label="Activity" style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                            wordBreak: "break-word",
                          }}
                        >
                          {log.activity_type || "—"}
                        </p>
                        {projectLabel && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              marginTop: 2,
                              wordBreak: "break-word",
                              lineHeight: 1.4,
                            }}
                          >
                            Project: {projectLabel}
                          </p>
                        )}
                        {taskLabel && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              marginTop: 2,
                              wordBreak: "break-word",
                              lineHeight: 1.4,
                            }}
                          >
                            Task: {taskLabel}
                          </p>
                        )}
                      </div>
                      <p
                        data-label="Description"
                        style={{
                          fontSize: 12,
                          color: "var(--text)",
                          wordBreak: "break-word",
                          lineHeight: 1.4,
                          minWidth: 0,
                        }}
                      >
                        {log.description || "—"}
                      </p>
                      <div
                        data-label="Time"
                        style={{
                          minWidth: 0,
                          fontSize: 11,
                          color: "var(--text)",
                          lineHeight: 1.5,
                        }}
                      >
                        <p style={{ wordBreak: "break-word" }}>
                          <span style={{ color: "var(--muted)" }}>Start: </span>
                          {fmtDateTime(log.from_time)}
                        </p>
                        <p style={{ wordBreak: "break-word" }}>
                          <span style={{ color: "var(--muted)" }}>End: </span>
                          {fmtDateTime(log.to_time)}
                        </p>
                      </div>
                      <p
                        data-label="Hours"
                        style={{
                          fontSize: 12,
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        {(log.hours ?? 0).toFixed(1)}h
                      </p>
                      {showFinancials && (
                        <p
                          data-label="Amount"
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            wordBreak: "break-word",
                          }}
                        >
                          {log.is_billable ? d.money(log.billing_amount) : "—"}
                        </p>
                      )}
                    </div>
                  );
                })}

                {d.logs.length > 0 && (
                  <div
                    className="ts-log-grid"
                    style={{
                      ...logGridVars,
                      padding: "8px 10px",
                      gap: 4,
                      borderTop: "2px solid var(--border)",
                      background: "var(--bg)",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <span>Total</span>
                    <span />
                    <span />
                    <span data-label="Hours" style={{ textAlign: "right" }}>
                      {d.logHours.toFixed(1)}h
                    </span>
                    {showFinancials && (
                      <span
                        data-label="Amount"
                        style={{ textAlign: "right", wordBreak: "break-word" }}
                      >
                        {d.money(d.logAmount)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {d.tab === "billing" && showFinancials && (
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <MoneyCell
                    label="Billable Amount"
                    value={d.money(data.total_billable_amount)}
                    color="var(--primary)"
                  />
                  <MoneyCell
                    label="Costing Amount"
                    value={d.money(data.total_costing_amount)}
                  />
                  <MoneyCell
                    label="Billed Amount"
                    value={d.money(data.total_billed_amount)}
                    color="var(--success)"
                  />
                  <MoneyCell
                    label="Billable Hours"
                    value={`${(data.total_billable_hours ?? 0).toFixed(1)} hrs`}
                  />
                  <MoneyCell
                    label="Billed Hours"
                    value={`${(data.total_billed_hours ?? 0).toFixed(1)} hrs`}
                  />
                  <MoneyCell
                    label="Margin"
                    value={d.money(d.margin)}
                    color="var(--success)"
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...labelStyle, flexShrink: 0 }}>% Billed</span>
                  <div
                    style={{
                      flex: 1,
                      background: "var(--border)",
                      borderRadius: 20,
                      height: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${d.billedPct}%`,
                        background: "var(--success)",
                        height: 6,
                        borderRadius: 20,
                        transition: "width .3s",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: "monospace",
                    }}
                  >
                    {d.billedPct}%
                  </span>
                </div>
                {d.logs.length > 0 && (
                  <p
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      marginTop: 8,
                    }}
                  >
                    Logs costing total: {d.money(d.logCost)}
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