import React from "react";
import { Card, Checkbox } from "./formComponent";
import { ModalInput } from "./modalComponent";
import { getCountry, getProvinces, getTowns } from "../../../api/PlacesApi";
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
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  sameAsBilling?: boolean;
  onSameAsBillingChange?: (checked: boolean) => void;
  disableAll?: boolean;
  errors?: AddressErrors;
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
    <Card title={title} subtitle={subtitle} className="relative">
      {/* Same as billing toggle */}
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
          disabled={disableAll || sameAsBilling}
          required
          error={errors?.line1}
        />

        <ModalInput
          label="Line 2"
          name="line2"
          value={data.line2}
          onChange={onChange}
          disabled={disableAll || sameAsBilling}
          error={errors?.line2}
        />

        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="Postal Code"
            name="postalCode"
            value={data.postalCode}
            onChange={onChange}
            disabled={disableAll || sameAsBilling}
            required
            error={errors?.postalCode}
          />

          <SearchSelect
            label="City / Town"
            value={data.city}
            onChange={(val) =>
              onChange({
                target: { name: "city", value: val },
              } as any)
            }
            fetchOptions={fetchTownOptions}
            disabled={disableAll || sameAsBilling}
            required
            error={errors?.city}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SearchSelect
            label="State / Province"
            value={data.state}
            onChange={(val) =>
              onChange({
                target: { name: "state", value: val },
              } as any)
            }
            fetchOptions={fetchProvinceOptions}
            disabled={disableAll || sameAsBilling}
            required
            error={errors?.state}
          />

          <SearchSelect
            label="Country"
            value={data.country}
            onChange={(val) =>
              onChange({
                target: { name: "country", value: val },
              } as any)
            }
            fetchOptions={fetchCountryOptions}
            disabled={disableAll || sameAsBilling}
            required
            error={errors?.country}
          />
        </div>
      </div>
    </Card>
  );
};

export default AddressBlock;
