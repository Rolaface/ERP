import React, { useState } from "react";
import { FileText } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import {
  CheckboxField,
  Field,
  ModalTabs,
  NotSavedBadge,
  RateInput,
  TextInput,
  useModalForm,
  useModalId,
} from "./PmModalParts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TABS = [{ id: "details", label: "Details" }] as const;
type TabId = (typeof TABS)[number]["id"];

// TODO: bind to your real default currency (e.g. useDefault hook)
const CURRENCY = { symbol: "₹", code: "INR" };

const ActivityTypeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const modalId = useModalId("activity-type-create");
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [submitting, setSubmitting] = useState(false);

  const { values, set, reset, confirmClose } = useModalForm({
    name: "",
    billingRate: "",
    costingRate: "",
    disabled: false,
  });

  const handleClose = confirmClose(onClose);

  // Single-tab modal: Next runs the same required-field check as Submit
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
      //   billing_rate: parseFloat(values.billingRate) || 0,
      //   costing_rate: parseFloat(values.costingRate) || 0,
      //   disabled: values.disabled ? 1 : 0,
      // });
      showSuccess("Activity Type saved successfully");
      onSuccess?.();
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
      title={
        <span className="inline-flex items-center">
          New Activity Type
        </span>
      }
      subtitle="Add and manage activity type details"
      icon={FileText}
      footer={
        <ModalFooter
          onCancel={handleClose}
          onReset={reset}
          onSave={handleSave}
          onNext={validate}
          currentTab={0}
          totalTabs={TABS.length}
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
        <ModalTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          {/* One compact row of 3 fields, status underneath */}
          <div className="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-3">
            <Field
              label="Activity Type"
              required
              hint="Used as default identifier for project timesheets and billing logs."
            >
              <TextInput
                name="name"
                autoFocus
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Enter activity type name..."
                icon={<FileText size={12} />}
              />
            </Field>

            <Field
              label={`Default Billing Rate (${CURRENCY.code})`}
              right="Rate / Hour"
              hint="Default rate billed to clients unless overridden in specific contracts."
            >
              <RateInput
                prefix={CURRENCY.symbol}
                value={values.billingRate}
                onChange={(v) => set("billingRate", v)}
              />
            </Field>

            <Field
              label={`Default Costing Rate (${CURRENCY.code})`}
              right="Cost / Hour"
              hint="Baseline internal resource expense applied for margin calculations."
            >
              <RateInput
                prefix={CURRENCY.symbol}
                value={values.costingRate}
                onChange={(v) => set("costingRate", v)}
              />
            </Field>

            <Field
              label="Status & Availability"
              hint="If checked, this activity type will no longer appear for timesheet entry."
            >
              <div className="flex h-8 items-center rounded-md border border-theme bg-card px-3">
                <CheckboxField
                  label="Disabled"
                  note="Hide from future timesheets"
                  checked={values.disabled}
                  onChange={(v) => set("disabled", v)}
                />
              </div>
            </Field>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ActivityTypeModal;