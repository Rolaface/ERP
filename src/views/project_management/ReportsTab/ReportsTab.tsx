import React, { useState } from "react";
import { HrTableFrame } from "../../../views/hr/components/HrTabLayout";
import ReportMenu from "./ReportMenu";
import ReportView from "../report/ReportView";
import {
  PROJECT_REPORT_OPTIONS,
  type ReportOption,
} from "../../../views/project_management/reportOptions";

const REPORT_HEIGHT = "calc(100vh - 150px)";

const TimesheetReportsTab: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportOption | null>(null);

  return (
    <HrTableFrame>
      {activeReport ? (
        <div style={{ height: REPORT_HEIGHT }}>
          <ReportView
            key={activeReport.key}
            report={activeReport}
           
          />
        </div>
      ) : (
        <div className="p-3">
          <ReportMenu
            options={PROJECT_REPORT_OPTIONS}
            onSelect={setActiveReport}
          />
        </div>
      )}
    </HrTableFrame>
  );
};

export default TimesheetReportsTab;