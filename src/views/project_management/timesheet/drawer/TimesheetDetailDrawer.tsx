import React from "react";
import Drawer from "../../../../components/ui/Drawer/Drawer";
import {
  DrawerField as F,
  DrawerSection as S,
  DrawerSummaryCards,
} from "../../../../components/ui/Drawer/DrawerPrimitives";
import type { TimesheetDetail } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import { useCurrencySymbols } from "../../../../hooks/Usecurrencysymbols";
const STATUS_MAP: Record<string, string> = {
  Draft: "bg-draft",
  Submitted: "bg-info",
  Billed: "bg-success",
  Cancelled: "bg-danger",
};

const fmtTime = (t?: string) => {
  if (!t) return "—";
  const [datePart, timePart] = t.split(" ");
  return timePart ? timePart.slice(0, 5) : datePart;
};

interface Props {
  open: boolean;
  data: TimesheetDetail | null;
  loading?: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onSubmit?: (id: string) => void;
  actionLoading?: boolean;
}

const footerBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
};

const LOG_GRID_COLS = "minmax(0,1.3fr) minmax(0,1.6fr) 90px 60px 90px";

const TimesheetDetailDrawer: React.FC<Props> = ({
  open,
  data,
  loading,
  onClose,
  onApprove,
  onSubmit,
  actionLoading,
}) => {
  if (!open) return null;

  const currency = data?.currency ?? "";

  const { formatAmount } = useCurrencySymbols(
    data?.currency ? [data.currency] : [],
  );
  const statusCls = STATUS_MAP[data?.status ?? "Draft"] ?? "bg-draft";
  const logs = data?.time_logs ?? [];

  const renderFooter = () => {
    if (!data) return null;

if (data.status === "Submitted" && onApprove) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        padding: "8px 12px",
        color: "var(--success)",
        fontWeight: 600,
        fontSize: 13,
        background: "var(--bg)",
        borderRadius: 8,
        border: "1px solid var(--border)",
      }}
    >
      Approved
    </div>
  );
}

    if (data.status === "Draft" && onSubmit) {
      return (
        <button
          className="idm-btn"
          disabled={actionLoading}
          onClick={() => onSubmit(data.name)}
          style={{
            ...footerBtnStyle,
            flex: 1,
            justifyContent: "center",
            background: "var(--primary)",
            color: "#fff",
          }}
        >
          Approve Timesheet
        </button>
      );
    }

    return (
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "6px 0",
          color: "var(--muted)",
          fontWeight: 600,
          fontSize: 13,
          background: "var(--bg)",
          borderRadius: 8,
          border: "1px solid var(--border)",
        }}
      >
        Status: <span style={{ color: "var(--text)" }}>{data.status}</span>
      </div>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
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
      kicker="Timesheet"
      title={data?.name ?? "—"}
  statusLabel={
  data?.status === "Submitted"
    ? "Approved"
    : data?.status ?? "Draft"
}
      statusClassName={statusCls}
      loading={loading}
      footer={renderFooter()}
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
            {/* Identity strip — who / when, at a glance */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 8,
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              <span
                style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}
              >
                {data.employee_name || data.title}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontFamily: "monospace",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <DateDisplay date={data.start_date} /> – <DateDisplay date={data.end_date} />
              </span>
            </div>

            {/* Key business metrics — hours + billing */}
            <DrawerSummaryCards
              items={[
                {
                  label: "Total Hours",
                  value: `${(data.total_hours ?? 0).toFixed(1)} hrs`,
                },
                {
                  label: "Billable Hours",
                  value: `${(data.total_billable_hours ?? 0).toFixed(1)} hrs`,
                },
                {
                  label: "Billing %",
                  value: `${data.per_billed ?? 0}%`,
                },
                {
                  label: "Billed Amount",
                  value: formatAmount(
                    data.currency,
                    data.total_billed_amount ?? 0,
                    { withSymbol: true },
                  ),
                  emphasis: true,
                },
              ]}
            />

            <S title="Business Information" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 10,
                marginBottom: 7,
              }}
            >
              <F label="Employee" value={data.employee_name || data.title} />
              <F label="Employee ID" value={data.employee} mono />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 8,
              }}
            >
              {data.customer && (
                <F label="Customer" value={data.customer} mono />
              )}
              <F
                label="Currency"
                value={`${data.currency}${data.exchange_rate ? ` (rate ${data.exchange_rate})` : ""}`}
              />
              {data.department && (
                <F label="Department" value={data.department} />
              )}
            </div>
          </div>

          <div style={{ flexShrink: 0, marginTop: 12 }}>
            <S title="Time Logs" />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  background: "var(--bg)",
                  padding: "1px 8px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                }}
              >
                {logs.length} {logs.length === 1 ? "Entry" : "Entries"}
              </span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              borderRadius: 7,
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: LOG_GRID_COLS,
                padding: "6px 10px",
                background: "var(--table-head)",
                color: "var(--table-head-text)",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <span>Activity</span>
              <span>Description</span>
              <span>Time</span>
              <span style={{ textAlign: "right" }}>Hours</span>
              <span style={{ textAlign: "right" }}>Amount</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {logs.map((log, i) => (
                <div
                  key={log.name ?? i}
                  className="idm-irow"
                  style={{
                    display: "grid",
                    gridTemplateColumns: LOG_GRID_COLS,
                    padding: "7px 10px",
                    gap: 4,
                    borderTop: "1px solid var(--border)",
                    alignItems: "start",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text)",
                        lineHeight: 1.4,
                      }}
                    >
                      {log.activity_type}
                    </p>
                    {log.project_name && (
                      <p
                        style={{
                          fontSize: 9,
                          color: "var(--muted)",
                          marginTop: 2,
                        }}
                      >
                        {log.project_name}
                      </p>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text)",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      lineHeight: 1.4,
                    }}
                  >
                    {log.description || "—"}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {fmtTime(log.from_time)} – {fmtTime(log.to_time)}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {(log.hours ?? 0).toFixed(1)}h
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      textAlign: "right",
                      color: "var(--text)",
                    }}
                  >
                    {log.is_billable
                      ? formatAmount(currency, log.billing_amount ?? 0, {
                          withSymbol: true,
                        })
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flexShrink: 0, marginTop: 12 }}>
            <S title="Billing & Financial Summary" />
            <div
              style={{
                background: "var(--bg)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    background: "var(--card)",
                    padding: "8px 10px",
                    borderRadius: 7,
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Billable Amount
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--primary)",
                    }}
                  >
                    {formatAmount(
                      data.currency,
                      data.total_billable_amount ?? 0,
                      {
                        withSymbol: true,
                      },
                    )}
                  </p>
                </div>
                <div
                  style={{
                    background: "var(--card)",
                    padding: "8px 10px",
                    borderRadius: 7,
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Costing Amount
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {formatAmount(
                      data.currency,
                      data.total_costing_amount ?? 0,
                      {
                        withSymbol: true,
                      },
                    )}
                  </p>
                </div>
                <div
                  style={{
                    background: "var(--card)",
                    padding: "8px 10px",
                    borderRadius: 7,
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Billed Amount
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--success)",
                    }}
                  >
                    {formatAmount(
                      data.currency,
                      data.total_billed_amount ?? 0,
                      {
                        withSymbol: true,
                      },
                    )}
                  </p>
                </div>
                <div
                  style={{
                    background: "var(--card)",
                    padding: "8px 10px",
                    borderRadius: 7,
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Billable Hours
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {(data.total_billable_hours ?? 0).toFixed(1)} hrs
                  </p>
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}>
                    % Billed
                  </span>
                  <span style={{ fontWeight: 800, fontFamily: "monospace" }}>
                    {data.per_billed ?? 0}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    background: "var(--border)",
                    borderRadius: 20,
                    height: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${data.per_billed ?? 0}%`,
                      background: "var(--success)",
                      height: 6,
                      borderRadius: 20,
                      transition: "width .3s",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default TimesheetDetailDrawer;