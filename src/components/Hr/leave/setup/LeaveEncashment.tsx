// LeaveEncashment.tsx
import React from "react";
import { ArrowLeft, Plus, Banknote } from "lucide-react";

export interface LeaveEncashmentProps {
  onAdd: () => void;
  onClose?: () => void;
}

export const LeaveEncashment: React.FC<LeaveEncashmentProps> = ({
  onAdd,
  onClose,
}) => {
  return (
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
          <h2 className="text-xl font-bold text-main">Leave Encashment</h2>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl font-semibold transition"
        >
          <Plus size={18} />
          Add Leave Encashment
        </button>
      </div>

      {/* Meta Info */}
      <div className="px-6 py-3 border-b border-theme flex items-center justify-between">
        <span className="text-sm text-muted">0 Encashments</span>
        <span className="text-xs text-muted">
          Last Updated On: Jan 15, 2026
        </span>
      </div>

      {/* Empty State */}
      <div className="p-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6 w-20 h-20 mx-auto rounded-2xl bg-card border border-theme inline-flex items-center justify-center">
            <Banknote size={40} className="text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-main mb-2">
            No Leave Encashments Yet
          </h3>
          <p className="text-muted text-sm mb-6">
            Process leave encashment for employees who want to convert their
            unused leaves to cash
          </p>
          <button
            onClick={onAdd}
            className="px-6 py-3 bg-primary rounded-xl font-semibold transition flex items-center gap-2 mx-auto"
          >
            <Plus size={18} />
            Create Encashment
          </button>
        </div>
      </div>
    </div>
  );
};
