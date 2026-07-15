import React from "react";
import StockItemNameCodeSelect from "../../components/selects/StockCorrectionItemSelect";
import { ToggleSwitch } from "../../components/ui/modal/modalComponent";
import type { Mode, StockItemSelectPayload } from "../../hooks/stock correction-movement/Usestockcorrectionform";
import { SectionLabel } from "../../components/Stock-correction-movement/Summaryui";

export const ItemPicker: React.FC<{
  itemSelectResetKey: number;
  itemPrefillName: string;
  onItemPicked: (payload: StockItemSelectPayload) => void;
  onItemClear: () => void;
}> = ({ itemSelectResetKey, itemPrefillName, onItemPicked, onItemClear }) => (
  <div>
    <SectionLabel>Item</SectionLabel>
    <div className="mt-2">
      <StockItemNameCodeSelect
        key={itemSelectResetKey}
        itemPrefillName={itemPrefillName}
        onItemPicked={onItemPicked}
        onItemClear={onItemClear}
      />
    </div>
  </div>
);

export const TransactionTypeToggle: React.FC<{ mode: Mode; onModeChange: (mode: Mode) => void }> = ({
  mode,
  onModeChange,
}) => (
  <ToggleSwitch
    name="transactionType"
    label="Transaction Type"
    checked={mode === "movement"}
    offLabel="Correction"
    onLabel="Movement"
    onChange={(e) => onModeChange(e.target.checked ? "movement" : "correction")}
  />
);