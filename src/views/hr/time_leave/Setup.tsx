import React, { useState } from "react";
import { Settings, Users } from "lucide-react";
import LeaveAllocation from "../../../components/Hr/leave/setup/LeaveAllocation";
import { LeavePolicyAssignment } from "../../../components/Hr/leave/setup/LeavePolicyAssignment";
import { LeaveEncashment } from "../../../components/Hr/leave/setup/LeaveEncashment";
import { LeaveType } from "../../../components/Hr/leave/setup/LeaveType";
import { LeavePeriod } from "../../../components/Hr/leave/setup/LeavePeriod";
import { LeavePolicy } from "../../../components/Hr/leave/setup/LeavePolicy";
import { HolidayList } from "../../../components/Hr/leave/setup/HolidayList";
import { LeaveBlockList } from "../../../components/Hr/leave/setup/LeaveBlockList";

type ModalType = "setup" | "allocation" | null;

const Setup: React.FC = () => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [showLeaveType, setShowLeaveType] = useState(false);
  const [showLeavePeriod, setShowLeavePeriod] = useState(false);
  const [showLeavePolicy, setShowLeavePolicy] = useState(false);
  const [showHolidayList, setShowHolidayList] = useState(false);
  const [showLeaveBlockList, setShowLeaveBlockList] = useState(false);
  const [showLeavePolicyAssignment, setShowLeavePolicyAssignment] =
    useState(false);
  const [showLeaveEncashment, setShowLeaveEncashment] = useState(false);
  const [showLeaveAllocation, setShowLeaveAllocation] = useState(false);

  const setupCategories = [
    {
      title: "Leave Configuration",
      description: "Configure leave types, periods, and policies",
      icon: <Settings size={32} className="text-primary" />,
      items: [
        "Leave Types",
        "Leave Periods",
        "Leave Policies",
        "Holiday Lists",
        "Leave Block List",
      ],
      modalType: "setup" as ModalType,
    },
    {
      title: "Leave Allocation",
      description: "Manage leave allocations and encashments",
      icon: <Users size={32} className="text-primary" />,
      items: [
        "Leave Allocation",
        "Leave Policy Assignment",
        "Leave Encashment",
      ],
      modalType: "allocation" as ModalType,
    },
  ];

  return (
    <div className="bg-app">
      <div className="max-w-7xl mx-auto">
        {/* Setup Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {setupCategories.map((category, idx) => (
            <div
              key={idx}
              className="bg-card border border-theme rounded-2xl p-6 transition cursor-pointer group hover:border-primary/50"
              onClick={() => setModalType(category.modalType)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-card border border-theme rounded-xl transition group-hover:border-primary/50">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-main text-lg mb-1">
                    {category.title}
                  </h3>
                  <p className="text-muted text-sm">{category.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted bg-muted/5 border border-border rounded-lg transition hover:bg-primary/10 hover:text-primary hover:border-primary active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item === "Leave Types") {
                        setShowLeaveType(true);
                      } else if (item === "Leave Periods") {
                        setShowLeavePeriod(true);
                      } else if (item === "Leave Policies") {
                        setShowLeavePolicy(true);
                      } else if (item === "Holiday Lists") {
                        setShowHolidayList(true);
                      } else if (item === "Leave Block List") {
                        setShowLeaveBlockList(true);
                      } else if (item === "Leave Policy Assignment") {
                        setShowLeavePolicyAssignment(true);
                      } else if (item === "Leave Encashment") {
                        setShowLeaveEncashment(true);
                      } else if (item === "Leave Allocation") {
                        setShowLeaveAllocation(true);
                      }
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLeaveType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <LeaveType
              onAdd={() => {}}
              onClose={() => setShowLeaveType(false)}
            />
          </div>
        </div>
      )}

      {showLeavePeriod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <LeavePeriod
              onAdd={() => {}}
              onClose={() => setShowLeavePeriod(false)}
            />
          </div>
        </div>
      )}

      {showLeavePolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <LeavePolicy
              onAdd={() => {}}
              onClose={() => setShowLeavePolicy(false)}
            />
          </div>
        </div>
      )}

      {showHolidayList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <HolidayList
              onAdd={() => {}}
              onClose={() => setShowHolidayList(false)}
            />
          </div>
        </div>
      )}

      {showLeaveBlockList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <LeaveBlockList
              onAdd={() => {}}
              onClose={() => setShowLeaveBlockList(false)}
            />
          </div>
        </div>
      )}

      {showLeaveAllocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <LeaveAllocation
              employeeId=""
              onAdd={() => {}}
              onClose={() => setShowLeaveAllocation(false)}
            />
          </div>
        </div>
      )}

      {showLeavePolicyAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <LeavePolicyAssignment
              onAdd={() => {}}
              onClose={() => setShowLeavePolicyAssignment(false)}
            />
          </div>
        </div>
      )}

      {showLeaveEncashment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <LeaveEncashment
              onAdd={() => {}}
              onClose={() => setShowLeaveEncashment(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Setup;
