import React, { useState, useCallback, useMemo } from "react";
import { Checkbox } from "../../ui/modal/formComponent";
import type { PurchaseOrderFormData } from "../../../types/Supply/purchaseOrder";
import { MapPin, Truck, Building2, Plus, Minus } from "lucide-react";
import { ModalInput } from "../../ui/modal/modalComponent";
import { getCountry, getProvinces, getTowns } from "../../../api/PlacesApi";
import SearchSelect from "../../ui/modal/SearchSelect";

interface AddressTabProps {
  form: PurchaseOrderFormData;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
            label="Postal Code"
            name={`addresses.${keyName}.postalCode`}
            value={data?.postalCode || ""}
            onChange={onFormChange}
          />

          <SearchSelect
            label="City / Town"
            value={data?.city || ""}
            onChange={(val) =>
              onFormChange({
                target: {
                  name: `addresses.${keyName}.city`,
                  value: val,
                },
              } as any)
            }
            fetchOptions={fetchTownOptions}
          />

          <SearchSelect
            label="State / Province"
            value={data?.state || ""}
            onChange={(val) =>
              onFormChange({
                target: {
                  name: `addresses.${keyName}.state`,
                  value: val,
                },
              } as any)
            }
            fetchOptions={fetchProvinceOptions}
          />

          <SearchSelect
            label="Country"
            value={data?.country || ""}
            onChange={(val) =>
              onFormChange({
                target: {
                  name: `addresses.${keyName}.country`,
                  value: val,
                },
              } as any)
            }
            fetchOptions={fetchCountryOptions}
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
}) => {
  /* Accordion open state */
  const [open, setOpen] = useState<Record<AddressKey, boolean>>({
    supplierAddress: true,
    dispatchAddress: false,
    shippingAddress: false,
    companyBillingAddress: true,
  });

  const [copyBillingToShipping, setCopyBillingToShipping] = useState(false);
  const [copySupplierToDispatch, setCopySupplierToDispatch] = useState(false);

  const toggle = useCallback((key: AddressKey) => {
    setOpen((p) => ({ ...p, [key]: !p[key] }));
  }, []);

  /*  Copy helper  */

  const copyAddress = useCallback(
    (
      from: PurchaseOrderFormData["addresses"][AddressKey],
      toKey: AddressKey,
    ) => {
      Object.entries(from).forEach(([field, value]) => {
        onFormChange({
          target: {
            name: `addresses.${toKey}.${field}`,
            value: value ?? "",
          },
        } as React.ChangeEvent<HTMLInputElement>);
      });
    },
    [onFormChange],
  );

  const handleCopySupplierToDispatch = useCallback(
    (checked: boolean) => {
      setCopySupplierToDispatch(checked);
      if (checked) {
        copyAddress(form.addresses.supplierAddress, "dispatchAddress");
      }
    },
    [form.addresses.supplierAddress, copyAddress],
  );

  const handleCopyBillingToShipping = useCallback(
    (checked: boolean) => {
      setCopyBillingToShipping(checked);
      if (checked) {
        copyAddress(form.addresses.companyBillingAddress, "shippingAddress");
      }
    },
    [form.addresses.companyBillingAddress, copyAddress],
  );

  const supplierData = useMemo(
    () => form.addresses.supplierAddress,
    [form.addresses.supplierAddress],
  );

  const companyBillingData = useMemo(
    () => form.addresses.companyBillingAddress,
    [form.addresses.companyBillingAddress],
  );

  const shippingData = useMemo(
    () => form.addresses.shippingAddress,
    [form.addresses.shippingAddress],
  );

  const dispatchData = useMemo(
    () => form.addresses.dispatchAddress,
    [form.addresses.dispatchAddress],
  );

  return (
    <div className="space-y-6">
      {/* Top fields */}
      <div className="grid grid-cols-4 gap-4 p-4">
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
            copyChecked={copyBillingToShipping}
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
            copyChecked={copySupplierToDispatch}
            onCopyToggle={handleCopySupplierToDispatch}
          />
        </div>
      </div>
    </div>
  );
};
