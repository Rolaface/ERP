import React from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import {
  getCountries,
  getRolaCountries,
  getRolaUOMs,
  getUOMs,
} from "../../api/itemZraApi";
import { useCompanySelection } from "../../hooks/useCompanySelection";
import { ModalInput,YesNoCheckbox } from "../ui/modal/modalComponent";
import type {
  ItemFieldSetter,
  ItemFormChangeHandler,
  ItemFormData,
} from "./itemModalTypes";

interface AdditionalDetailsSectionProps {
  form: ItemFormData;
  onFormChange: ItemFormChangeHandler;
  onToggleChange: (name: string, value: string) => void;
  setField: ItemFieldSetter;
}

const isRolaCompany = (companyCode: string) => {
  const normalized = companyCode?.toUpperCase();
  return normalized === "ROLA" || normalized === "COMP-00004";
};

/**
 * Row 2 of the Item Details tab.
 * Renders: Packing Unit | UOM | SKU | Country | SVC Charge | Insurance | Taxable
 *
 * - UOM and Country use SearchSelect2 (async search)
 * - SVC Charge, Insurance, Taxable use YesNoCheckbox
 * - Packing Unit uses two ModalInput fields (unit × size)
 * - SKU uses ModalInput
 *
 * Layout matches the target screenshot exactly.
 */
const AdditionalDetailsSection: React.FC<AdditionalDetailsSectionProps> =
  React.memo(({ form, onFormChange, onToggleChange, setField }) => {
    const { companyCode } = useCompanySelection();
    const useRolaLookups = isRolaCompany(companyCode);
    const fetchCountries = useRolaLookups ? getRolaCountries : getCountries;
    const fetchUoms = useRolaLookups ? getRolaUOMs : getUOMs;

    return (
      <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
        {/* Packing Unit: N x N */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="block text-[10px] font-medium text-main mb-1">
            Packing Unit
          </span>
          <div className="flex items-center gap-1 h-[28px]">
            <input
              type="number"
              name="packingUnit"
              value={form.packingUnit ?? ""}
              onChange={onFormChange}
              min={1}
              className="h-[28px] w-14 rounded border border-[var(--border)] bg-card px-2 text-[11px] text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner hover:border-primary/40 transition-all"
            />
            <span className="shrink-0 text-sm font-bold text-muted">x</span>
            <input
              type="number"
              name="packingSize"
              value={form.packingSize ?? ""}
              onChange={onFormChange}
              min={1}
              className="h-[28px] w-14 rounded border border-[var(--border)] bg-card px-2 text-[11px] text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner hover:border-primary/40 transition-all"
            />
          </div>
        </div>

        {/* UOM — async search */}
        <div className="w-[140px] min-w-0">
          <SearchSelect2
            label="UOM"
            value={form.unitOfMeasureCd ?? ""}
            fetchOptions={async (q) => {
              const data = await fetchUoms(q);
              // fetchUoms returns items with id/name — normalise to {label, value}
              return (data ?? []).map((item: { id: string; name?: string; cdNm?: string }) => ({
                label: item.name ?? item.cdNm ?? item.id,
                value: item.id,
              }));
            }}
            onChange={(value) => setField("unitOfMeasureCd", value)}
            placeholder="Search..."
            required
          />
        </div>

        {/* SKU */}
        <div className="w-[120px] min-w-0">
          <ModalInput
            label="SKU"
            name="sku"
            value={form.sku ?? ""}
            onChange={onFormChange}
          />
        </div>

        {/* Country of Origin — async search */}
        <div className="w-[160px] min-w-0">
          <SearchSelect2
            label="Country"
            value={form.originNationCode ?? ""}
            fetchOptions={async (q) => {
              const data = await fetchCountries(q);
              return (data ?? []).map((item: { id: string; name?: string; cdNm?: string }) => ({
                label: item.name ?? item.cdNm ?? item.id,
                value: item.id,
              }));
            }}
            onChange={(value) => setField("originNationCode", value)}
            placeholder="Search..."
            required
          />
        </div>

        {/* SVC Charge */}
        <YesNoCheckbox
          name="svcCharge"
          label="SVC Charge"
          value={form.svcCharge || "N"}
          onChange={onToggleChange}
        />

        {/* Insurance */}
        <YesNoCheckbox
          name="ins"
          label="Insurance"
          value={form.ins || "N"}
          onChange={onToggleChange}
        />

        {/* Taxable */}
        <YesNoCheckbox
          name="taxPreference"
          label="Taxable"
          value={form.taxPreference === "Taxable" ? "Y" : "N"}
          onChange={(name, value) =>
            onToggleChange(name, value === "Y" ? "Taxable" : "Non-Taxable")
          }
        />
      </div>
    );
  });

AdditionalDetailsSection.displayName = "AdditionalDetailsSection";

export default AdditionalDetailsSection;