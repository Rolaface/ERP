import React, { useState } from "react";
import { Briefcase, FileText, Info, TrendingUp, User } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import { ModalSelect, NumericInput } from "../../../components/ui/modal/modalComponent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Option {
  label: string;
  value: string | number;
}

// TODO: bind these to your default currency (e.g. from useDefault) if needed
const CURRENCY = { symbol: "$", code: "USD" };

interface FormValues {
  activityType: string;
  employee: string;
  billingRate: number | null;
  costingRate: number | null;
}

const INITIAL: FormValues = {
  activityType: "",
  employee: "",
  billingRate: null,
  costingRate: null,
};

const ActivityCostModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const modalId = "activity-cost-create";
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL);

  // TODO: load from API (Activity Type / Employee link options)
  const activityTypeOptions: Option[] = [];
  const employeeOptions: Option[] = [];

  const set = <K extends keyof FormValues>(key: K, v: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const reset = () => setValues(INITIAL);

  const isDirty = JSON.stringify(values) !== JSON.stringify(INITIAL);

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    reset();
    onClose();
  };

  // live calculations
  const billing = values.billingRate ?? 0;
  const costing = values.costingRate ?? 0;
  const spread = billing - costing;
  const marginPct = billing > 0 ? (spread / billing) * 100 : 0;
  const money = (n: number) => `${CURRENCY.symbol}${n.toFixed(2)}`;

  const handleSave = async () => {
    if (submitting) return;
    if (!values.activityType) {
      showValidationError("Activity Type is required");
      return;
    }

    try {
      setSubmitting(true);
      // TODO: API → create "Activity Cost"
      // await createActivityCost({
      //   activity_type: values.activityType,
      //   employee: values.employee || undefined,
      //   billing_rate: billing,
      //   costing_rate: costing,
      // });
      showSuccess("Activity Cost saved successfully");
      onSuccess?.();
      reset();
      onClose();
    } catch (error: any) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const infoIcon = (tip: string) => (
    <span title={tip} className="inline-flex align-middle text-muted">
      <Info size={11} />
    </span>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      title={isDirty ? "New Activity Cost (Not Saved)" : "New Activity Cost"}
      subtitle="Add and manage activity cost records"
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
      height="460px"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="h-full overflow-y-auto px-3 py-2"
        autoComplete="off"
      >
        <div className="grid grid-cols-1 items-start gap-3">
          <div className="flex flex-col gap-3 rounded-lg border border-theme bg-card p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ModalSelect
                label="Activity Type"
                required
                icon={<Briefcase size={12} />}
                value={values.activityType}
                onChange={(e) => set("activityType", e.target.value)}
                options={activityTypeOptions}
                placeholder="Select Activity Type..."
                className="w-full"
              />

              <ModalSelect
                label="Employee (Optional Override)"
                icon={<User size={12} />}
                value={values.employee}
                onChange={(e) => set("employee", e.target.value)}
                options={employeeOptions}
                placeholder="Select Employee... (optional)"
                className="w-full"
              />
            </div>

            <div>
              <h3 className="mb-1.5 text-[12px] font-semibold text-main">
                Hourly Rate Matrix
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-muted">
                    Billing Rate ({CURRENCY.code}){" "}
                    {infoIcon("Rate billed to the client per hour")}
                  </div>
                  <NumericInput
                    name="billingRate"
                    value={values.billingRate}
                    onChange={(v) => set("billingRate", v)}
                    decimalScale={2}
                    className="w-full"
                  />
                  <p className="mt-0.5 text-[10px] text-muted">per hour</p>
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-muted">
                    Costing Rate ({CURRENCY.code}){" "}
                    {infoIcon("Internal cost per hour")}
                  </div>
                  <NumericInput
                    name="costingRate"
                    value={values.costingRate}
                    onChange={(v) => set("costingRate", v)}
                    decimalScale={2}
                    className="w-full"
                  />
                  <p className="mt-0.5 text-[10px] text-muted">per hour</p>
                </div>
              </div>
            </div>

            {/* Calculated margin */}
            <div className="flex items-center justify-between rounded-lg border border-theme bg-app px-3 py-1.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-card text-muted">
                  <TrendingUp size={14} />
                </span>
                <div>
                  <div className="text-xs font-semibold text-main">
                    Calculated Gross Margin
                  </div>
                  <div className="text-[10px] text-muted">
                    Spread: {money(spread)} / hr
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-main tabular-nums">
                  {marginPct.toFixed(1)}%
                </span>
                <span className="rounded bg-card px-1.5 py-0.5 text-[9px] font-medium text-muted">
                  MARGIN
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ActivityCostModal;