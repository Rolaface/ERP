import React, { useState } from "react";
import ReportView from "../report/ReportView";
import { PROJECT_REPORT_OPTIONS as REPORTS } from "../../project_management/reportOptions";

const labelCls = "text-[9px] font-black uppercase tracking-widest text-muted";
const selectCls =
  "h-8 min-w-[200px] px-2.5 text-xs font-semibold border border-[var(--border)] rounded-md bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

const ReportsHub: React.FC = () => {
  const [activeKey, setActiveKey] = useState(REPORTS[0]?.key);

  const active = REPORTS.find((r) => r.key === activeKey) ?? REPORTS[0];

  if (!active) return null;

  const selector = (
    <div className="flex flex-col gap-1">
      <label htmlFor="report-select" className={labelCls}>
        Report
      </label>
      <select
        id="report-select"
        value={active.key}
        onChange={(e) => setActiveKey(e.target.value)}
        className={selectCls}
      >
        {REPORTS.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );

  return <ReportView key={active.key} report={active} leading={selector} />;
};

export default ReportsHub;