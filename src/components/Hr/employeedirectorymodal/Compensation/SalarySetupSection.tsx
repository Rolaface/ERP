/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import React from "react";
import { Sparkles } from "lucide-react";
import { ModalSelect, NumericInput } from "../../../ui/modal/modalComponent";
import SearchSelect2 from "../../../ui/modal/SearchSelect2";
import DatePickerInput from "../../../calendar/DatePickerInput";
import { getAllTaxConfigs } from "../../../../api/payrollConfigApi";
import { Badge } from "./Badge";
import { Field } from "./Field";
import type { SalarySetupSectionProps } from "./types";

export const SalarySetupSection: React.FC<SalarySetupSectionProps> = ({
  formData,
  hasCustomizations,
  isLoadingTax,
  salaryChanged,
  shownBase,
  shownGross,
  isEditMode,
  activeField,
  getAllSalaryStructures,
  fetchCurrencyOptions,
  handleSalaryStructureChange,
  handleTaxSlabChange,
  stableHandleInputChange,
  setBaseInput,
  setGrossInput,
}) => (
  <>
    <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
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
            fetchOptions={getAllSalaryStructures}
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

    <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
          Monthly salary
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        <Field label="Effective from">
          <DatePickerInput
            name="effectiveFrom"
            value={formData.effectiveFrom || ""}
            required={salaryChanged}
            disabled={!isEditMode}
            onChange={(name, value) => stableHandleInputChange(name, value)}
          />
        </Field>

        <Field label="Base salary / month">
          <div
            onFocus={() => {
              activeField.current = "base";
            }}
            onBlur={() => {
              activeField.current = null;
            }}
          >
            <NumericInput
              name="basicSalary"
              value={shownBase}
              onChange={(val) => setBaseInput(val)}
              placeholder="e.g. 50,000"
              decimalScale={2}
              allowNegative={false}
              className="w-full h-8 !text-xs !px-2.5"
            />
          </div>
        </Field>

        <Field label="Gross salary / month">
          <div
            onFocus={() => {
              activeField.current = "gross";
            }}
            onBlur={() => {
              activeField.current = null;
            }}
          >
            <NumericInput
              name="grossSalary"
              value={shownGross}
              onChange={(val) => setGrossInput(val)}
              placeholder="e.g. 77,500"
              decimalScale={2}
              allowNegative={false}
              className="w-full h-8 !text-xs !px-2.5"
            />
          </div>
        </Field>
      </div>
    </div>
  </>
);
