import React from "react";
import { ToggleSwitch, NumericInput } from "../../ui/modal/modalComponent";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { fetchCurrencyOptions } from "../../../utils/currencyOptions";
import {
  BILLING_FREQUENCY_OPTIONS,
  formatMoney,
  getActiveModuleIds,
  getModuleDef,
  getProductOfModule,
} from "../../../hooks/Subscription/Plan/useplan";
import type {
  PlanBillingFrequency,
  PlanFieldSetter,
  PlanFormErrors,
  PlanFormState,
  PlanPricingModel,
} from "../../../types/Subscription/Plan/plan";
import { PlanField } from "./PlanShared";

const noop = () => {};

const PRICING_MODEL_CARDS: { value: PlanPricingModel; title: string; description: string }[] = [
  { value: "Flat", title: "Flat Subscription Rate", description: "Fixed rate covers all entitled modules" },
  { value: "PerModule", title: "Per-Module Breakdown", description: "Dynamic sum calculated from active modules" },
];

export const PlanPricingTab: React.FC<{
  form: PlanFormState;
  errors: PlanFormErrors;
  recurringTotal: number;
  onFieldChange: PlanFieldSetter;
  onModulePriceChange: (id: string, value: number | null) => void;
}> = ({ form, errors, recurringTotal, onFieldChange, onModulePriceChange }) => {
  const isPerModule = form.pricingModel === "PerModule";
  const activeModules = getActiveModuleIds(form);
  const currencyLabel = form.currency ? ` (${form.currency})` : "";

  return (
    <div>
      <div className="flex flex-wrap items-start gap-5">
        <ToggleSwitch
          name="billingFrequency"
          label="Billing Frequency"
          checked={false}
          onChange={noop}
          options={BILLING_FREQUENCY_OPTIONS}
          value={form.billingFrequency}
          onValueChange={(v) => onFieldChange("billingFrequency", v as PlanBillingFrequency)}
        />
        {form.billingFrequency === "Custom" && (
          <PlanField label="Interval (months)" required error={errors.customIntervalMonths} className="w-40">
            <NumericInput
              name="customIntervalMonths"
              value={form.customIntervalMonths}
              onChange={(v) => onFieldChange("customIntervalMonths", v)}
              decimalScale={0}
              placeholder="e.g. 2"
              className={`w-full ${errors.customIntervalMonths ? "border-danger" : ""}`}
            />
          </PlanField>
        )}
      </div>

      <PlanField label="Pricing Model" className="mt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PRICING_MODEL_CARDS.map((card) => {
            const active = form.pricingModel === card.value;
            return (
              <button
                key={card.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onFieldChange("pricingModel", card.value)}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                  active ? "border-primary bg-primary/5" : "border-[var(--border)] bg-card hover:border-primary/40"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-main">{card.title}</span>
                  <span className="block text-[10px] text-muted">{card.description}</span>
                </span>
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    active ? "border-primary" : "border-[var(--border)]"
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      </PlanField>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
        <SearchSelect2
          label="Currency"
          value={form.currency}
          onChange={(value: unknown) => onFieldChange("currency", String(value ?? ""))}
          fetchOptions={fetchCurrencyOptions}
          placeholder="Search currency..."
          required
          error={errors.currency}
        />
        <PlanField
          label={`Base Price${currencyLabel}`}
          required={!isPerModule}
          error={errors.basePrice}
          hint={isPerModule ? "Calculated from module prices" : undefined}
        >
          <NumericInput
            name="basePrice"
            value={isPerModule ? null : form.basePrice}
            onChange={(v) => onFieldChange("basePrice", v)}
            decimalScale={2}
            disabled={isPerModule}
            className={`w-full ${errors.basePrice ? "border-danger" : ""}`}
          />
        </PlanField>
        <PlanField label={`Setup / Onboarding Fee${currencyLabel}`}>
          <NumericInput
            name="setupFee"
            value={form.setupFee}
            onChange={(v) => onFieldChange("setupFee", v)}
            decimalScale={2}
            className="w-full"
          />
        </PlanField>
      </div>

      {isPerModule && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-main">Module Pricing Allocation</span>
            <span className="text-[11px] text-primary">Total: {formatMoney(recurringTotal, form.currency)}</span>
          </div>

          {activeModules.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-muted">
              No modules selected. Choose modules in Modules & Features first.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {activeModules.map((id) => {
                const mod = getModuleDef(id);
                const rowError = errors.modulePrices?.[id];
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-main">
                        {mod?.label ?? id}{" "}
                        <span className="text-[10px] text-muted">({getProductOfModule(id)})</span>
                      </div>
                      {!!mod?.subModules.length && (
                        <div className="text-[10px] text-muted">{mod.subModules.length} sub-modules bundled</div>
                      )}
                    </div>
                    <div className="w-28 shrink-0">
                      <NumericInput
                        name={`modulePrice-${id}`}
                        value={form.modulePrices[id] ?? null}
                        onChange={(v) => onModulePriceChange(id, v)}
                        decimalScale={2}
                        className={`w-full ${rowError ? "border-danger" : ""}`}
                      />
                      {rowError && <span className="mt-0.5 block text-[10px] text-danger">{rowError}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};