import React, { useMemo } from "react";
import type { ItemFormData, ItemTaxRow } from "./itemModalTypes";

interface ItemSummaryBarProps {
  form: ItemFormData;
  taxRows?: ItemTaxRow[];
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  "1": "Raw Material",
  "2": "Finished Product",
  "3": "Service",
};

/**
 * Rendered inside the modal's blue header, below the title/subtitle row.
 * Only filled fields appear. Uses CSS variables so it adapts to every theme.
 */
const ItemSummaryBar: React.FC<ItemSummaryBarProps> = ({ form, taxRows }) => {
  const chips = useMemo(() => {
    const raw: Array<{ label: string; value: string }> = [
      { label: "Name",     value: form.itemName?.trim() ?? "" },
      { label: "Type",     value: ITEM_TYPE_LABELS[form.itemTypeCode ?? ""] ?? "" },
      { label: "Category", value: form.itemGroup?.trim() ?? "" },
      { label: "SKU",      value: form.sku?.trim() ?? "" },
      { label: "UOM",      value: form.unitOfMeasureCd?.trim() ?? "" },
      { label: "Sell",     value: form.sellingPrice ? String(form.sellingPrice) : "" },
      { label: "Buy",      value: form.buyingPrice  ? String(form.buyingPrice)  : "" },
      {
        label: "Tax",
        value:
          form.taxPreference === "Taxable"
            ? "Taxable"
            : form.taxPreference === "Non-Taxable"
            ? "Non-Taxable"
            : "",
      },
    ];

    // Add filled tax rows — show "TaxType · Template" per row
    const taxChips: Array<{ label: string; value: string }> =
      (taxRows ?? [])
        .filter((r) => r.taxCategory || r.taxTemplate)
        .map((r, i) => ({
          label: `Tax ${i + 1}`,
          value: [r.taxCategory, r.taxTemplate].filter(Boolean).join(" · "),
        }));

    return [...raw.filter((c) => c.value !== ""), ...taxChips];
  }, [
    form.itemName, form.itemTypeCode, form.itemGroup,
    form.sku, form.unitOfMeasureCd, form.sellingPrice,
    form.buyingPrice, form.taxPreference, taxRows,
  ]);

  if (chips.length === 0) return null;

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-y-1"
      style={{ gap: "0px" }}
    >
      {chips.map((chip, i) => (
        <React.Fragment key={`${chip.label}-${i}`}>
          {i > 0 && (
            <span
              className="mx-2 inline-block h-3 w-px shrink-0"
              style={{ background: "rgba(255,255,255,0.25)" }}
            />
          )}
          <span className="inline-flex items-center gap-1 leading-none">
            {/* Label — use white/50 opacity so it works on any --primary bg */}
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {chip.label}
            </span>
            {/* Value — white/90 on dark header, still readable on all themes */}
            <span
              className="max-w-[140px] truncate text-[11px] font-semibold"
              style={{ color: "rgba(255,255,255,0.92)" }}
              title={chip.value}
            >
              {chip.value}
            </span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ItemSummaryBar;