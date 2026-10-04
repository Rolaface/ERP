import React from "react";

interface TimesheetFooterProps {
  isSaving: boolean;
  isLoading: boolean;
  isEditMode: boolean;
  onClose: () => void;
  onSave: () => void;
}

const saveLabel = (isSaving: boolean, isEditMode: boolean) => {
  if (isSaving) return "Saving...";
  return isEditMode ? "Update Timesheet" : "Save Timesheet";
};

const TimesheetFooter: React.FC<TimesheetFooterProps> = ({
  isSaving,
  isLoading,
  isEditMode,
  onClose,
  onSave,
}) => (
  <div className="flex items-center justify-end gap-3 w-full">
    <button
      onClick={onClose}
      className="px-4 py-1.5 border border-theme text-main bg-app rounded-md text-xs font-medium hover:opacity-80 transition-opacity"
    >
      Cancel
    </button>
    <button
      onClick={onSave}
      disabled={isSaving || isLoading}
      className="inline-flex items-center gap-1.5 px-5 py-1.5 bg-primary hover:opacity-90 text-primary-foreground rounded-md text-xs font-semibold transition-opacity shadow-sm disabled:opacity-50"
    >
      {saveLabel(isSaving, isEditMode)}
    </button>
  </div>
);

export default TimesheetFooter;