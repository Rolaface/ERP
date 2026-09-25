import React, { useRef } from "react";
import { Boxes, Info, Layers, RefreshCw, Wallet } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import ModalFooter from "../../common/ModalFooter";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { PLAN_TABS, usePlanForm } from "../../../hooks/Subscription/Plan/useplan";
import type { StandardModalProps } from "../../../types/modal";
import type { PlanDetail, PlanTab } from "../../../types/Subscription/Plan/plan";
import { PlanBasicInfoTab } from "../Plan/PlanBasicInfoTab";
import { PlanModulesTab } from "../Plan/PlanModulesTab";
import { PlanPricingTab } from "../Plan/PlanPricingTab";
import { PlanTrialRenewalTab } from "../Plan/PlanTrialRenewalTab";
import { PlanSummaryPanel } from "../Plan/PlanSummaryPanel";

type PlanModalProps = StandardModalProps<unknown, PlanDetail>;

const TAB_META: Record<PlanTab, { label: string; icon: React.ReactNode }> = {
  basic: { label: "Basic Information", icon: <Info className="h-4 w-4" /> },
  modules: { label: "Modules & Features", icon: <Boxes className="h-4 w-4" /> },
  pricing: { label: "Pricing & Billing", icon: <Wallet className="h-4 w-4" /> },
  trial: { label: "Trial & Renewal", icon: <RefreshCw className="h-4 w-4" /> },
};

const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
}) => {

  const fallbackIdRef = useRef(`plan-modal-${Date.now()}`);
  const resolvedModalId = modalId || fallbackIdRef.current;


  const { confirmClose } = useUnsavedChanges();

  const plan = usePlanForm({ isOpen, isEditMode, initialData, onSubmit, onClose });

  const handleCloseWithWarning = () => {
    if (plan.loading) return;
    return confirmClose({
      modalId: resolvedModalId,
      dirtyOverride: plan.isDirty,
      onConfirmClose: () => {
        plan.reset();
        onClose();
      },
    });
  };

  const footer = (
    <ModalFooter
      onCancel={handleCloseWithWarning}
      onReset={plan.resetCurrentTab}
      onSubmit={plan.handleSubmitInternal}
      onNext={plan.handleNext}
      currentTab={PLAN_TABS.indexOf(plan.activeTab)}
      totalTabs={PLAN_TABS.length}
      isSubmitting={plan.loading}
      submitLabel={isEditMode ? "Update Plan" : "Create Plan"}
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleCloseWithWarning}
      title={isEditMode ? "Edit Plan" : "Add Plan"}
      subtitle="Set up products, modules, pricing, billing, and renewal rules."
      icon={Layers}
      footer={footer}
      customWidth="75vw"
      height="90vh"
    >
      <form id="planForm" onSubmit={(e) => e.preventDefault()} className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-theme bg-app px-8">
          <div className="flex gap-8 overflow-x-auto">
            {PLAN_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => plan.setActiveTab(tab)}
                className={`flex shrink-0 cursor-pointer items-center gap-2 border-none bg-transparent py-2.5 text-xs font-medium transition-all ${plan.activeTab === tab
                    ? "border-b-[3px] border-primary text-primary"
                    : "border-b-[3px] border-transparent text-muted hover:text-main"
                  }`}
              >
                {TAB_META[tab].icon}
                {TAB_META[tab].label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="grid grid-cols-1 items-start gap-5 bg-app px-4 py-2 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {plan.activeTab === "basic" && (
                <PlanBasicInfoTab
                  form={plan.form}
                  errors={plan.errors}
                  isEditMode={isEditMode}
                  suggestedCode={plan.suggestedCode}
                  onFieldChange={plan.setField}
                  onToggleProduct={plan.toggleProduct}
                />
              )}
              {plan.activeTab === "modules" && (
                <PlanModulesTab
                  form={plan.form}
                  errors={plan.errors}
                  onToggleModule={plan.toggleModule}
                  onSelectAll={plan.selectAllModules}
                  onClearAll={plan.clearAllModules}
                />
              )}
              {plan.activeTab === "pricing" && (
                <PlanPricingTab
                  form={plan.form}
                  errors={plan.errors}
                  recurringTotal={plan.recurringTotal}
                  onFieldChange={plan.setField}
                  onModulePriceChange={plan.setModulePrice}
                />
              )}
              {plan.activeTab === "trial" && (
                <PlanTrialRenewalTab form={plan.form} errors={plan.errors} onFieldChange={plan.setField} />
              )}
            </div>

            <aside className="lg:sticky lg:top-0">
              <PlanSummaryPanel
                form={plan.form}
                effectiveCode={plan.effectiveCode}
                recurringTotal={plan.recurringTotal}
              />
            </aside>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default PlanModal;