import React from "react";
import {
  countModulesByProduct,
  describeRenewal,
  describeTrial,
  formatMoney,
  getBillingSuffix,
  PLAN_CATALOG,
  PRICING_MODEL_LABEL,
} from "../../../hooks/Subscription/Plan/useplan";
import type { PlanFormState } from "../../../types/Subscription/Plan/plan";
import { PlanProductBadge, PlanStatusBadge } from "./PlanShared";

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-[11px]">
    <span className="text-muted">{label}</span>
    <span className="text-right font-medium text-main">{value}</span>
  </div>
);

export const PlanSummaryPanel: React.FC<{
  form: PlanFormState;
  effectiveCode: string;
  recurringTotal: number;
}> = ({ form, effectiveCode, recurringTotal }) => {
  const counts = countModulesByProduct(form.products, form.moduleIds);
  const suffix = getBillingSuffix(form.billingFrequency, form.customIntervalMonths);
  const totalModules = form.moduleIds.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
      <div className="bg-primary px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-semibold">Summary</span>
          <PlanStatusBadge status={form.status} />
        </div>
        <h3 className="mt-2 truncate text-sm font-semibold">{form.name.trim() || "Untitled Plan"}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {form.products.map((code) => (
            <span key={code} className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">{code}</span>
          ))}
          {effectiveCode && <span className="font-mono text-[10px] text-white/80">#{effectiveCode}</span>}
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-[10px] font-medium text-muted">Estimated rate</p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-xl font-bold text-main">{formatMoney(recurringTotal, form.currency)}</span>
          <span className="text-xs text-muted">{suffix}</span>
        </div>
        <p className="text-[11px] text-muted">Setup fee: {formatMoney(form.setupFee ?? 0, form.currency)}</p>

        <div className="mb-2 mt-4 flex items-center justify-between">
          <p className="text-[10px] font-medium text-muted">Selected products</p>
          <p className="text-[10px] font-medium text-primary">{totalModules} module{totalModules === 1 ? "" : "s"} total</p>
        </div>
        <div className="flex flex-col gap-2">
          {PLAN_CATALOG.map((product) => {
            const selected = form.products.includes(product.code);
            const count = counts.find((c) => c.product === product.code);
            return (
              <div
                key={product.code}
                className={`flex items-center justify-between rounded-lg bg-app px-3 py-2 transition-opacity ${selected ? "" : "opacity-40"
                  }`}
              >
                <PlanProductBadge code={product.code} />
                <span className="text-[11px] font-medium text-primary">
                  {selected && count ? `${count.selected} / ${count.total} Modules` : "Not selected"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-1.5 border-t border-[var(--border)] pt-3">
          <SummaryRow label="User Limit" value={form.userLimit !== null ? `${form.userLimit} users` : "Not set"} />
          <SummaryRow label="Trial Period" value={describeTrial(form.freeTrial, form.trialDays)} />
          <SummaryRow label="Renewal Mode" value={describeRenewal(form.renewalMode, form.billingCycles)} />
          <SummaryRow label="Pricing Model" value={PRICING_MODEL_LABEL[form.pricingModel]} />
        </div>
      </div>
    </div>
  );
};