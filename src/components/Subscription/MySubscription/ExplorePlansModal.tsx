import React from "react";
import { Check, Layers, X } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { Button } from "../../ui/modal/formComponent";

interface TierFeature {
  label: string;
  included: boolean;
}

interface PlanTier {
  code: string;
  tierLabel: string;
  name: string;
  description: string;
  price: number;
  features: TierFeature[];
}

/* Mock tiers — replace with real plan/pricing data once available. */
const TIERS: PlanTier[] = [
  {
    code: "starter",
    tierLabel: "STARTER",
    name: "Starter Plan",
    description: "For early stage pilot deployments and basic bookkeeping.",
    price: 6000,
    features: [
      { label: "1 Core Product (ERP Basic)", included: true },
      { label: "5 Modules Included", included: true },
      { label: "No LMS or LOS Access", included: false },
    ],
  },
  {
    code: "growth",
    tierLabel: "GROWTH",
    name: "Business Plus",
    description: "Our comprehensive plan for mid-sized regulated fintechs.",
    price: 14000,
    features: [
      { label: "2 Products (ERP + LMS)", included: true },
      { label: "14 Modules Included", included: true },
      { label: "No LOS Access", included: false },
    ],
  },
  {
    code: "enterprise",
    tierLabel: "ENTERPRISE STACK",
    name: "Enterprise Max",
    description: "High-velocity institution stack with extensive automations.",
    price: 24500,
    features: [
      { label: "ERP + LMS Full Module Suite", included: true },
      { label: "19 Modules Included", included: true },
      { label: "Dedicated RevOps Representative", included: true },
    ],
  },
];

interface ExplorePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanName: string;
}

const ExplorePlansModal: React.FC<ExplorePlansModalProps> = ({ isOpen, onClose, currentPlanName }) => {
  return (
    <MinimizableModal
      modalId="explore-plans-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Explore Subscription Tiers"
      subtitle="Compare tiers and entitlements to align with your organization scale."
      icon={Layers}
      maxWidth="6xl"
      height="auto"
      hideMinimize
    >
      <div className="grid grid-cols-1 gap-4 p-1 md:grid-cols-3">
        {TIERS.map((tier) => {
          const isCurrent = tier.name === currentPlanName;
          return (
            <div
              key={tier.code}
              className={`flex flex-col rounded-xl border p-5 ${
                isCurrent ? "border-primary shadow-sm" : "border-theme"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                {tier.tierLabel}
              </span>
              <h4 className="mt-1 text-lg font-bold text-main">{tier.name}</h4>
              <p className="mt-1.5 text-xs text-muted">{tier.description}</p>

              <div className="mt-4">
                <span className="text-2xl font-bold text-main">₹{tier.price.toLocaleString()}</span>
                <span className="ml-1 text-xs text-muted">/ month</span>
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-xs text-main">
                    {f.included ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                    )}
                    <span className={f.included ? "" : "text-muted"}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <Button variant="secondary" disabled className="w-full justify-center !opacity-100">
                    Active Plan
                  </Button>
                ) : (
                  <Button variant="primary" className="w-full justify-center">
                    Select {tier.tierLabel === "STARTER" ? "Starter" : tier.name.split(" ")[0]}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </MinimizableModal>
  );
};

export default ExplorePlansModal;