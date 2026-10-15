import React, { useState } from "react";
import { Layers } from "lucide-react";

import BudgetHeadTable from "./budgethead/budgetHead";

// Add more setup sections here later (cost centres, workflows, rates...).
const SETUP_TABS = [{ id: "budget-head", label: "Budget Head", icon: <Layers size={14} /> }];

const BudgetSetup: React.FC = () => {
  const [active, setActive] = useState(SETUP_TABS[0].id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" aria-label="Setup sections" className="mb-3 flex gap-1 border-b border-[var(--border)]">
        {SETUP_TABS.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${
                on ? "border-primary font-medium text-primary" : "border-transparent text-muted hover:text-main"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">{active === "budget-head" && <BudgetHeadTable />}</div>
    </div>
  );
};

export default BudgetSetup;