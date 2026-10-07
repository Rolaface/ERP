import { useState } from "react";
import { useCurrencySymbols } from "../../../../hooks/Usecurrencysymbols";
import type { TimesheetDetail } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import { exportTimesheetToExcel } from "../../../../views/project_management/timesheet/components/exportTimesheet";

export type Tab = "overview" | "logs" | "billing";
export type ActionIcon = "edit" | "check" | "x" | "send" | "download";

export interface ActionDef {
  key: string;
  label: string;
  variant?: "primary";
  icon: ActionIcon;
  disabled?: boolean;
  onClick: () => void;
}

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  Draft: { label: "Draft", cls: "bg-draft" },
  "Pending For Approval": { label: "Pending Approval", cls: "bg-info" },
  Submitted: { label: "Approved", cls: "bg-success" },
  Billed: { label: "Billed", cls: "bg-success" },
  Cancelled: { label: "Cancelled", cls: "bg-danger" },
};

const DEFAULT_STATUS = "Draft";
const COPIED_RESET_MS = 1200;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LOG_COLS = "minmax(0,1.3fr) minmax(0,1.6fr) 150px 60px 90px";
const LOG_COLS_NO_AMOUNT = "minmax(0,1.3fr) minmax(0,1.6fr) 150px 60px";

export const fmtDateTime = (t?: string) => {
  if (!t) return "—";
  const [d, tm] = t.split(" ");
  const [y, m, day] = (d ?? "").split("-");
  const month = MONTHS[Number(m) - 1];
  const datePart = y && month && day ? `${day} ${month} ${y}` : d;
  return tm ? `${datePart}, ${tm.slice(0, 5)}` : datePart;
};

interface Params {
  data: TimesheetDetail | null;
  actionLoading?: boolean;
  canWrite?: boolean;
  canSubmit?: boolean;
  canCancel?: boolean;
  showFinancials: boolean;
  onSendForApproval?: (id: string) => void;
  onApprove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function useTimesheetDrawer({
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
}: Params) {
  const { formatAmount } = useCurrencySymbols(
    data?.currency ? [data.currency] : [],
  );
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  const currency = data?.currency ?? "";
  const meta = STATUS_META[data?.status ?? DEFAULT_STATUS] ?? STATUS_META[DEFAULT_STATUS];
  const logs = data?.time_logs ?? [];
  const money = (v?: number) =>
    formatAmount(currency, v ?? 0, { withSymbol: true });
  const rate = data?.exchange_rate ?? 0;
  const billedPct = Math.min(100, Math.max(0, data?.per_billed ?? 0));
  const logHours = logs.reduce((a, l) => a + (l.hours ?? 0), 0);
  const logAmount = logs.reduce(
    (a, l) => a + (l.is_billable ? (l.billing_amount ?? 0) : 0),
    0,
  );
  const logCost = logs.reduce((a, l) => a + (l.costing_amount ?? 0), 0);
  const margin = data
    ? (data.total_billable_amount ?? 0) - (data.total_costing_amount ?? 0)
    : 0;

  const periodStart = data?.custom_timesheet_start_date ?? null;
  const periodEnd = data?.custom_timesheet_end_date ?? null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "logs", label: `Time Logs (${logs.length})` },
    ...(showFinancials
      ? [{ id: "billing" as Tab, label: "Billing & Costing" }]
      : []),
  ];

  const logCols = showFinancials ? LOG_COLS : LOG_COLS_NO_AMOUNT;

  const actions: ActionDef[] = [];
  if (data) {
    if (data.status === "Draft" && canWrite) {
      actions.push({
        key: "edit",
        label: "Edit",
        variant: "primary",
        icon: "edit",
        onClick: () => onEdit?.(data.name),
      });
      actions.push({
        key: "send",
        label: actionLoading ? "Submitting..." : "Submit for Approval",
        icon: "send",
        disabled: actionLoading,
        onClick: () => onSendForApproval?.(data.name),
      });
    }
    if (data.status === "Pending For Approval" && canSubmit) {
      actions.push({
        key: "approve",
        label: actionLoading ? "Approving..." : "Approve",
        variant: "primary",
        icon: "check",
        disabled: actionLoading,
        onClick: () => onApprove?.(data.name),
      });
    }
    if (data.status === "Submitted" && canCancel) {
      actions.push({
        key: "cancel",
        label: "Cancel",
        icon: "x",
        onClick: () => onCancel?.(data.name),
      });
    }
   actions.push({
  key: "export",
  label: "Export",
  icon: "download",
  onClick: () => exportTimesheetToExcel(data, false).catch(),
});
  }

  const copyId = () => {
    if (!data) return;
    navigator.clipboard?.writeText(data.name);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  return {
    tab,
    setTab,
    tabs,
    copied,
    copyId,
    meta,
    logs,
    logCols,
    currency,
    money,
    rate,
    billedPct,
    logHours,
    logAmount,
    logCost,
    margin,
    periodStart,
    periodEnd,
    actions,
  };
}