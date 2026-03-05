import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Checkbox } from "../../ui/modal/formComponent";
import type { PurchaseOrderFormData } from "../../../types/Supply/purchaseOrder";
import { MapPin, Truck, Building2, Plus, Minus } from "lucide-react";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import SearchSelect from "../../ui/modal/SearchSelect";
import { getRolaCountryList } from "../../../api/lookupApi";

interface AddressTabProps {
  form: PurchaseOrderFormData;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;

  customShippingRule: string;
  setCustomShippingRule: React.Dispatch<React.SetStateAction<string>>;

  customIncoterm: string;
  setCustomIncoterm: React.Dispatch<React.SetStateAction<string>>;
}
interface Country {
  name: string;
  country_name: string;
  code: string;
}

type AddressKey = keyof PurchaseOrderFormData["addresses"];

/*  Address Block  */

const AddressBlock: React.FC<{
  title: string;
  icon: any;
  keyName: AddressKey;
  data: PurchaseOrderFormData["addresses"][AddressKey];
  isOpen: boolean;
  onToggle: () => void;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  showCopyCheckbox?: boolean;
  copyCheckboxLabel?: string;
  copyChecked?: boolean;
  onCopyToggle?: (checked: boolean) => void;
}> = ({
  title,
  icon: Icon,
  keyName,
  data,
  isOpen,
  onToggle,
  onFormChange,
  showCopyCheckbox,
  copyCheckboxLabel,
  copyChecked,
  onCopyToggle,
}) => {



    const [countriesCache, setCountriesCache] = useState<Country[]>([]);
    useEffect(() => {
      const loadCountries = async () => {
        try {
          const result = await getRolaCountryList();

          const formatted = (result || []).map((c: Country) => ({
            ...c,
            code: c.code?.toUpperCase() || "",
          }));

          setCountriesCache(formatted);
        } catch (error) {
          console.error("Failed to load countries:", error);
          setCountriesCache([]);
        }
      };

      loadCountries();
    }, []);

    const selectedCountry = countriesCache.find(
      (c) => c.country_name === data?.country
    );

    return (
      <div className="bg-card border border-theme rounded-xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-app border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Icon size={18} />
            </div>
            <p className="text-sm font-semibold text-main">{title}</p>
          </div>

          <div className="flex items-center gap-3">
            {showCopyCheckbox && (
              <Checkbox
                label={copyCheckboxLabel || "Copy"}
                checked={copyChecked ?? false}
                onChange={(checked) => onCopyToggle?.(checked)}
              />
            )}

            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded row-hover"
            >
              {isOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
        </div>

        {/* Body */}
        {isOpen && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-card text-main">

            <ModalInput
              label="Address Title"
              name={`addresses.${keyName}.addressTitle`}
              value={data?.addressTitle || ""}
              onChange={onFormChange}
            />

            <ModalInput
              label="Address Type"
              name={`addresses.${keyName}.addressType`}
              value={data?.addressType || ""}
              onChange={onFormChange}
            />

            <ModalInput
              label="Address Line 1"
              name={`addresses.${keyName}.addressLine1`}
              value={data?.addressLine1 || ""}
              onChange={onFormChange}
            />

            <ModalInput
              label="Address Line 2"
              name={`addresses.${keyName}.addressLine2`}
              value={data?.addressLine2 || ""}
              onChange={onFormChange}
            />


            <ModalInput
              label="City/Town"
              name={`addresses.${keyName}.city`}
              value={data?.city || ""}
              onChange={onFormChange}
            />

            <ModalInput
              label="State/Province"
              name={`addresses.${keyName}.state`}
              value={data?.state || ""}
              onChange={onFormChange}
            />


            <SearchSelect
              label="Country"
              value={selectedCountry?.country_name || ""}
              onChange={(val) =>
                onFormChange({
                  target: {
                    name: `addresses.${keyName}.country`,
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
                      c.country_name.toLowerCase().includes(lowerQ)
                  )
                  .map((c) => ({
                    label: c.country_name,
                    value: c.country_name,
                  }));
              }}
            />

            <ModalInput
              label="Postal Code"
              name={`addresses.${keyName}.postalCode`}
              value={data?.postalCode || ""}
              onChange={onFormChange}
            />


            {/* Extra fields for supplier */}
            {keyName === "supplierAddress" && (
              <>
                <ModalInput
                  label="Phone"
                  name={`addresses.${keyName}.phone`}
                  value={data?.phone || ""}
                  onChange={onFormChange}
                />

                <ModalInput
                  label="Email"
                  name={`addresses.${keyName}.email`}
                  value={data?.email || ""}
                  onChange={onFormChange}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  };



/*  Address Tab  */

export const AddressTab: React.FC<AddressTabProps> = ({
  form,
  onFormChange,
  customShippingRule,
  setCustomShippingRule,
  customIncoterm,
  setCustomIncoterm,
}) => {

  /* Accordion open state */
  const [open, setOpen] = useState<Record<AddressKey, boolean>>({
    supplierAddress: true,
    dispatchAddress: false,
    shippingAddress: false,
    companyBillingAddress: true,
  });




  const toggle = useCallback((key: AddressKey) => {
    setOpen((p) => ({ ...p, [key]: !p[key] }));
  }, []);


  /*  Copy helper  */

  const copyAddress = useCallback(
    (from: PurchaseOrderFormData["addresses"][AddressKey], toKey: AddressKey) => {
      Object.entries(from).forEach(([field, value]) => {
        onFormChange({
          target: {
            name: `addresses.${toKey}.${field}`,
            value: value ?? "",
          },
        } as React.ChangeEvent<HTMLInputElement>);
      });
    },
    [onFormChange]
  );

const handleCopySupplierToDispatch = useCallback(
  (checked: boolean) => {
    onFormChange({
      target: {
        name: "useDispatchAddress",
        value: checked,
        type: "checkbox",
        checked,
      },
    } as any);

    if (checked) {
      copyAddress(form.addresses.supplierAddress, "dispatchAddress");
    }
  },
  [form.addresses.supplierAddress, copyAddress]
);
  const handleCopyBillingToShipping = useCallback(
    (checked: boolean) => {
      onFormChange({
        target: {
          name: "useShippingAddress",
          value: checked,
          type: "checkbox",
          checked,
        },
      } as any);
      if (checked) {
        copyAddress(form.addresses.companyBillingAddress, "shippingAddress");
      }
    },
    [form.addresses.companyBillingAddress, copyAddress]
  );

  const supplierData = useMemo(
    () => form.addresses.supplierAddress,
    [form.addresses.supplierAddress]
  );

  const companyBillingData = useMemo(
    () => form.addresses.companyBillingAddress,
    [form.addresses.companyBillingAddress]
  );

  const shippingData = useMemo(
    () => form.addresses.shippingAddress,
    [form.addresses.shippingAddress]
  );

  const dispatchData = useMemo(
    () => form.addresses.dispatchAddress,
    [form.addresses.dispatchAddress]
  );

  /* Reset handlers — clears custom value AND resets form field to "" so select re-appears */
  const handleResetShippingRule = useCallback(() => {
    setCustomShippingRule("");
    onFormChange({
      target: { name: "shippingRule", value: "" },
    } as React.ChangeEvent<HTMLSelectElement>);
  }, [setCustomShippingRule, onFormChange]);

  const handleResetIncoterm = useCallback(() => {
    setCustomIncoterm("");
    onFormChange({
      target: { name: "incoterm", value: "" },
    } as React.ChangeEvent<HTMLSelectElement>);
  }, [setCustomIncoterm, onFormChange]);

  return (
    <div className="space-y-6">

      {/* Top fields */}
      <div className="grid grid-cols-4 gap-4 p-4">

        {/* ── Shipping Rule ── select stays in DOM always (holds height); input overlays when OTHER */}
        <div className="relative">
          <ModalSelect
            label="Shipping Rule"
            name="shippingRule"
            value={form.shippingRule || ""}
            onChange={(e) => {
              onFormChange(e);
              if (e.target.value !== "OTHER") setCustomShippingRule("");
            }}
            options={[
              { value: "STANDARD", label: "Standard Shipping" },
              { value: "EXPRESS", label: "Express Shipping" },
              { value: "OVERNIGHT", label: "Overnight Shipping" },
              { value: "SAME_DAY", label: "Same Day Delivery" },
              { value: "ECONOMY", label: "Economy Shipping" },
              { value: "FREIGHT", label: "Freight" },
              { value: "SEA", label: "Sea Freight" },
              { value: "AIR", label: "Air Freight" },
              { value: "ROAD", label: "Road Transport" },
              { value: "PICKUP", label: "Self Pickup" },
              { value: "OTHER", label: "Others" },
            ]}
          />
          {form.shippingRule === "OTHER" && (
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="relative">
                <ModalInput
                  label=""
                  placeholder="Enter custom shipping rule"
                  value={customShippingRule}
                  onChange={(e) => setCustomShippingRule(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleResetShippingRule}
                  title="Back to dropdown"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sub hover:text-main transition-colors text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Incoterm ── select stays in DOM always (holds height); input overlays when OTHER */}
        <div className="relative">
          <ModalSelect
            label="Incoterm"
            name="incoterm"
            value={form.incoterm || ""}
            onChange={(e) => {
              onFormChange(e);
              if (e.target.value !== "OTHER") setCustomIncoterm("");
            }}
            options={[
              { value: "EXW", label: "EXW – Ex Works" },
              { value: "FCA", label: "FCA – Free Carrier" },
              { value: "FOB", label: "FOB – Free On Board" },
              { value: "CFR", label: "CFR – Cost and Freight" },
              { value: "CIF", label: "CIF – Cost, Insurance & Freight" },
              { value: "OTHER", label: "Others" },
            ]}
          />
          {form.incoterm === "OTHER" && (
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="relative">
                <ModalInput
                  label=""
                  placeholder="Enter custom incoterm"
                  value={customIncoterm}
                  onChange={(e) => setCustomIncoterm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleResetIncoterm}
                  title="Back to dropdown"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sub hover:text-main transition-colors text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        <ModalInput
          label="Supplier Contact"
          name="supplierContact"
          value={form.supplierContact || ""}
          onChange={onFormChange}
        />

        <ModalInput
          label="Place of Supply"
          name="placeOfSupply"
          value={form.placeOfSupply || ""}
          onChange={onFormChange}
        />
      </div>

      {/* Address blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="space-y-4">

          <AddressBlock
            title="Company Billing Address"
            icon={Building2}
            keyName="companyBillingAddress"
            data={companyBillingData}
            isOpen={open.companyBillingAddress}
            onToggle={() => toggle("companyBillingAddress")}
            onFormChange={onFormChange}
          />

          <AddressBlock
            title="Supplier Address"
            icon={MapPin}
            keyName="supplierAddress"
            data={supplierData}
            isOpen={open.supplierAddress}
            onToggle={() => toggle("supplierAddress")}
            onFormChange={onFormChange}
          />
        </div>

        <div className="space-y-4">

          <AddressBlock
            title="Shipping Address"
            icon={Truck}
            keyName="shippingAddress"
            data={shippingData}
            isOpen={open.shippingAddress}
            onToggle={() => toggle("shippingAddress")}
            onFormChange={onFormChange}
            showCopyCheckbox
            copyCheckboxLabel="Same as Billing"
            copyChecked={form.useShippingAddress}
            onCopyToggle={handleCopyBillingToShipping}
          />

          <AddressBlock
            title="Dispatch Address"
            icon={Truck}
            keyName="dispatchAddress"
            data={dispatchData}
            isOpen={open.dispatchAddress}
            onToggle={() => toggle("dispatchAddress")}
            onFormChange={onFormChange}
            showCopyCheckbox
            copyCheckboxLabel="Same as Supplier"
            copyChecked={form.useDispatchAddress}
            onCopyToggle={handleCopySupplierToDispatch}
          />
        </div>
      </div>
    </div>
  );
};