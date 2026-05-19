import React, { useEffect, useState } from "react";
import type { SupplierFormData } from "../../../types/Supply/supplier";
import { ModalInput } from "../../ui/modal/modalComponent";
import SearchSelect from "../../ui/modal/SearchSelect";
import { getRolaCountryList } from "../../../api/lookupApi";

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

interface Country {
  name: string;
  country_name: string;
  code: string;
}

export const AddressTab: React.FC<AddressTabProps> = ({
  form,
  onChange,
  errors = {},
}) => {
  const [countriesCache, setCountriesCache] = useState<Country[]>([]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const result = await getRolaCountryList();
        setCountriesCache(result || []);
      } catch (error) {
        console.error("Failed to load countries:", error);
        setCountriesCache([]);
      }
    };

    loadCountries();
  }, []);

  const selectedCountry = countriesCache.find(
    (c) => c.country_name === form.billingCountry,
  );

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
            required
            error={errors.billingAddressLine1}
          />

          <ModalInput
            label="Address Line 2"
            name="billingAddressLine2"
            value={form.billingAddressLine2}
            onChange={onChange}
          />

          <ModalInput
            label="City / Town"
            name="billingCity"
            value={form.billingCity}
            onChange={onChange}
            error={errors.billingCity}
            required
          />

          <ModalInput
            label="District"
            name="district"
            value={form.district || form.billingCounty}
            onChange={onChange}
            required
            error={errors.district}
          />

          <ModalInput
            label="State/Province"
            name="province"
            value={form.province}
            onChange={onChange}
            error={errors.province}
            required
          />

          <SearchSelect
            label="Country"
            value={selectedCountry?.country_name || ""}
            onChange={(val) =>
              onChange({
                target: {
                  name: "billingCountry",
                  value: val,
                },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            fetchOptions={async (q: string) => {
              const lowerQ = q.toLowerCase();

              return countriesCache
                .filter(
                  (c) =>
                    c?.country_name &&
                    c.country_name.toLowerCase().includes(lowerQ),
                )
                .map((c) => ({
                  label: c.country_name,
                  value: c.country_name,
                }));
            }}
            error={errors.billingCountry}
            required
          />

          <ModalInput
            label="Postal Code"
            name="billingPostalCode"
            value={form.billingPostalCode}
            onChange={onChange}
           
            error={errors.billingPostalCode}
          />
        </div>
      </div>
    </section>
  );
};
