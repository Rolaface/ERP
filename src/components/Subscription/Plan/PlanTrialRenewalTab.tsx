import React from "react";
import { ToggleSwitch, NumericInput } from "../../ui/modal/modalComponent";
import { RENEWAL_MODE_OPTIONS } from "../../../hooks/Subscription/Plan/useplan";
import type { PlanFieldSetter, PlanFormErrors, PlanFormState, PlanRenewalMode } from "../../../types/Subscription/Plan/plan";
import { PlanField } from "./PlanShared";

const noop = () => {};

export const PlanTrialRenewalTab: React.FC<{
  form: PlanFormState;
  errors: PlanFormErrors;
  onFieldChange: PlanFieldSetter;
}> = ({ form, errors, onFieldChange }) => (
  <div>
    <div className="flex flex-wrap gap-6">
      <ToggleSwitch
        name="freeTrial"
        label="Free Trial"
        checked={form.freeTrial}
        onChange={(e) => onFieldChange("freeTrial", !!e.target.checked)}
      />
      <PlanField label="Trial Days" required={form.freeTrial} error={errors.trialDays} className="w-32">
        <NumericInput
          name="trialDays"
          value={form.trialDays}
          onChange={(v) => onFieldChange("trialDays", v)}
          decimalScale={0}
          disabled={!form.freeTrial}
          placeholder="e.g. 14"
          className={`w-full ${errors.trialDays ? "border-danger" : ""}`}
        />
      </PlanField>
    </div>

    <div className="mt-6 flex flex-wrap gap-6">
      <ToggleSwitch
        name="renewalMode"
        label="Billing Cycles"
        checked={form.renewalMode === "FixedCycles"}
        onChange={noop}
        options={RENEWAL_MODE_OPTIONS}
        value={form.renewalMode}
        onValueChange={(v) => onFieldChange("renewalMode", v as PlanRenewalMode)}
      />
      <PlanField
        label="Number of Cycles"
        required={form.renewalMode === "FixedCycles"}
        error={errors.billingCycles}
        className="w-32"
      >
        <NumericInput
          name="billingCycles"
          value={form.billingCycles}
          onChange={(v) => onFieldChange("billingCycles", v)}
          decimalScale={0}
          disabled={form.renewalMode !== "FixedCycles"}
          placeholder="e.g. 12"
          className={`w-full ${errors.billingCycles ? "border-danger" : ""}`}
        />
      </PlanField>
    </div>
  </div>
);