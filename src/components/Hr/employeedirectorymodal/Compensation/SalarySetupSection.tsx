import React from "react";
import { Sparkles } from "lucide-react";
import { ModalSelect } from "../../../ui/modal/modalComponent";
import SearchSelect2 from "../../../ui/modal/SearchSelect2";
import { getAllTaxConfigs } from "../../../../api/payrollConfigApi";
import { Badge } from "./Badge";
import { Field } from "./Field";
import type { SalarySetupSectionProps } from "./types";

// NOTE: This section now only renders the top-level structure/tax/currency/
// payment fields, matching the target design. "Effective from", "Base
// salary", and "Gross salary" have moved into the Salary Configuration card
// header (see CompensationTab.tsx) alongside the title and Customize button.
export const SalarySetupSection: React.FC<SalarySetupSectionProps> = ({
  formData,
  hasCustomizations,
  isLoadingTax,
  getAllSalaryStructures,
  fetchCurrencyOptions,
  handleSalaryStructureChange,
  handleTaxSlabChange,
  stableHandleInputChange,
}) => (
  <div className="bg-card rounded-lg border border-theme px-5 py-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
      <Field
        label="Salary structure"
        badge={
          hasCustomizations ? (
            <Badge tone="primary">
              <Sparkles size={9} /> Customized
            </Badge>
          ) : null
        }
      >
        <SearchSelect2
          label=""
          value={formData.salaryStructure}
          placeholder="Select structure…"
          fetchOptions={async (query: string) => {
            const options = await getAllSalaryStructures(query);

            return [
              {
                label: "Custom",
                value: "Custom",
              },
              ...options.filter((option: any) => option.value !== "Custom"),
            ];
          }}
          onChange={handleSalaryStructureChange}
        />
      </Field>

      <Field label="Tax slab">
        <div className="relative min-w-0">
          <SearchSelect2
            label=""
            value={formData.Taxslab}
            placeholder="Select tax slab…"
            fetchOptions={async (q: string) => {
              const res = await getAllTaxConfigs(0, 20, q);
              return (res.data || []).map((item: any) => ({
                label: item.name,
                value: item.name,
              }));
            }}
            onChange={handleTaxSlabChange}
          />
          {isLoadingTax && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </Field>

      <Field label="Currency">
        <SearchSelect2
          label=""
          value={formData.currency}
          placeholder="Search currency…"
          fetchOptions={fetchCurrencyOptions}
          onChange={(val: any) =>
            stableHandleInputChange(
              "currency",
              typeof val === "string" ? val : val?.value,
            )
          }
        />
      </Field>

      <Field label="Payment mode">
        <ModalSelect
          label=""
          name="paymentMethod"
          value={formData.paymentMethod || ""}
          onChange={(e) =>
            stableHandleInputChange("paymentMethod", e.target.value)
          }
          options={[
            { label: "Bank", value: "Bank" },
            { label: "Cash", value: "Cash" },
            { label: "Check", value: "Check" },
          ]}
        />
      </Field>
    </div>
  </div>
);