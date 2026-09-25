import React, { useState } from "react";
import { Award, Building2, ClipboardList, Clock, Copy, Eye, Network, Plus, SlidersHorizontal } from "lucide-react";
import { Button, Card } from "../../../components/ui/modal/formComponent";
import { showSuccess } from "../../../utils/alert";
import ExplorePlansModal from "../../../components/Subscription/MySubscription/ExplorePlansModal";
import CustomizeSubscriptionModal from "../../../components/Subscription/MySubscription/CustomizeSubscriptionModal";

interface ProductSummary {
  code: "ERP" | "LMS" | "LOS";
  name: string;
  fullName: string;
  icon: React.ReactNode;
  active: boolean;
  includedModules: number;
  totalModules: number;
  subFeatures: string[];
  addOnPrice?: number;
}

const CURRENT_SUBSCRIPTION = {
  planName: "Business Plus",
  status: "Active" as const,
  autoRenew: true,
  price: 14000,
  currency: "INR",
  billingSuffix: "/ month",
  subscriptionId: "SUB-ACME-8849",
  startDate: "Oct 15, 2024",
  nextRenewal: "Oct 15, 2025",
  daysToRenewal: 14,
  billingType: "Auto-renewal Active",
};

const PRODUCTS: ProductSummary[] = [
  {
    code: "ERP",
    name: "ERP",
    fullName: "Enterprise Resource Planning",
    icon: <Building2 className="h-5 w-5 text-primary" />,
    active: true,
    includedModules: 2,
    totalModules: 5,
    subFeatures: ["Sales", "Procurement"],
  },
  {
    code: "LMS",
    name: "LMS",
    fullName: "Loan Management System",
    icon: <Network className="h-5 w-5 text-primary" />,
    active: true,
    includedModules: 2,
    totalModules: 4,
    subFeatures: ["Collateral", "Lending Setup"],
  },
  {
    code: "LOS",
    name: "LOS",
    fullName: "Loan Origination System",
    icon: <ClipboardList className="h-5 w-5 text-primary" />,
    active: false,
    includedModules: 0,
    totalModules: 3,
    subFeatures: [],
    addOnPrice: 5000,
  },
];

/* ════════════════════════════════════════════════════════════════════════════ */

const ProgressBar: React.FC<{ value: number; total: number }> = ({ value, total }) => {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-app">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
};

const MySubscription: React.FC = () => {
  const [exploreOpen, setExploreOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(CURRENT_SUBSCRIPTION.subscriptionId);
      showSuccess("Subscription ID copied");
    } catch {
      // clipboard API unavailable — silently ignore, non-critical
    }
  };

  const activeCount = PRODUCTS.filter((p) => p.active).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-1 py-1">
      {/* Header actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-main">My Subscription</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> {CURRENT_SUBSCRIPTION.status}
            </span>
            {CURRENT_SUBSCRIPTION.autoRenew && (
              <span className="inline-flex items-center gap-1 rounded-full bg-app px-2.5 py-0.5 text-xs font-medium text-muted">
                Auto-renew enabled
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            View and manage your current subscription, entitlements, and billing cycles.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => setExploreOpen(true)}>
            Explore Plans
          </Button>
          <Button variant="primary" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setCustomizeOpen(true)}>
            Customize Subscription
          </Button>
        </div>
      </div>

      {/* Current plan */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Award className="h-3.5 w-3.5" /> Current Master Plan
            </span>
            <h3 className="mt-2 text-2xl font-bold text-main">{CURRENT_SUBSCRIPTION.planName}</h3>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-main">
              ₹{CURRENT_SUBSCRIPTION.price.toLocaleString()}
            </span>
            <span className="ml-1 text-sm text-muted">{CURRENT_SUBSCRIPTION.billingSuffix}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-theme pt-4 md:grid-cols-4">
          <div>
            <p className="text-[11px] font-medium text-muted">Subscription ID</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="rounded border border-theme bg-app px-2 py-1 font-mono text-xs text-main">
                {CURRENT_SUBSCRIPTION.subscriptionId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="rounded p-1 text-muted transition-colors hover:bg-row-hover hover:text-main"
                aria-label="Copy subscription ID"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted">Start Date</p>
            <p className="mt-1.5 text-sm font-semibold text-main">{CURRENT_SUBSCRIPTION.startDate}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted">Next Renewal</p>
            <p className="mt-1.5 text-sm font-semibold text-main">{CURRENT_SUBSCRIPTION.nextRenewal}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
              <Clock className="h-3 w-3" /> (in {CURRENT_SUBSCRIPTION.daysToRenewal} days)
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted">Billing Type</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> {CURRENT_SUBSCRIPTION.billingType}
            </p>
          </div>
        </div>
      </Card>

      {/* Products */}
      <Card
        title="Products"
        subtitle="Detailed view of products activated under your account, module capacities, and sub-features."
        headerExtra={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-app px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Total {activeCount} Core Products Configured
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PRODUCTS.map((product) => (
            <div key={product.code} className="rounded-xl border border-theme bg-app p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-primary/10 p-2">{product.icon}</span>
                  <span className="text-sm font-semibold text-main">{product.fullName}</span>
                </div>
              </div>

              <div className="mt-1">
                {product.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted">
                    Not Included in Base Plan
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>{product.active ? "Included Capacity" : "Module Entitlement"}</span>
                  <span className="font-semibold text-main">
                    {product.includedModules} / {product.totalModules} Modules
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={product.includedModules} total={product.totalModules} />
                </div>
              </div>

              {product.active ? (
                product.subFeatures.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      Included Sub-Features
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {product.subFeatures.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 rounded-md border border-theme bg-card px-2 py-1 text-[11px] text-main"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-4 flex items-center justify-between border-t border-theme pt-3">
                  <span className="text-[11px] text-muted">
                    Available as add-on (+₹{product.addOnPrice?.toLocaleString()}/mo)
                  </span>
                  <Button variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} className="!px-3 !py-1.5 !text-xs">
                    Add Product
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <ExplorePlansModal
        isOpen={exploreOpen}
        onClose={() => setExploreOpen(false)}
        currentPlanName={CURRENT_SUBSCRIPTION.planName}
      />
      <CustomizeSubscriptionModal
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onReviewChanges={(selection) => {
          console.log("Review changes:", selection);
          setCustomizeOpen(false);
        }}
      />
    </div>
  );
};

export default MySubscription;