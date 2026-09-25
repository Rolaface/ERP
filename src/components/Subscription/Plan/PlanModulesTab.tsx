import React from "react";
import { ChevronDown } from "lucide-react";
import { PLAN_CATALOG } from "../../../hooks/Subscription/Plan/useplan";
import type { PlanFormErrors, PlanFormState } from "../../../types/Subscription/Plan/plan";
import { GHOST_BTN, PlanProductBadge } from "./PlanShared";

export const PlanModulesTab: React.FC<{
  form: PlanFormState;
  errors: PlanFormErrors;
  onToggleModule: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}> = ({ form, errors, onToggleModule }) => {
  const selectedProducts = PLAN_CATALOG.filter((p) => form.products.includes(p.code));
  const selected = new Set(form.moduleIds);

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const toggleCollapsed = (code: string) =>
    setCollapsed((prev) => ({ ...prev, [code]: !prev[code] }));

  const selectAllForProduct = (product: (typeof PLAN_CATALOG)[number]) => {
    product.modules.forEach((m) => {
      if (!selected.has(m.id)) onToggleModule(m.id);
    });
  };
  const clearAllForProduct = (product: (typeof PLAN_CATALOG)[number]) => {
    product.modules.forEach((m) => {
      if (selected.has(m.id)) onToggleModule(m.id);
    });
  };

  return (
    <div>
      {selectedProducts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-xs text-muted">
          {errors.modules ?? "No product selected. Choose at least one product in Basic Information."}
        </p>
      ) : (
        <>
          {errors.modules && <p className="mb-2 text-[10px] text-danger">{errors.modules}</p>}

          <div className="flex flex-col gap-4">
            {selectedProducts.map((product, index) => {
              const count = product.modules.filter((m) => selected.has(m.id)).length;
              const isCollapsed = collapsed[product.code] ?? index !== 0;
              return (
                <section key={product.code} className="overflow-hidden rounded-lg border border-[var(--border)] bg-card">
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-app px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(product.code)}
                      className="flex items-center gap-2 text-left"
                      aria-expanded={!isCollapsed}
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                      />
                      <PlanProductBadge code={product.code} />
                      <span className="text-xs font-semibold text-main">{product.name}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted">
                        {count} / {product.modules.length} Modules Active
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          className={GHOST_BTN}
                          onClick={() => selectAllForProduct(product)}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className={GHOST_BTN}
                          onClick={() => clearAllForProduct(product)}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </header>

                  {!isCollapsed && (
                    <ul className="divide-y divide-[var(--border)]">
                      {product.modules.map((mod) => {
                        const checked = selected.has(mod.id);
                        return (
                          <li key={mod.id}>
                            <label className="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-row-hover/50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleModule(mod.id)}
                                className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <span className="text-xs font-medium text-main">{mod.label}</span>
                                    {mod.description && (
                                      <span className="ml-2 text-[10px] text-muted">{mod.description}</span>
                                    )}
                                  </div>
                                  {checked && (
                                    <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                      Included
                                    </span>
                                  )}
                                </div>
                                {mod.subModules.length > 0 && (
                                  <div className="mt-1.5 rounded bg-app px-3 py-1.5 text-[10px] text-muted">
                                    <span className="font-bold text-main">Sub-Modules:</span>{" "}
                                    <span className="text-main">{mod.subModules.join(" • ")}</span>
                                  </div>
                                )}
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};