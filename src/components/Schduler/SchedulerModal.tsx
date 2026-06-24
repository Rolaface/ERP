import React, { useState, useEffect, useRef } from "react";
import { CalendarClock } from "lucide-react";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { MinimizableModal } from "../common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { showApiError, showSuccess } from "../../utils/alert"; 

type ModalMode = "add" | "edit" | "view";

export interface SchedulerFormValues {
  schedulerName: string;
  frequency: string;
  enabled: boolean;
}

export interface SchedulerRecord extends SchedulerFormValues {
  id: string;
}

interface SchedulerModalProps {
  modalId: string;
  mode: ModalMode;
  record: SchedulerRecord | null;
  onClose: () => void;
  onSubmit: (values: SchedulerFormValues) => void;
}

const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Yearly"];

const SCHEDULER_NAME_OPTIONS = ["Payment Reminder"];

const DEFAULT_VALUES: SchedulerFormValues = {
  schedulerName: "",
  frequency: "Monthly",
  enabled: true,
};

const SchedulerModal: React.FC<SchedulerModalProps> = ({
  modalId,
  mode,
  record,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState<SchedulerFormValues>(DEFAULT_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const formContainerRef = useRef<HTMLElement | null>(null);
  const isView = mode === "view";

  const { markDirty, resetDirty, handleCloseWithConfirm } =
    useUnsavedChangesGuard();

  useEffect(() => {
    setValues(
      record
        ? {
            schedulerName: record.schedulerName,
            frequency: record.frequency,
            enabled: record.enabled,
          }
        : DEFAULT_VALUES
    );
    resetDirty();
  }, [record, mode]);

  const handleChange = (
    field: keyof SchedulerFormValues,
    value: string | boolean
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  const handleClose = () => {
    if (isView) {
      onClose();
      return;
    }
    handleCloseWithConfirm(onClose, modalId);
  };

  const handleReset = () => {
    setValues(
      record
        ? {
            schedulerName: record.schedulerName,
            frequency: record.frequency,
            enabled: record.enabled,
          }
        : DEFAULT_VALUES
    );
    resetDirty();
  };

 const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await onSubmit(values);
    showSuccess(
      mode === "add"
        ? "Scheduler added successfully."
        : "Scheduler updated successfully."
    );
    resetDirty();
  } catch (err) {
    showApiError(err); 
  } finally {
    setSubmitting(false);
  }
};
const title =
  mode === "add"
    ? "Add Scheduler"
    : mode === "edit"
    ? "Edit Scheduler"
    : "Scheduler";

const subtitle =                                   
  mode === "add"
    ? "Add a new scheduler"
    : mode === "edit"
    ? "Update scheduler details"
    : "View scheduler details";

return (
    <MinimizableModal
      modalId={modalId}
      isOpen={true}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      icon={CalendarClock}
      maxWidth="md"
      height="320px"
      formContainerRef={formContainerRef}
      footer={
        !isView ? (
          <ModalFooter
            onCancel={handleClose}
            onReset={handleReset}
            onSubmit={handleSubmit}
            saving={submitting} 
            submitLabel={mode === "add" ? "Submit" : "Update"}
          />
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Scheduler Name
          </label>
          <select
            disabled={isView}
            value={values.schedulerName}
            onChange={(e) => handleChange("schedulerName", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-app text-main disabled:opacity-60"
          >
            <option value="">Select Scheduler</option>
            {SCHEDULER_NAME_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Frequency</label>
          <select
            disabled={isView}
            value={values.frequency}
            onChange={(e) => handleChange("frequency", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-app text-main disabled:opacity-60"
          >
            {FREQUENCY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

      

      </div>
    </MinimizableModal>
  );
};

export default SchedulerModal;