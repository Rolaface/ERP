import React, { useEffect, useState } from "react";
import { NumericInput } from "../../../components/ui/modal/modalComponent";

interface UpdateRatesPanelProps {
  line: { id: string; billing_rate: number; costing_rate: number; hours: number };
  currency?: string;
  onCancel: () => void;
  onSave: (billingRate: number, costingRate: number) => void;
}


const UpdateRatesPanel: React.FC<UpdateRatesPanelProps> = ({
  line,
  currency = "",
  onCancel,
  onSave,
}) => {
  const [billingRate, setBillingRate] = useState<number | null>(
    line.billing_rate || null,
  );
  const [costingRate, setCostingRate] = useState<number | null>(
    line.costing_rate || null,
  );

  useEffect(() => {
    setBillingRate(line.billing_rate || null);
    setCostingRate(line.costing_rate || null);
  }, [line.id]);

  const billingAmount = line.hours * (billingRate ?? 0);
  const costingAmount = line.hours * (costingRate ?? 0);
  const money = (n: number) => `${currency ? currency + " " : ""}${n.toFixed(2)}`;

  return (
    <div className="p-3 flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">
          Billing Rate
        </label>
        <div className="flex items-center border border-theme rounded-md overflow-hidden bg-app">
          <NumericInput
            value={billingRate}
            onChange={(v) => setBillingRate(v)}
            placeholder="0"
            decimalScale={2}
            className="!border-0 !rounded-none !bg-transparent !ring-0 !shadow-none flex-1 !text-xs !py-1 !px-2"
          />
          <span className="px-1.5 text-[10px] text-muted whitespace-nowrap">
            /hr
          </span>
        </div>
        <span className="text-[10px] font-mono text-primary">
          = {money(billingAmount)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">
          Costing Rate
        </label>
        <div className="flex items-center border border-theme rounded-md overflow-hidden bg-app">
          <NumericInput
            value={costingRate}
            onChange={(v) => setCostingRate(v)}
            placeholder="0"
            decimalScale={2}
            className="!border-0 !rounded-none !bg-transparent !ring-0 !shadow-none flex-1 !text-xs !py-1 !px-2"
          />
          <span className="px-1.5 text-[10px] text-muted whitespace-nowrap">
            /hr
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-700">
          = {money(costingAmount)}
        </span>
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-0.5">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 border border-theme text-main bg-app rounded text-[10px] font-medium hover:opacity-80 transition-opacity"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(billingRate ?? 0, costingRate ?? 0)}
          className="px-2.5 py-1 bg-primary hover:opacity-90 text-primary-foreground rounded text-[10px] font-semibold transition-opacity"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default UpdateRatesPanel;