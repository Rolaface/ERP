// LeaveType.tsx
import React, { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { LeaveTypeForm } from "./LeaveTypeForm";
export interface LeaveTypeProps {
  onAdd: () => void;
  onClose?: () => void;
}

export const LeaveType: React.FC<LeaveTypeProps> = ({ onAdd, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const rows = [
    { name: "Leave Without Pay", count: 0 },
    { name: "Privilege Leave", count: 0 },
    { name: "Sick Leave", count: 0 },
    { name: "Compensatory Off", count: 0 },
    { name: "Casual Leave", count: 3 },
  ];

  return (
    <>
      <div className="bg-card border border-theme rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-theme">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-muted hover:text-main transition"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-main">Leave Type</h2>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl font-semibold transition hover:bg-primary/90"
          >
            <Plus size={18} />
            Add Leave Type
          </button>
        </div>

        {/* Meta Info */}
        <div className="px-6 py-3 border-b border-theme flex items-center justify-between">
          <span className="text-sm text-muted">{rows.length} Leave Types</span>
          <span className="text-xs text-muted">
            Last Updated On: Jan 15, 2026
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-head">
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  {/* <input type="checkbox" className="w-4 h-4" /> */}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Leave Type Name
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Total Allocations
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="row-hover border-b border-theme transition cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" className="w-4 h-4" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-main">{row.name}</div>
                    <div className="text-xs text-muted mt-1">{row.name}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-theme text-sm font-semibold text-main">
                      {row.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-card border border-theme text-main">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-4 border-t border-theme flex items-center justify-between">
          <div className="text-sm text-muted">
            Showing <span className="font-semibold text-main">1-5</span> of{" "}
            <span className="font-semibold text-main">{rows.length}</span>{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm border border-theme rounded-lg text-muted hover:text-main transition">
              20
            </button>
            <button className="px-3 py-1 text-sm border border-theme rounded-lg text-muted hover:text-main transition">
              100
            </button>
            <button className="px-3 py-1 text-sm border border-theme rounded-lg text-muted hover:text-main transition">
              500
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl rounded-lg">
            <LeaveTypeForm
              onClose={() => setShowForm(false)}
              onSubmit={() => {
                setShowForm(false);
                onAdd();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
