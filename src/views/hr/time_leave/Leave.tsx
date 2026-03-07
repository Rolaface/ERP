import React, { useState } from "react";
import { Calendar, ClipboardList, Users } from "lucide-react";
import LeaveManagement from "./LeaveApproval";
import LeaveApply from "./LeaveApply";
import History from "./History";
import LeaveAllocation from "../../../components/Hr/leave/setup/LeaveAllocation";

const Leave: React.FC = () => {
  const [tab, setTab] = useState<
    | "assign"
    | "approve"
    | "apply"
  >("assign");

  const [editLeaveId, setEditLeaveId] = useState<string | null>(null);

  return (
    <div className=" bg-app">
      <div className="space-y-6">
        {/* top tabs */}
        <div className="flex gap-8 overflow-x-auto">
          <button
            onClick={() => setTab("assign")}
            className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition ${
              tab === "assign"
                ? "text-primary border-primary"
                : "text-muted border-transparent hover:text-main"
            }`}
          >
            <Users size={15} /> Assign / Balance
          </button>

          <button
            onClick={() => setTab("approve")}
            className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition
    ${
      tab === "approve"
        ? "text-primary border-primary"
        : "text-muted border-transparent hover:text-main"
    }`}
          >
            <ClipboardList size={15} />
            Approve
          </button>
          <button
            onClick={() => setTab("apply")}
            className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition ${
              tab === "apply"
                ? "text-primary border-primary"
                : "text-muted border-transparent hover:text-main"
            }`}
          >
            <Calendar size={15} /> Leave Apply
          </button>
        </div>

        <div>
          {tab === "assign" && (
            <LeaveAllocation
              employeeId=""
              onAdd={() => {
                // allocation list refresh handled inside component
              }}
            />
          )}

          {tab === "approve" && (
            <div className="space-y-6">
              <LeaveManagement />
              <History
                onNewRequest={() => {
                  setEditLeaveId(null);
                  setTab("apply");
                }}
                onEditLeave={(leaveId) => {
                  setEditLeaveId(leaveId);
                  setTab("apply");
                }}
              />
            </div>
          )}

          {tab === "apply" && <LeaveApply editLeaveId={editLeaveId} />}
        </div>
      </div>
    </div>
  );
};

export default Leave;
