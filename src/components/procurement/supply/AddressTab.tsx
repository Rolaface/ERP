import React from "react";
import type { SupplierFormData } from "../../../types/Supply/supplier";
import { ModalInput } from "../../ui/modal/modalComponent";
import SearchSelect from "../../ui/modal/SearchSelect";
import { getCountry, getProvinces, getTowns } from "../../../api/PlacesApi";
interface AddressTabProps {
  form: SupplierFormData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  errors?: {
    billingAddressLine1?: string;
    billingCity?: string;
    billingCountry?: string;
    district?: string;
    province?: string;
    billingPostalCode?: string;
  };
}

export const AddressTab: React.FC<AddressTabProps> = ({
  form,
  onChange,
  errors = {},
}) => {
  const fetchCountryOptions = async (q: string) => {
    const res = await getCountry(q);
    return (res.data || []).map((c: string) => ({
      label: c,
      value: c,
    }));
  };

  const fetchProvinceOptions = async (q: string) => {
    const res = await getProvinces(q);
    return (res.data || []).map((p: string) => ({
      label: p,
      value: p,
    }));
  };

  const fetchTownOptions = async (q: string) => {
    const res = await getTowns(q);
    return (res.data || []).map((t: string) => ({
      label: t,
      value: t,
    }));
  };

  return (
    <section className="flex-1 overflow-y-auto p-4 space-y-6 bg-app">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Address Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <ModalInput
            label="Address Line 1"
            name="billingAddressLine1"
            value={form.billingAddressLine1}
            onChange={onChange}
            placeholder="e.g. Plot 10, Main Street"
            required
            error={errors.billingAddressLine1}
          />

          <ModalInput
            label="Address Line 2"
            name="billingAddressLine2"
            value={form.billingAddressLine2}
            onChange={onChange}
            placeholder="e.g. Suite 2A (optional)"
          />

          <SearchSelect
            label="City / Town"
            value={form.billingCity}
            onChange={(val) =>
              onChange({
                target: { name: "billingCity", value: val },
              } as any)
            }
            fetchOptions={fetchTownOptions}
            placeholder="Type to search..."
            required
            error={errors.billingCity}
          />

          <SearchSelect
            label="Country"
            value={form.billingCountry}
            onChange={(val) =>
              onChange({
                target: { name: "billingCountry", value: val },
              } as any)
            }
            fetchOptions={fetchCountryOptions}
            placeholder="Type to search..."
            required
            error={errors.billingCountry}
          />

          <ModalInput
            label="District"
            name="district"
            value={form.district}
            onChange={onChange}
            placeholder="e.g. Lusaka"
            required
            error={errors.district}
          />

          <SearchSelect
            label="Province"
            value={form.province}
            onChange={(val) =>
              onChange({
                target: { name: "province", value: val },
              } as any)
            }
            fetchOptions={fetchProvinceOptions}
            placeholder="Type to search..."
            required
            error={errors.province}
          />

          <ModalInput
            label="Postal Code"
            name="billingPostalCode"
            value={form.billingPostalCode}
            onChange={onChange}
            placeholder="e.g. 10101"
            required
            error={errors.billingPostalCode}
          />
        </div>
      </div>
    </section>
  );
};
