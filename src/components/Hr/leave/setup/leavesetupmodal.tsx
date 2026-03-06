// LeaveSetupModal.tsx
import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";

import { LeaveType } from "./LeaveType";
import { LeaveTypeForm } from "./LeaveTypeForm";
import { LeavePeriod } from "./LeavePeriod";
import { LeavePeriodForm } from "./LeavePeriodForm";
import { LeavePolicy } from "./LeavePolicy";
import { LeavePolicyForm } from "./LeavePolicyForm";
import { LeaveBlockList, LeaveBlockListForm } from "./LeaveBlockList";
import LeaveAllocation from "./LeaveAllocation";
import LeaveAllocationForm from "./LeaveAllocationForm";

import { LeaveEncashment } from "./LeaveEncashment";
import { LeaveEncashmentForm } from "./LeaveEncashmentForm";
import { LeavePolicyAssignment } from "./LeavePolicyAssignment";
import { LeavePolicyAssignmentForm } from "./LeavePolicyAssignmentForm";
import { HolidayList } from "./HolidayList";
import { HolidayListForm } from "./HolidayListForm";

export type ViewType =
  | "setup-menu"
  | "allocation-menu"
  | "holiday-list"
  | "holiday-form"
  | "leave-allocation"
  | "allocation-form"
  | "leave-type"
  | "leave-type-form"
  | "leave-period"
  | "leave-period-form"
  | "leave-policy"
  | "leave-policy-form"
  | "leave-block-list"
  | "leave-block-form"
  | "leave-encashment"
  | "encashment-form"
  | "policy-assignment"
  | "policy-assignment-form";

interface LeaveSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ViewType;
}

const LeaveSetupModal: React.FC<LeaveSetupModalProps> = ({
  isOpen,
  onClose,
  initialView = "setup-menu",
}) => {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [refreshHolidayList, setRefreshHolidayList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
    }
  }, [isOpen, initialView]);

  const setupOptions = [
    { name: "Holiday List", view: "holiday-list" as ViewType },
    { name: "Leave Type", view: "leave-type" as ViewType },
    { name: "Leave Period", view: "leave-period" as ViewType },
    { name: "Leave Policy", view: "leave-policy" as ViewType },
    { name: "Leave Block List", view: "leave-block-list" as ViewType },
  ];

  const allocationOptions = [
    { name: "Leave Allocation", view: "leave-allocation" as ViewType },
    { name: "Leave Policy Assignment", view: "policy-assignment" as ViewType },
    { name: "Leave Encashment", view: "leave-encashment" as ViewType },
  ];

  if (!isOpen) return null;

  const isSetupMenu = currentView === "setup-menu";
  const isAllocationMenu = currentView === "allocation-menu";
  const showMenu = isSetupMenu || isAllocationMenu;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[720px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <FaCog className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isSetupMenu
                ? "Leave Configuration"
                : isAllocationMenu
                  ? "Leave Allocation"
                  : "Leave Setup & Configuration"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 p-2 rounded-lg transition hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-white">
          {/* Setup Menu */}
          {isSetupMenu && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {setupOptions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentView(item.view)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all group"
                  >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                      {item.name}
                    </span>
                    <svg
                      className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Allocation Menu */}
          {isAllocationMenu && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {allocationOptions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentView(item.view)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all group"
                  >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                      {item.name}
                    </span>
                    <svg
                      className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Holiday List - Placeholder */}
          {currentView === "holiday-list" && (
            <div className="p-6">
              <HolidayList
                key={refreshHolidayList.toString()} // forces reload
                onAdd={() => setCurrentView("holiday-form")}
                onClose={() => setCurrentView("setup-menu")}
              />
            </div>
          )}

          {currentView === "holiday-form" && (
            <div className="p-6">
              <HolidayListForm
                onClose={() => setCurrentView("holiday-list")}
                onSuccess={() => {
                  setRefreshHolidayList((prev) => !prev);
                }}
              />
            </div>
          )}

          {/* Leave Type */}
          {currentView === "leave-type" && (
            <div className="p-6">
              <LeaveType
                onAdd={() => setCurrentView("leave-type-form")}
                onClose={() => setCurrentView("setup-menu")}
              />
            </div>
          )}
          {currentView === "leave-type-form" && (
            <div className="p-6">
              <LeaveTypeForm onClose={() => setCurrentView("leave-type")} />
            </div>
          )}

          {/* Leave Period */}
          {currentView === "leave-period" && (
            <div className="p-6">
              <LeavePeriod
                onAdd={() => setCurrentView("leave-period-form")}
                onClose={() => setCurrentView("setup-menu")}
              />
            </div>
          )}
          {currentView === "leave-period-form" && (
            <div className="p-6">
              <LeavePeriodForm onClose={() => setCurrentView("leave-period")} />
            </div>
          )}

          {/* Leave Policy */}
          {currentView === "leave-policy" && (
            <div className="p-6">
              <LeavePolicy
                onAdd={() => setCurrentView("leave-policy-form")}
                onClose={() => setCurrentView("setup-menu")}
              />
            </div>
          )}
          {currentView === "leave-policy-form" && (
            <div className="p-6">
              <LeavePolicyForm onClose={() => setCurrentView("leave-policy")} />
            </div>
          )}

          {/* Leave Block List */}
          {currentView === "leave-block-list" && (
            <div className="p-6">
              <LeaveBlockList
                onAdd={() => setCurrentView("leave-block-form")}
                onClose={() => setCurrentView("setup-menu")}
              />
            </div>
          )}
          {currentView === "leave-block-form" && (
            <div className="p-6">
              <LeaveBlockListForm
                onClose={() => setCurrentView("leave-block-list")}
              />
            </div>
          )}

          {/* Leave Allocation */}
          {currentView === "leave-allocation" && (
            <div className="p-6">
              <LeaveAllocation
                employeeId={selectedEmployeeId}
                onAdd={() => setCurrentView("allocation-form")}
                onClose={() => setCurrentView("allocation-menu")}
              />
            </div>
          )}
          {currentView === "allocation-form" && (
            <div className="p-6">
              <LeaveAllocationForm
                employeeId={selectedEmployeeId}
                onClose={() => setCurrentView("leave-allocation")}
                onSuccess={() => setCurrentView("leave-allocation")}
              />
            </div>
          )}

          {/* Leave Encashment */}
          {currentView === "leave-encashment" && (
            <div className="p-6">
              <LeaveEncashment
                onAdd={() => setCurrentView("encashment-form")}
                onClose={() => setCurrentView("allocation-menu")}
              />
            </div>
          )}
          {currentView === "encashment-form" && (
            <div className="p-6">
              <LeaveEncashmentForm
                onClose={() => setCurrentView("leave-encashment")}
              />
            </div>
          )}

          {/* Leave Policy Assignment */}
          {currentView === "policy-assignment" && (
            <div className="p-6">
              <LeavePolicyAssignment
                onAdd={() => setCurrentView("policy-assignment-form")}
                onClose={() => setCurrentView("allocation-menu")}
              />
            </div>
          )}
          {currentView === "policy-assignment-form" && (
            <div className="p-6">
              <LeavePolicyAssignmentForm
                onClose={() => setCurrentView("policy-assignment")}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveSetupModal;
