import React from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import {
  getCountries,
  getRolaCountries,
  getRolaUOMs,
  getUOMs,
} from "../../api/itemZraApi";
import { useCompanySelection } from "../../hooks/useCompanySelection";
import { ModalInput, YesNoCheckbox } from "../ui/modal/modalComponent";
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

        {/* UOM */}
        <div className="w-[140px] min-w-0">
          <SearchSelect2
            label="UOM"
            value={form.unitOfMeasureCd ?? ""}
            fetchOptions={async () => {
              const data = await fetchUoms();

              const list = data?.data ?? [];

              return list.map((item: any) => ({
                label: item.name ?? item.cdNm ?? "",
                value: item.name ?? item.cdNm ?? "",
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

        {/* Country of Origin  */}
        <div className="w-[160px] min-w-0">
          <SearchSelect2
            label="Country of origin"
            value={form.originNationCode ?? ""}
            fetchOptions={async () => {
              const data = await fetchCountries();

              const list = data?.data ?? [];

              return list.map((item: any) => ({
                label: item.name,
                value: item.code ?? item.name,
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
          label="Service Charge"
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