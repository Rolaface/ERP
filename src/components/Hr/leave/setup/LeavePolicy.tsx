// LeavePolicy.tsx
import React, { useState } from "react";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { LeavePolicyForm } from "./LeavePolicyForm";

export interface LeavePolicyProps {
  onAdd: () => void;
  onClose?: () => void;
}

export const LeavePolicy: React.FC<LeavePolicyProps> = ({ onAdd, onClose }) => {
  const [showForm, setShowForm] = useState(false);
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
            <h2 className="text-xl font-bold text-main">Leave Policy</h2>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl font-semibold transition hover:bg-primary/90"
          >
            <Plus size={18} />
            Add Leave Policy
          </button>
        </div>

        {/* Meta Info */}
        <div className="px-6 py-3 border-b border-theme flex items-center justify-between">
          <span className="text-sm text-muted">0 Policies</span>
          <span className="text-xs text-muted">
            Last Updated On: Jan 15, 2026
          </span>
        </div>

        {/* Empty State */}
        <div className="p-16 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-6 w-20 h-20 mx-auto rounded-2xl bg-card border border-theme inline-flex items-center justify-center">
              <FileText size={40} className="text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-main mb-2">
              No Leave Policies Yet
            </h3>
            <p className="text-muted text-sm mb-6">
              Create your first leave policy to define rules and eligibility
              criteria for different types of leaves
            </p>
          </div>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl rounded-lg">
            <LeavePolicyForm
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
