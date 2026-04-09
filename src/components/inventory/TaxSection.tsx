import React from "react";
import { Copy, Trash2 } from "lucide-react";
import Tooltip from "../Tooltip";
import TaxCategorySelect from "../selects/TaxCategorySelect";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import type { ItemTaxRow } from "./itemModalTypes";

interface SearchOption {
  label: string;
  value: string;
}

interface TaxSectionProps {
  taxRows: ItemTaxRow[];
  paginatedRows: ItemTaxRow[];
  taxPage: number;
  itemsPerPage: number;
  fetchTaxTemplateOptions: (search: string) => Promise<SearchOption[]>;
  onTaxRowChange: (
    absoluteIndex: number,
    field: keyof ItemTaxRow,
    value: string,
  ) => void;
  onAddTaxRow: () => void;
  onDuplicateTaxRow: (absoluteIndex: number) => void;
  onRemoveTaxRow: (absoluteIndex: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const TaxSection: React.FC<TaxSectionProps> = React.memo(
  ({
    taxRows,
    paginatedRows,
    taxPage,
    itemsPerPage,
    fetchTaxTemplateOptions,
    onTaxRowChange,
    onAddTaxRow,
    onDuplicateTaxRow,
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
                <th className="w-[76px]" />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => {
                const absoluteIndex = taxPage * itemsPerPage + index;

                return (
                  <tr
                    key={absoluteIndex}
                    className="row-hover border-b border-theme bg-card"
                  >
                    <td className="px-2 py-1 text-center text-[10px]">
                      {absoluteIndex + 1}
                    </td>
                    <td className="min-w-[220px] px-0.5 py-1">
                      <TaxCategorySelect
                        value={row.taxCategory}
                        onChange={(value) =>
                          onTaxRowChange(absoluteIndex, "taxCategory", value)
                        }
                      />
                    </td>
                    <td className="min-w-[220px] px-0.5 py-1">
                      <SearchSelect2
                        label=""
                        value={row.taxTemplate}
                        onChange={(value) =>
                          onTaxRowChange(absoluteIndex, "taxTemplate", value)
                        }
                        fetchOptions={fetchTaxTemplateOptions}
                        placeholder="Search tax template..."
                      />
                    </td>
                    <td className="px-0.5 py-1">
                      <div className="flex items-center gap-1">
                        <Tooltip content="Duplicate row">
                          <button
                            type="button"
                            onClick={() => onDuplicateTaxRow(absoluteIndex)}
                            className="rounded bg-primary/10 p-0.5 text-primary transition hover:bg-primary/20"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </Tooltip>
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
