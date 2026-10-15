import React, { useState } from "react";
import { Briefcase, FileText, Info, TrendingUp, User } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import {
  DarkTotal,
  Field,
  NotSavedBadge,
  RateInput,
  SelectInput,
  SideCard,
  SummaryRow,
  fmtMoney,
  toNum,
  useModalForm,
  useModalId,
  usePmLinkOptions,
} from "./PmModalParts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// TODO: bind these to your default currency (e.g. from useDefault) if needed
const CURRENCY = { symbol: "$", code: "USD" };

const ActivityCostModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const modalId = useModalId("activity-cost-create");
  const [submitting, setSubmitting] = useState(false);

  const activityTypeOptions = usePmLinkOptions("Activity Type");
  const employeeOptions = usePmLinkOptions("Employee", "employee_name");

  const { values, set, reset, confirmClose } = useModalForm({
    activityType: "",
    employee: "",
    billingRate: "",
    costingRate: "",
  });

  const handleClose = confirmClose(onClose);

  // live calculations
  const billing = toNum(values.billingRate);
  const costing = toNum(values.costingRate);
  const spread = billing - costing;
  const marginPct = billing > 0 ? (spread / billing) * 100 : 0;
  const money = (n: number) => fmtMoney(n, CURRENCY.symbol);

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
      title={
        <span className="inline-flex items-center">
          New Activity Cost
          <NotSavedBadge />
        </span>
      }
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
        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
          {/* ───────── Left: form ───────── */}
          <div className="flex flex-col gap-3 rounded-lg border border-theme bg-card p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Activity Type" required right="Browse list">
                <SelectInput
                  value={values.activityType}
                  onChange={(v) => set("activityType", v)}
                  options={activityTypeOptions}
                  placeholder="Select Activity Type..."
                  icon={<Briefcase size={12} />}
                />
              </Field>

              <Field
                label="Employee"
                right="Optional Override"
                hint="Applies uniformly if left empty"
              >
                <SelectInput
                  value={values.employee}
                  onChange={(v) => set("employee", v)}
                  options={employeeOptions}
                  placeholder="Select Employee... (optional)"
                  icon={<User size={12} />}
                />
              </Field>
            </div>

            <div>
              <h3 className="mb-1.5 text-[12px] font-semibold text-main">
                Hourly Rate Matrix
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-muted">
                    Billing Rate {infoIcon("Rate billed to the client per hour")}
                  </div>
                  <RateInput
                    prefix={CURRENCY.symbol}
                    suffix={CURRENCY.code}
                    value={values.billingRate}
                    onChange={(v) => set("billingRate", v)}
                  />
                  <p className="mt-0.5 text-[10px] text-muted">per hour</p>
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-muted">
                    Costing Rate {infoIcon("Internal cost per hour")}
                  </div>
                  <RateInput
                    prefix={CURRENCY.symbol}
                    suffix={CURRENCY.code}
                    value={values.costingRate}
                    onChange={(v) => set("costingRate", v)}
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