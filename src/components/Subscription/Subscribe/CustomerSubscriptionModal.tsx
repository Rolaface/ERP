import React, { useMemo, useRef } from "react";
import { Lock, UserCheck } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import ModalFooter from "../../common/ModalFooter";
import { ModalInput, ModalSelect, ModalTextarea, NumericInput } from "../../ui/modal/modalComponent";
import { PlanProductBadge } from "../Plan/PlanShared";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { PLAN_CATALOG, formatMoney, getBillingLabel, getBillingSuffix } from "../../../hooks/Subscription/Plan/useplan";
import {
  formatDate,
  getRenewalLabel,
  useSubscriptionForm,
} from "../../../hooks/Subscription/Subscribe/useCustomerSubscription";
import type { StandardModalProps } from "../../../types/modal";
import type { PlanDetail } from "../../../types/Subscription/Plan/plan";
import type {
  CustomerOption,
  SubscriptionDetail,
} from "../../../types/Subscription/Subscribe/CustomerSubscription";

type SubscriptionModalProps = StandardModalProps<unknown, SubscriptionDetail> & {
  customers: CustomerOption[];
  plans: PlanDetail[];
  /** Subscription number shown (and saved) for a new subscription. */
  suggestedNumber: string;
};

/* ─── Small presentational helpers (theme tokens only) ────────────────────── */

const LABEL = "block text-[10px] font-medium text-main mb-1";
const TILE_LABEL = "text-[10px] font-semibold uppercase tracking-wide text-muted";
const tint = (pct: number): React.CSSProperties => ({
  background: `color-mix(in srgb, var(--primary) ${pct}%, transparent)`,
});

const PRODUCT_INFO: Record<string, { name: string;}> = {
  ERP: { name: "Enterprise Resource Planning" },
  LMS: { name: "Loan Management System" },
  LOS: { name: "Loan Origination System"  },
};

/** Total modules a product offers. Falls back to null if the catalog doesn't expose it. */
const getProductModuleTotal = (code: string): number | null => {
  const entry = PLAN_CATALOG.find((p) => p.code === code) as unknown as { modules?: unknown[] } | undefined;
  return Array.isArray(entry?.modules) ? entry.modules.length : null;
};

const SectionCard: React.FC<{ step?: number; icon?: React.ReactNode; title?: string; children: React.ReactNode }> = ({
  step,
  icon,
  title,
  children,
}) => (
  <section className="app-surface p-5">
    {title && (
      <div className="mb-4 flex items-center gap-3 border-b border-theme pb-3">
        {step !== undefined && (
          <span className="bg-primary flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold">
            {step}
          </span>
        )}
        {icon && (
          <span className="text-primary flex h-6 w-6 items-center justify-center rounded-md" style={tint(12)}>
            {icon}
          </span>
        )}
        <h3 className="text-xs font-bold uppercase tracking-wide text-main">{title}</h3>
      </div>
    )}
    {children}
  </section>
);

const SummaryRow: React.FC<{ label: string; value: React.ReactNode; valueClass?: string }> = ({
  label,
  value,
  valueClass = "text-main",
}) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="text-muted">{label}</span>
    <span className={`text-right font-medium tabular-nums ${valueClass}`}>{value}</span>
  </div>
);

/* ─── Modal ───────────────────────────────────────────────────────────────── */

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
  customers,
  plans,
  suggestedNumber,
}) => {
  const fallbackIdRef = useRef(`subscription-modal-${Date.now()}`);
  const resolvedModalId = modalId || fallbackIdRef.current;

  const { confirmClose } = useUnsavedChanges();

  const sub = useSubscriptionForm({
    isOpen,
    isEditMode,
    initialData,
    plans,
    customers,
    suggestedNumber,
    onSubmit,
    onClose,
  });
  const { form, errors, selectedPlan, pricing } = sub;

  const handleCloseWithWarning = () => {
    if (sub.loading) return;
    return confirmClose({
      modalId: resolvedModalId,
      dirtyOverride: sub.isDirty,
      onConfirmClose: () => {
        sub.reset();
        onClose();
      },
    });
  };

  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: `${c.name} (${c.company})`, value: c.id })),
    [customers],
  );

  // Only Active plans can be newly assigned; keep the current plan visible when editing.
  const planOptions = useMemo(
    () =>
      plans
        .filter((p) => p.status === "Active" || p.id === initialData?.planId)
        .map((p) => ({ label: p.name, value: p.id })),
    [plans, initialData?.planId],
  );

  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const money = (amount: number) => (selectedPlan ? formatMoney(amount, selectedPlan.currency) : "—");

  const footer = (
    <ModalFooter
      onCancel={handleCloseWithWarning}
      onSubmit={sub.handleSubmitInternal}
      currentTab={0}
      totalTabs={1}
      isSubmitting={sub.loading}
      submitLabel={isEditMode ? "Update Subscription" : "Create Subscription"}
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleCloseWithWarning}
      title={isEditMode ? "Edit  Subscription" : "Add Subscription"}
      subtitle="Assign customer & plan."
      icon={UserCheck}
      footer={footer}
      customWidth="80vw"
      height="90vh"
    >
      <form id="subscriptionForm" onSubmit={(e) => e.preventDefault()} className="flex h-full flex-col">
        <div className="grid grid-cols-1 items-start gap-5 bg-app px-2 py-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            {/* 1 — Customer & plan */}
            <SectionCard>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModalSelect
                  label="Customer"
                  required
                  name="customerId"
                  value={form.customerId}
                  options={customerOptions}
                  placeholder="Select customer"
                  disabled={isEditMode}
                  error={errors.customerId}
                  onChange={(e) => sub.setField("customerId", e.target.value)}
                />
                <ModalSelect
                  label="Choose Plan"
                  required
                  name="planId"
                  value={form.planId}
                  options={planOptions}
                  placeholder="Select plan"
                  disabled={isEditMode}
                  error={errors.planId}
                  onChange={(e) => sub.setField("planId", e.target.value)}
                />
                <ModalInput
                  label="Subscription Number"
                  name="subscriptionNumber"
                  type="text"
                  value={isEditMode && initialData ? initialData.id : suggestedNumber}
                  disabled
                  readOnly
                />
              </div>
            </SectionCard>

            {/* Inherited plan details */}
            <SectionCard icon={<Lock className="h-3.5 w-3.5" />} title="Plan Details">
              {!selectedPlan ? (
                <p className="py-4 text-center text-xs text-muted">
                  Select a plan to see its price, trial, renewal and entitlements.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <p className={TILE_LABEL}>Price</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-main">
                        {money(pricing.subtotal)}
                        <span className="ml-1 text-xs font-normal text-muted">
                          {getBillingSuffix(selectedPlan.billingFrequency, selectedPlan.customIntervalMonths)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className={TILE_LABEL}>Trial Period</p>
                      {selectedPlan.freeTrial && selectedPlan.trialDays ? (
                        <>
                          <p className="text-primary mt-1 text-sm font-semibold">
                            {selectedPlan.trialDays} Days Free Trial
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-muted">No trial</p>
                      )}
                    </div>
                    <div>
                      <p className={TILE_LABEL}>Renewal Mode</p>
                      <p className="text-success mt-1 text-sm font-semibold">{getRenewalLabel(selectedPlan)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-main">Entitled Products & Module Counts</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {selectedPlan.products.map((code) => {
                        const info = PRODUCT_INFO[code];
                        const included = selectedPlan.moduleIds.filter((id) => id.startsWith(`${code}.`)).length;
                        const total = getProductModuleTotal(code);
                        return (
                          <div
                            key={code}
                            className="flex items-center justify-between gap-3 rounded-lg border border-theme bg-card p-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <PlanProductBadge code={code} />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-main">{info?.name ?? code}</p>
                              </div>
                            </div>
                            <span
                              className="text-primary shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold"
                              style={tint(10)}
                            >
                              {total !== null ? `${included} / ${total}` : included} Modules
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* 2 — Subscription-specific parameters */}
            <SectionCard>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ModalInput
                  label="Start Date"
                  required
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  error={errors.startDate}
                  onChange={(e) => sub.setField("startDate", e.target.value)}
                />
                <ModalInput
                  label="Expiry / Renewal Date"
                  required
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  error={errors.expiryDate}
                  onChange={(e) => sub.setField("expiryDate", e.target.value)}
                />
                <div className="flex min-w-0 flex-col">
                  <span className={LABEL}>Discount Amount</span>
                  <NumericInput
                    name="discount"
                    value={form.discount}
                    decimalScale={2}
                    placeholder="0"
                    disabled={!selectedPlan}
                    className="w-full"
                    onChange={(v) => sub.setField("discount", v)}
                  />
                  {errors.discount && <span className="mt-1 text-[10px] text-danger">{errors.discount}</span>}
                </div>
              </div>
              <div className="mt-4">
                <ModalTextarea
                  label="Subscription Notes / Commercial Terms"
                  name="notes"
                  placeholder="Add any operational or commercial contract notes..."
                  value={form.notes}
                  className="h-16!"
                  onChange={(e) => sub.setField("notes", e.target.value)}
                />
              </div>
            </SectionCard>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-0">
            <div className="overflow-hidden rounded-2xl border border-theme bg-card shadow-sm">
              <div className="px-5 py-5 text-white" style={{ background: "var(--gradient-primary)" }}>
                <h3 className="text-base font-bold">Subscription Summary</h3>
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div>
                  <p className={TILE_LABEL}>Customer</p>
                  <p className="mt-0.5 text-sm font-semibold text-main">{selectedCustomer?.name ?? "—"}</p>
                </div>
                <div>
                  <p className={TILE_LABEL}>Plan</p>
                  <p className="mt-0.5 text-sm font-semibold text-main">{selectedPlan?.name ?? "—"}</p>
                </div>

                <div className="flex flex-col gap-2 border-t border-theme pt-4">
                  <p className={TILE_LABEL}>Billing</p>
                  <p className="text-sm font-semibold text-main">
                    {selectedPlan
                      ? `${getBillingLabel(selectedPlan.billingFrequency, selectedPlan.customIntervalMonths)} • ${money(pricing.subtotal)} ${getBillingSuffix(selectedPlan.billingFrequency, selectedPlan.customIntervalMonths)}`
                      : "—"}
                  </p>
                  <SummaryRow label="Start Date:" value={formatDate(form.startDate)} />
                  <SummaryRow label="Expiry Date:" value={formatDate(form.expiryDate)} />
                  <SummaryRow
                    label="Trial:"
                    value={selectedPlan?.freeTrial && selectedPlan.trialDays ? `${selectedPlan.trialDays} Days Free Trial` : "None"}
                  />
                  <SummaryRow label="Renewal:" value={selectedPlan ? getRenewalLabel(selectedPlan) : "—"} />
                </div>

                <div className="flex flex-col gap-2 border-t border-theme pt-4">
                  <SummaryRow label="Subtotal:" value={money(pricing.subtotal)} />
                  <SummaryRow
                    label="Discount:"
                    value={pricing.discount > 0 ? `-${money(pricing.discount)}` : money(0)}
                    valueClass={pricing.discount > 0 ? "text-success" : "text-main"}
                  />
                  <SummaryRow label="Tax (18% GST):" value={money(pricing.tax)} />
                  <div className="mt-1 flex items-center justify-between border-t border-theme pt-3">
                    <span className="text-xs font-bold text-main">TOTAL:</span>
                    <span className="text-primary text-xl font-bold tabular-nums">
                      {money(pricing.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default SubscriptionModal;