import React from "react";
import Drawer from "../../../../components/ui/Drawer/Drawer";
import {
  DrawerField as F,
  DrawerSection as S,
  DrawerSummaryCards,
} from "../../../../components/ui/Drawer/DrawerPrimitives";
import type {
  TaskDetail,
  TaskStatus,
} from "../../../../types/Project_Management/task/table/Task.types";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import { parseAssignedEmails } from "../../../../api/project/task/taskapi";
import { fireManagedSwal } from "../../../../utils/swalManager";
const STATUS_MAP: Record<string, string> = {
  Open: "bg-draft",
  Working: "bg-info",
  "Pending Review": "bg-info",
  Overdue: "bg-danger",
  Template: "bg-draft",
  Completed: "bg-success",
  Cancelled: "bg-danger",
};

const STATUS_OPTIONS: TaskStatus[] = [
  "Open",
  "Working",
  "Pending Review",
  "Overdue",
  "Template",
  "Completed",
  "Cancelled",
];

const PRIORITY_MAP: Record<string, string> = {
  Low: "var(--muted)",
  Medium: "var(--info)",
  High: "var(--warning)",
  Urgent: "var(--danger)",
};

interface Props {
  open: boolean;
  data: TaskDetail | null;
  loading?: boolean;
  canEditStatus?: boolean;
  showFinancials?: boolean; // default true
  onClose: () => void;
  onStatusChange?: (taskName: string, nextStatus: string) => void;
  actionLoading?: boolean;
}

const getDisplayName = (email: string): string => {
  const username = email.split("@")[0];
  return username
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatCurrency = (value?: number): string => {
  const amount = value ?? 0;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const TaskDetailDrawer: React.FC<Props> = ({
  open,
  data,
  loading,
  canEditStatus,
  showFinancials = true,
  onClose,
  onStatusChange,
  actionLoading,
}) => {
  if (!open) return null;

  const statusCls = STATUS_MAP[data?.status ?? "Open"] ?? "bg-draft";
  const assignees = parseAssignedEmails(data?._assign ?? null);
  const dependencies = data?.depends_on ?? [];

  const renderFooter = () => {
    if (!data) return null;

    const handleDrawerSelectChange = async (
      e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
      const nextStatus = e.target.value;
      if (nextStatus === data.status || !onStatusChange) return;

      const result = await fireManagedSwal({
        icon: "warning",
        title: "Change status?",
        text: `Change status to "${nextStatus}"?`,
        showCancelButton: true,
        confirmButtonText: "Yes, change",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
      });

      if (result.isConfirmed) {
        onStatusChange(data.name, nextStatus);
      }

    };

    if (canEditStatus && onStatusChange) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            Update Status
          </span>
          <select
            value={data.status}
            disabled={actionLoading}
            onChange={handleDrawerSelectChange}
            style={{
              flex: 1,
              maxWidth: 220,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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
      scrollBody
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
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      }
      kicker="Task"
      title={data?.name ?? "—"}
      statusLabel={data?.status ?? "Open"}
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
                {data.subject}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: PRIORITY_MAP[data.priority] ?? "var(--muted)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {data.priority} Priority
              </span>
            </div>

            <DrawerSummaryCards
              items={[
                {
                  label: "Progress",
                  value: `${(data.progress ?? 0).toFixed(0)}%`,
                },
                {
                  label: "Actual Time",
                  value: `${(data.actual_time ?? 0).toFixed(1)} hrs`,
                },
                ...(showFinancials
                  ? [
                    {
                      label: "Costing Amount",
                      value: formatCurrency(data.total_costing_amount),
                    },
                    {
                      label: "Billing Amount",
                      value: formatCurrency(data.total_billing_amount),
                      emphasis: true,
                    },
                  ]
                  : []),
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
              <F label="Project" value={data.project ?? "—"} mono />
              <F label="Company" value={data.company ?? "—"} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 10,
                marginBottom: 7,
              }}
            >
              {/* <F
                label="Assigned To"
                value={
                  assignees.length > 0
                    ? assignees.map(getDisplayName).join(", ")
                    : "Unassigned"
                }
              /> */}
              <F label="Created By" value={data.owner} />
            </div>

            <S title="Timeline" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 10,
                marginBottom: 7,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Expected Start
                </span>
                {data.exp_start_date ? (
                  <DateDisplay
                    date={data.exp_start_date}
                    className="text-xs text-main font-medium"
                  />
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </div>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Expected End
                </span>
                {data.exp_end_date ? (
                  <DateDisplay
                    date={data.exp_end_date}
                    className="text-xs text-main font-medium"
                  />
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 10,
                marginBottom: 7,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Actual Start
                </span>
                {data.act_start_date ? (
                  <DateDisplay
                    date={data.act_start_date}
                    className="text-xs text-main font-medium"
                  />
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </div>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Actual End
                </span>
                {data.act_end_date ? (
                  <DateDisplay
                    date={data.act_end_date}
                    className="text-xs text-main font-medium"
                  />
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </div>
            </div>
          </div>

          {showFinancials && (
            <div style={{ flexShrink: 0, marginTop: 12 }}>
              <S title="Costing & Financial Summary" />
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
                      Costing Amount
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      {formatCurrency(data.total_costing_amount)}
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
                      Expense Claim
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      {formatCurrency(data.total_expense_claim)}
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
                      Billing Amount
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--primary)",
                      }}
                    >
                      {formatCurrency(data.total_billing_amount)}
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
                      Actual Time
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      {(data.actual_time ?? 0).toFixed(1)} hrs
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
                      Progress
                    </span>
                    <span style={{ fontWeight: 800, fontFamily: "monospace" }}>
                      {(data.progress ?? 0).toFixed(0)}%
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
                        width: `${data.progress ?? 0}%`,
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
          )}

          {dependencies.length > 0 && (
            <div style={{ flexShrink: 0, marginTop: 12 }}>
              <S title="Dependencies" />
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {dependencies.map((dep, i) => (
                  <div
                    key={dep.name ?? i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: "var(--primary)",
                        fontWeight: 600,
                      }}
                    >
                      {dep.task}
                    </span>
                    {dep.subject && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          maxWidth: "60%",
                          textAlign: "right",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dep.subject}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default TaskDetailDrawer;