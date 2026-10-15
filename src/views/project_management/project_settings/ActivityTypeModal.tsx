import React, { useState } from "react";
import { FileText } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import { ModalInput, NumericInput, ToggleSwitch } from "../../../components/ui/modal/modalComponent";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// TODO: bind to your real default currency (e.g. useDefault hook)
const CURRENCY = { symbol: "₹", code: "INR" };

interface FormValues {
  name: string;
  billingRate: number | null;
  costingRate: number | null;
  disabled: boolean;
}

const INITIAL: FormValues = {
  name: "",
  billingRate: null,
  costingRate: null,
  disabled: false,
};

const ActivityTypeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const modalId = "activity-type-create";
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL);

  const set = <K extends keyof FormValues>(key: K, v: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const reset = () => setValues(INITIAL);

  const isDirty = JSON.stringify(values) !== JSON.stringify(INITIAL);

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    reset();
    onClose();
  };

  const validate = () => {
    if (!values.name.trim()) {
      showValidationError("Activity Type is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (submitting || !validate()) return;

    try {
      setSubmitting(true);
      // TODO: API → create "Activity Type"
      // await createActivityType({
      //   name: values.name.trim(),
      //   billing_rate: values.billingRate ?? 0,
      //   costing_rate: values.costingRate ?? 0,
      //   disabled: values.disabled ? 1 : 0,
      // });
      showSuccess("Activity Type saved successfully");
      onSuccess?.();
      reset();
      onClose();
    } catch (error: any) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      title="New Activity Type"
      subtitle="Add and manage activity type details"
      icon={FileText}
      footer={
        <ModalFooter
          onCancel={handleClose}
          onReset={reset}
          onSave={handleSave}
          currentTab={0}
          totalTabs={1}
          saving={submitting}
        />
      }
      maxWidth="full"
      height="420px"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="h-full flex flex-col"
        autoComplete="off"
      >
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          <div className="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-3">
            <ModalInput
              label="Activity Type"
              name="name"
              required
              autoFocus
              icon={<FileText size={12} />}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Enter activity type name..."
            />

            <label className="flex flex-col text-sm min-w-0">
              <span className="block text-[10px] font-medium text-main mb-1">
                Default Billing Rate ({CURRENCY.code}) / Hour
              </span>
              <NumericInput
                name="billingRate"
                value={values.billingRate}
                onChange={(v) => set("billingRate", v)}
                decimalScale={2}
                className="w-full"
              />
            </label>

            <label className="flex flex-col text-sm min-w-0">
              <span className="block text-[10px] font-medium text-main mb-1">
                Default Costing Rate ({CURRENCY.code}) / Hour
              </span>
              <NumericInput
                name="costingRate"
                value={values.costingRate}
                onChange={(v) => set("costingRate", v)}
                decimalScale={2}
                className="w-full"
              />
            </label>

            <ToggleSwitch
              name="disabled"
              label="Disabled (hide from future timesheets)"
              checked={values.disabled}
              onChange={(e) => set("disabled", e.target.checked)}
            />
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ActivityTypeModal;