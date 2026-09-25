import React, { useMemo, useState } from "react";
import { ArrowRight, Check, SlidersHorizontal, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { Button } from "../../ui/modal/formComponent";

/* ════════════════════════════════════════════════════════════════════════════
   MOCK DATA — replace with real base-plan / catalog data once available.
   ════════════════════════════════════════════════════════════════════════════ */

interface AdditionalProduct {
  code: string;
  name: string;
  description: string;
  moduleCount: number;
  price: number;
  alreadyIncluded: boolean;
}

interface AddOnModule {
  code: string;
  name: string;
  description: string;
  price: number;
}

type EffectiveOption = "now" | "renewal";

const BASE_SUBSCRIPTION = {
  name: "Enterprise Max",
  price: 24500,
  renewalDate: "Oct 15, 2025",
};

const ADDITIONAL_PRODUCTS: AdditionalProduct[] = [
  {
    code: "LOS",
    name: "Loan Origination System (LOS)",
    description: "description",
    moduleCount: 3,
    price: 5000,
    alreadyIncluded: false,
  },
  {
    code: "ERP_LMS",
    name: "ERP & LMS Core Suites",
    description: "description",
    moduleCount: 0,
    price: 0,
    alreadyIncluded: true,
  },
];

const ADDON_MODULES: AddOnModule[] = [
  { code: "customer-mgmt", name: "Customer Management", description: "description", price: 1500 },
  { code: "loan-product-engine", name: "Loan Product Engine", description: "Categories & Charges", price: 2500 },
];

/* ════════════════════════════════════════════════════════════════════════════ */

interface CustomizeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewChanges?: (selection: {
    products: string[];
    modules: string[];
    effectiveOption: EffectiveOption;
    newMonthlyTotal: number;
  }) => void;
}

const CustomizeSubscriptionModal: React.FC<CustomizeSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onReviewChanges,
}) => {
  const selectableProducts = ADDITIONAL_PRODUCTS.filter((p) => !p.alreadyIncluded);

  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    selectableProducts.map((p) => p.code), // preselected in the reference screenshot
  );
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [effectiveOption, setEffectiveOption] = useState<EffectiveOption>("renewal");

  const toggleProduct = (code: string) => {
    setSelectedProducts((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const toggleModule = (code: string) => {
    setSelectedModules((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const removeProduct = (code: string) => toggleProduct(code);

  const addOnsTotal = useMemo(() => {
    const productsTotal = selectableProducts
      .filter((p) => selectedProducts.includes(p.code))
      .reduce((sum, p) => sum + p.price, 0);
    const modulesTotal = ADDON_MODULES.filter((m) => selectedModules.includes(m.code)).reduce(
      (sum, m) => sum + m.price,
      0,
    );
    return productsTotal + modulesTotal;
  }, [selectedProducts, selectedModules, selectableProducts]);

  const newMonthlyTotal = BASE_SUBSCRIPTION.price + addOnsTotal;

  const selectedProductDetails = selectableProducts.filter((p) => selectedProducts.includes(p.code));

  const handleReviewChanges = () => {
    onReviewChanges?.({
      products: selectedProducts,
      modules: selectedModules,
      effectiveOption,
      newMonthlyTotal,
    });
  };

  return (
    <MinimizableModal
      modalId="customize-subscription-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Subscription & User Seats"
      subtitle="Add modular software features or configure user seat capacity on demand."
      icon={SlidersHorizontal}
      maxWidth="6xl"
      height="90vh"
      hideMinimize
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* Base subscription banner */}
          <div className="flex items-center justify-between rounded-xl bg-app px-4 py-3">
            <span className="text-sm text-muted">
              Base Subscription: <span className="font-semibold text-main">{BASE_SUBSCRIPTION.name}</span>{" "}
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-success align-middle" />
            </span>
            <span className="text-sm font-semibold text-primary">
              ₹{BASE_SUBSCRIPTION.price.toLocaleString()} <span className="font-normal text-muted">/ month</span>
            </span>
          </div>

          {/* 1. Additional Products */}
          <div className="mt-5">
            <h4 className="text-sm font-bold text-main">1. Additional Products</h4>
            <div className="mt-3 flex flex-col gap-3">
              {ADDITIONAL_PRODUCTS.map((product) => {
                const checked = product.alreadyIncluded || selectedProducts.includes(product.code);
                return (
                  <label
                    key={product.code}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${
                      product.alreadyIncluded ? "cursor-default border-theme" : "cursor-pointer border-theme hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked ? "border-primary bg-primary" : "border-theme bg-card"
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5 text-white" />}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        disabled={product.alreadyIncluded}
                        onChange={() => toggleProduct(product.code)}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-main">{product.name}</span>
                          {product.moduleCount > 0 && (
                            <span className="rounded-full bg-app px-2 py-0.5 text-[11px] text-muted">
                              {product.moduleCount} Modules included
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">{product.description}</p>
                      </div>
                    </div>

                    {product.alreadyIncluded ? (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                        Already Included
                      </span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap text-right text-sm font-semibold text-main">
                        +₹{product.price.toLocaleString()}
                        <span className="block text-[11px] font-normal text-muted">/ month</span>
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Select Add-on Modules */}
          <div className="mt-5">
            <h4 className="text-sm font-bold text-main">2. Select Add-on Modules</h4>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {ADDON_MODULES.map((mod) => {
                const checked = selectedModules.includes(mod.code);
                return (
                  <label
                    key={mod.code}
                    className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-theme p-4 hover:border-primary/40"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked ? "border-primary bg-primary" : "border-theme bg-card"
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5 text-white" />}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleModule(mod.code)}
                      />
                      <div>
                        <span className="block text-sm font-semibold text-main">{mod.name}</span>
                        <span className="text-xs text-muted">{mod.description}</span>
                      </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-right text-sm font-semibold text-main">
                      +₹{mod.price.toLocaleString()}
                      <span className="block text-[11px] font-normal text-muted">/ mo</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Effective Date */}
          <div className="mt-5">
            <h4 className="text-sm font-bold text-main">3. Effective Date</h4>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setEffectiveOption("now")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  effectiveOption === "now" ? "border-primary" : "border-theme hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-main">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        effectiveOption === "now" ? "border-primary" : "border-theme"
                      }`}
                    >
                      {effectiveOption === "now" && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    Option A: Activate Now (Immediate)
                  </span>
                  <span className="rounded-full bg-app px-2 py-0.5 text-[10px] font-medium text-primary">
                    Immediate
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Provisioned immediately. Prorated charge calculated for remaining days of cycle + 18% GST.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEffectiveOption("renewal")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  effectiveOption === "renewal" ? "border-primary" : "border-theme hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-main">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        effectiveOption === "renewal" ? "border-primary" : "border-theme"
                      }`}
                    >
                      {effectiveOption === "renewal" && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    Option B: Start at Next Renewal
                  </span>
                  <span className="rounded-full bg-app px-2 py-0.5 text-[10px] font-medium text-muted">
                    {BASE_SUBSCRIPTION.renewalDate}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Takes effect at next renewal date. <span className="font-semibold text-main">₹0 due today</span>;
                  updated rate starts on the next billing invoice.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-0">
          <div className="overflow-hidden rounded-2xl border border-theme bg-card shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-bold text-main">Summary</span>
              <span className="text-[11px] text-muted">Live Breakdown</span>
            </div>

            <div className="border-t border-theme px-4 py-3">
              <p className="text-sm font-semibold text-main">Base: {BASE_SUBSCRIPTION.name}</p>
              <p className="mt-0.5 flex items-center justify-between text-[11px] text-muted">
                <span>Includes core suites</span>
                <span className="font-semibold text-main">₹{BASE_SUBSCRIPTION.price.toLocaleString()}</span>
              </p>
            </div>

            {selectedProductDetails.length > 0 && (
              <div className="border-t border-theme px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Selected Additions</p>
                <div className="mt-2 flex flex-col gap-2">
                  {selectedProductDetails.map((p) => (
                    <div
                      key={p.code}
                      className="flex items-center justify-between gap-2 rounded-lg bg-app px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-medium text-main">{p.name}</p>
                        <p className="text-[11px] text-primary">+₹{p.price.toLocaleString()}/mo</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(p.code)}
                        className="rounded p-1 text-muted transition-colors hover:bg-row-hover hover:text-danger"
                        aria-label={`Remove ${p.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 border-t border-theme px-4 py-3 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Base Subscription</span>
                <span className="font-medium text-main">₹{BASE_SUBSCRIPTION.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Additional Add-ons</span>
                <span className="font-medium text-primary">+₹{addOnsTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-theme px-4 py-3">
              <span className="text-sm font-bold text-main">New Monthly Total</span>
              <span className="text-lg font-bold text-primary">₹{newMonthlyTotal.toLocaleString()}</span>
            </div>

            <div className="px-4 pb-4">
              <Button variant="primary" className="w-full justify-center" onClick={handleReviewChanges}>
                Review Changes <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </MinimizableModal>
  );
};

export default CustomizeSubscriptionModal;