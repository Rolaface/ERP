import React, { useEffect, useRef, useState } from "react";
import { Card, Checkbox } from "./formComponent";
import { ModalInput } from "./modalComponent";
import { getRolaCountryList } from "../../../api/lookupApi";
import SearchSelect from "./SearchSelect";

interface Address {
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

interface AddressErrors {
  line1?: string;
  line2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface AddressBlockProps {
  type: "billing" | "shipping";
  title: string;
  subtitle?: string;
  data: Address;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  sameAsBilling?: boolean;
  onSameAsBillingChange?: (checked: boolean) => void;
  disableAll?: boolean;
  errors?: AddressErrors;
}

interface Country {
  name: string;
  country_name: string;
  code: string;
}

const AddressBlock: React.FC<AddressBlockProps> = ({
  type,
  title,
  subtitle,
  data,
  onChange,
  sameAsBilling,
  onSameAsBillingChange,
  disableAll = false,
  errors,
}) => {
  const isShipping = type === "shipping";
  const isDisabled = disableAll || !!sameAsBilling; 

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

  const selectedCountry = countriesCache.find((c) => c.code === data.country);

  return (
    <Card title={title} subtitle={subtitle} className="relative">
      {isShipping && onSameAsBillingChange && (
        <div className="absolute top-6 right-6">
          <Checkbox
            label="Same as billing"
            checked={!!sameAsBilling}
            onChange={onSameAsBillingChange}
          />
        </div>
      )}

      <div className="space-y-4 mt-4">
        <ModalInput
          label="Line 1"
          name="line1"
          value={data.line1}
          onChange={onChange}
          disabled={isDisabled}
          required
          error={errors?.line1}
        />

        <ModalInput
          label="Line 2"
          name="line2"
          value={data.line2}
          onChange={onChange}
          disabled={isDisabled}
          error={errors?.line2}
        />

        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="City / Town"
            name="city"
            value={data.city}
            onChange={onChange}
            disabled={isDisabled}
            error={errors?.city}
          />
          <ModalInput
            label="State / Province"
            name="state"
            value={data.state}
            onChange={onChange}
            disabled={isDisabled}
            error={errors?.state}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SearchSelect
            label="Country"
            value={selectedCountry?.country_name || ""}
            onChange={(val) =>
              onChange({
                target: { name: "country", value: val },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            fetchOptions={async (q: string) => {
              const lowerQ = q.toLowerCase();
              return countriesCache
                .filter(
                  (c) =>
                    c?.country_name &&
                    c.country_name.toLowerCase().includes(lowerQ)
                )
                .map((c) => ({ label: c.country_name, value: c.code }));
            }}
            disabled={isDisabled}
            error={errors?.country}
            required
          />

          <ModalInput
            label="Postal Code"
            name="postalCode"
            value={data.postalCode}
            onChange={onChange}
            disabled={isDisabled}
            required
            error={errors?.postalCode}
          />
        </div>
      </div>
    </Card>
  );
};

export default AddressBlock;