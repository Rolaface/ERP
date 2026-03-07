// LeavePeriod.tsx
import React, { useState } from "react";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { LeavePeriodForm } from "./LeavePeriodForm";

export interface LeavePeriodProps {
  onAdd: () => void;
  onClose?: () => void;
}

export const LeavePeriod: React.FC<LeavePeriodProps> = ({ onAdd, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const periods = [
    {
      name: "2025",
      from: "2025-01-01",
      to: "2025-12-31",
      status: "Active",
    },
    {
      name: "2026",
      from: "2026-01-01",
      to: "2026-12-31",
      status: "Active",
    },
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
            <h2 className="text-xl font-bold text-main">Leave Period</h2>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl font-semibold transition hover:bg-primary/90"
          >
            <Plus size={18} />
            Add Leave Period
          </button>
        </div>

        {/* Meta Info */}
        <div className="px-6 py-3 border-b border-theme flex items-center justify-between">
          <span className="text-sm text-muted">
            {periods.length} Leave Periods
          </span>
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
                  Period Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  From Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  To Date
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, i) => (
                <tr
                  key={i}
                  className="row-hover border-b border-theme transition cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" className="w-4 h-4" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <span className="font-medium text-main">
                        {period.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-main">{period.from}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-main">{period.to}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-card border border-theme text-main">
                      {period.status}
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
            Showing{" "}
            <span className="font-semibold text-main">1-{periods.length}</span>{" "}
            of <span className="font-semibold text-main">{periods.length}</span>{" "}
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
            <LeavePeriodForm
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
