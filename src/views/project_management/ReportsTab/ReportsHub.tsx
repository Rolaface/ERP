import React, { useEffect, useMemo, useState } from "react";
import ReportView from "../report/ReportView";
import { PROJECT_REPORT_OPTIONS as REPORTS } from "../../project_management/reportOptions";
import { usePermission } from "../../../hooks/permission/usePermission";

const labelCls =
  "text-[9px] font-black uppercase tracking-widest text-muted";

const selectCls =
  "h-8 min-w-[200px] px-2.5 text-xs font-semibold border border-[var(--border)] rounded-md bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

const ReportsHub: React.FC = () => {
  const { can } = usePermission();

  const visibleReports = useMemo(
    () =>
      REPORTS.filter((report) =>
        can(report.permission.module, report.permission.action),
      ),
    [can],
  );

  const [activeKey, setActiveKey] = useState<string | undefined>(
    visibleReports[0]?.key,
  );

  useEffect(() => {
    if (!visibleReports.some((report) => report.key === activeKey)) {
      setActiveKey(visibleReports[0]?.key);
    }
  }, [visibleReports, activeKey]);

  const active = visibleReports.find((report) => report.key === activeKey);

  if (!active) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-[var(--border)] bg-card p-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-main">No reports available</p>
          <p className="mt-1 text-xs text-muted">
            You do not have permission to access any reports.
          </p>
        </div>
      </div>
    );
  }

  const selector = (
    <div className="flex flex-col gap-1">
      <label htmlFor="report-select" className={labelCls}>
        Report
      </label>
      <select
        id="report-select"
        value={active.key}
        onChange={(event) => setActiveKey(event.target.value)}
        className={selectCls}
      >
        {visibleReports.map((report) => (
          <option key={report.key} value={report.key}>
            {report.label}
          </option>
        ))}
      </select>
    </div>
  );

  return <ReportView key={active.key} report={active} leading={selector} />;
};

export default ReportsHub;
