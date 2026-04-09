import React from "react";
import { Trash2 } from "lucide-react";
import Tooltip from "../Tooltip";
import TaxCategorySelect from "../selects/TaxCategorySelect";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import type { ItemTaxRow } from "./itemModalTypes";

interface SearchOption {
  label: string;
  value: string;
}

/** Shape of a single tax line returned by the API */
interface TemplateTax {
  tax_type: string;
  tax_rate: number;
}

interface TaxSectionProps {
  taxRows: ItemTaxRow[];
  paginatedRows: ItemTaxRow[];
  taxPage: number;
  itemsPerPage: number;
  fetchTaxTemplateOptions: (search: string) => Promise<SearchOption[]>;
  /**
   * Given a template value (name), return the cached taxes for that template.
   * Returns undefined if the template hasn't been fetched yet.
   */
  getTemplateTaxes: (templateValue: string) => TemplateTax[] | undefined;
  onTaxRowChange: (
    absoluteIndex: number,
    field: keyof ItemTaxRow,
    value: string,
  ) => void;
  onAddTaxRow: () => void;
  onRemoveTaxRow: (absoluteIndex: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

/** Renders the tax breakdown tooltip content */
const TaxTooltipContent: React.FC<{ taxes: TemplateTax[] }> = ({ taxes }) => (
  <div className="min-w-[160px]">
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
      Tax Breakdown
    </p>
    {taxes.map((t, i) => (
      <div key={i} className="flex items-center justify-between gap-3 text-[11px]">
        <span className="truncate">{t.tax_type}</span>
        <span className="shrink-0 font-medium">{t.tax_rate}%</span>
      </div>
    ))}
  </div>
);

const TaxSection: React.FC<TaxSectionProps> = React.memo(
  ({
    taxRows,
    paginatedRows,
    taxPage,
    itemsPerPage,
    fetchTaxTemplateOptions,
    getTemplateTaxes,
    onTaxRowChange,
    onAddTaxRow,
    onRemoveTaxRow,
    onPreviousPage,
    onNextPage,
  }) => {
    const startIndex = taxPage * itemsPerPage + 1;
    const endIndex = Math.min((taxPage + 1) * itemsPerPage, taxRows.length);

    return (
      <div className="rounded-lg bg-card p-2 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-[10px] leading-tight">
            <thead>
              <tr className="border-b border-theme">
                <th className="w-[44px] px-2 py-1 text-left text-[11px] font-medium text-muted">
                  #
                </th>
                <th className="min-w-[220px] px-2 py-1 text-left text-[11px] font-medium text-muted">
                  Tax Category
                </th>
                <th className="min-w-[220px] px-2 py-1 text-left text-[11px] font-medium text-muted">
                  Tax Template
                </th>
                {/* Action column — only trash, no duplicate */}
                <th className="w-[44px]" />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => {
                const absoluteIndex = taxPage * itemsPerPage + index;
                const taxes = row.taxTemplate
                  ? getTemplateTaxes(row.taxTemplate)
                  : undefined;

                const templateCell = (
                  <SearchSelect2
                    label=""
                    value={row.taxTemplate}
                    onChange={(value) =>
                      onTaxRowChange(absoluteIndex, "taxTemplate", value)
                    }
                    fetchOptions={fetchTaxTemplateOptions}
                    placeholder="Search tax template..."
                  />
                );

                return (
                  <tr
                    key={absoluteIndex}
                    className="row-hover border-b border-theme bg-card"
                  >
                    <td className="px-2 py-1 text-center text-[10px]">
                      {absoluteIndex + 1}
                    </td>

                    <td className="min-w-[220px] px-1 py-1 align-middle">
                      <div className="flex items-center h-[28px]">
                        <TaxCategorySelect
                          value={row.taxCategory}
                          onChange={(value) =>
                            onTaxRowChange(absoluteIndex, "taxCategory", value)
                          }
                        />
                      </div>
                    </td>
                    {/* Tax Template cell — wrap with tooltip only when taxes are available */}
                    <td className="min-w-[220px] px-1 py-1 align-middle">
                      <div className="flex items-center h-[28px]">
                        {taxes && taxes.length > 0 ? (
                          <Tooltip content={<TaxTooltipContent taxes={taxes} />}>
                            <div className="w-full">{templateCell}</div>
                          </Tooltip>
                        ) : (
                          templateCell
                        )}
                      </div>
                    </td>
                    {/* Actions: only Remove (no duplicate) */}
                    <td className="px-0.5 py-1">
                      <Tooltip content="Remove row">
                        <button
                          type="button"
                          onClick={() => onRemoveTaxRow(absoluteIndex)}
                          disabled={taxRows.length === 1}
                          className="rounded bg-danger/10 p-0.5 text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: Add Row + Pagination */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onAddTaxRow}
            className="flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--primary-600)]"
          >
            <span className="text-base leading-none">+</span>
            Add Row
          </button>

          {taxRows.length > itemsPerPage && (
            <div className="flex flex-wrap items-center gap-3 rounded bg-app px-2 py-1">
              <span className="whitespace-nowrap text-[11px] text-muted">
                Showing {startIndex} to {endIndex} of {taxRows.length}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onPreviousPage}
                  disabled={taxPage === 0}
                  className="rounded border border-theme bg-card px-2.5 py-1 text-[11px] text-main disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={onNextPage}
                  disabled={(taxPage + 1) * itemsPerPage >= taxRows.length}
                  className="rounded border border-theme bg-card px-2.5 py-1 text-[11px] text-main disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

TaxSection.displayName = "TaxSection";

export default TaxSection;