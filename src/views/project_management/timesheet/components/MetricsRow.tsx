import {
  FaClock,
  FaPaperPlane,
  FaFilePen,
  FaCircleCheck,
  FaCoins,
  FaHourglassHalf,
} from "react-icons/fa6";
import type { TimesheetEntry } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";

interface Props {
  timesheets: TimesheetEntry[];
  showFinancials?: boolean;
  hideDraft?: boolean;
}

const MetricsRow: React.FC<Props> = ({
  timesheets,
  showFinancials = true,
  hideDraft = false,
}) => {
  const totalHours = timesheets.reduce((s, t) => s + (t.total_hours || 0), 0);
  const draftCount = timesheets.filter((t) => t.status === "Draft").length;
  const pendingCount = timesheets.filter(
    (t) => t.status === "Pending For Approval",
  ).length;
  const approvedCount = timesheets.filter((t) => t.status === "Submitted").length;
  const billedCount = timesheets.filter((t) => t.status === "Billed").length;
  const billedRevenue = timesheets
    .filter((t) => t.status === "Billed")
    .reduce((s, t) => s + (t.total_billed_amount || 0), 0);
  const totalBillable = timesheets.reduce(
    (s, t) => s + (t.total_billable_amount || 0),
    0,
  );
  const totalCosting = timesheets.reduce(
    (s, t) => s + (t.total_costing_amount || 0),
    0,
  );

  const cards = [
    {
      label: "Total Hours",
      value: `${totalHours.toFixed(1)} hrs`,
      icon: <FaClock size={12} />,
      tone: "text-primary",
    },
    ...(hideDraft
      ? []
      : [
          {
            label: "Draft",
            value: `${draftCount} drafts`,
            icon: <FaFilePen size={12} />,
            tone: "text-warning",
          },
        ]),
    {
      label: "Pending Approval",
      value: `${pendingCount} timesheets`,
      icon: <FaHourglassHalf size={12} />,
      tone: "text-info",
    },
    {
      label: "Approved",
      value: `${approvedCount} timesheets`,
      icon: <FaPaperPlane size={12} />,
      tone: "text-success",
    },
    ...(showFinancials
      ? [
          {
            label: "Billed",
            value: `${billedCount} (₹${billedRevenue.toLocaleString()})`,
            icon: <FaCircleCheck size={12} />,
            tone: "text-success",
          },
        ]
      : []),
  ];

  const cols = showFinancials
    ? hideDraft
      ? "lg:grid-cols-5"
      : "lg:grid-cols-6"
    : hideDraft
      ? "lg:grid-cols-3"
      : "lg:grid-cols-4";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${cols}`}>
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-md border px-2.5 py-2 flex items-center gap-2"
          style={{ borderColor: "var(--border)", background: "var(--row-hover)" }}
        >
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs ${c.tone}`}
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {c.icon}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[9px] font-semibold text-muted uppercase tracking-wide">
              {c.label}
            </div>
            <div className="text-sm font-bold text-main">{c.value}</div>
          </div>
        </div>
      ))}

      {showFinancials && (
        <div
          className="rounded-md border px-2.5 py-2 flex items-center gap-2"
          style={{ borderColor: "var(--border)", background: "var(--row-hover)" }}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs text-primary"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <FaCoins size={12} />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[9px] font-semibold text-muted uppercase tracking-wide">
              Financial KPI
            </div>
            <div className="text-xs font-bold text-main truncate">
              ₹{totalBillable.toLocaleString()}{" "}
              <span className="text-[9px] text-muted font-normal">Billable</span>
            </div>
            <div className="text-[9px] text-muted truncate">
              ₹{totalCosting.toLocaleString()} Costing
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsRow;