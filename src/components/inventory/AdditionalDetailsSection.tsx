import React from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getRolaCountries, getRolaUOMs } from "../../api/itemZraApi";
import { ModalInput, NumericInput } from "../ui/modal/modalComponent";
import type {
  ItemFieldSetter,
  ItemFormChangeHandler,
  ItemFormData,
} from "./itemModalTypes";
import { getPackagingUOM } from "../../api/itemApi";

interface AdditionalDetailsSectionProps {
  form: ItemFormData;
  onFormChange: ItemFormChangeHandler;
  setField: ItemFieldSetter;
  errors?: Partial<Record<keyof ItemFormData, string>>;
}

const AdditionalDetailsSection: React.FC<AdditionalDetailsSectionProps> =
  React.memo(({ form, onFormChange, setField, errors }) => {
    const fetchCountries = getRolaCountries;
    const fetchUoms = getRolaUOMs;
    return (
      <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
        {/* Packing Unit: N x N */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="block text-[10px] font-medium text-main mb-1">
            Packing Size
          </span>
          <div className="flex items-center gap-1 h-[28px]">
            <NumericInput
              name="packingUnit"
              value={form.packingUnit}
              placeholder="0"
              onChange={(value) => setField("packingUnit", value)}
              className="h-[28px] w-14"
            />
            <span className="shrink-0 text-sm font-bold text-muted">x</span>
            <NumericInput
              name="packingSize"
              value={form.packingSize}
              placeholder="0"
              onChange={(value) => setField("packingSize", value)}
              className="h-[28px] w-14"
            />
          </div>
        </div>


        <div className="w-[140px] min-w-0">
          <SearchSelect2
            label="Packaging Unit"
            value={form.packaging_uom ?? ""}
            fetchOptions={async (q) => getPackagingUOM(q)}
            onChange={(value) => setField("packaging_uom", value)}
            placeholder="Search..."
          />
        </div>

        {/* UOM */}
        <div className="w-[140px] min-w-0">
          <SearchSelect2
            label="Unit of Measure"
            value={form.unitOfMeasureCd ?? ""}
            fetchOptions={async (q) => {
              const data = await fetchUoms(form.itemGroup);
              const list = data?.data ?? [];
              return list
                .filter((item: any) =>
                  (item.name ?? item.cdNm ?? "")
                    .toLowerCase()
                    .includes(q.toLowerCase()),
                )
                .map((item: any) => ({
                  label: item.name ?? item.cdNm ?? "",
                  value: item.name ?? item.cdNm ?? "",
                }));
            }}
            onChange={(value) => setField("unitOfMeasureCd", value)}
            placeholder="Search..."
            required
            error={errors?.unitOfMeasureCd}
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

        {/* Country of origin — only relevant when Allow Purchase is on */}
        <div className="w-[160px] min-w-0">
          <SearchSelect2
            label="Country of origin"
            value={form.originNationCode ?? ""}
            fetchOptions={async (q) => {
              const data = await fetchCountries();
              const list = data?.data ?? [];
              return list
                .filter((item: any) =>
                  item.name.toLowerCase().includes(q.toLowerCase()),
                )
                .map((item: any) => ({
                  label: item.name,
                  value: item.name,
                }));
            }}
            onChange={(value) => setField("originNationCode", value)}
            placeholder="Search..."
            error={errors?.originNationCode}
            disabled={!form.allowPurchase}
          />
        </div>
      </div>
    );
  });

AdditionalDetailsSection.displayName = "AdditionalDetailsSection";

export default AdditionalDetailsSection;

