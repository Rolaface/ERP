import { useCallback, useRef } from "react";
import { MapPin, Truck, Building2 } from "lucide-react";
import { getAddressList } from "../api/Adressapi";

export interface ApiAddress {
  id: string;
  title: string;
  type: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  email: string | null;
  phone: string | null;
  addressType: string;
}

export type BoxType =
  | "companyBilling"
  | "supplierBilling"
  | "companyShipping"
  | "supplierDispatch";

interface AddressBoxConfig {
  key: BoxType;
  title: string;
  icon: React.ElementType;
  addressType: string;
}

export const BOX_CONFIGS: AddressBoxConfig[] = [
  {
    key: "companyBilling",
    title: "Company Billing",
    icon: Building2,
    addressType: "Billing",
  },
  {
    key: "supplierBilling",
    title: "Supplier Billing",
    icon: MapPin,
    addressType: "Billing",
  },
  {
    key: "companyShipping",
    title: "Company Shipping",
    icon: Truck,
    addressType: "Shipping",
  },
  {
    key: "supplierDispatch",
    title: "Supplier Dispatch",
    icon: Truck,
    addressType: "Dispatch",
  },
];

const prefixMap: Record<BoxType, string> = {
  companyBilling: "companyBillingAddress",
  supplierBilling: "supplierAddress",
  companyShipping: "shippingAddress",
  supplierDispatch: "dispatchAddress",
};

interface UseAddressLogicOptions {
  supplierId?: string;
  selected: Record<BoxType, ApiAddress | null>;
  setSelected: React.Dispatch<
    React.SetStateAction<Record<BoxType, ApiAddress | null>>
  >;
  selectedIds: Record<BoxType, string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Record<BoxType, string>>>;
  addresses: Record<BoxType, ApiAddress[]>;
  setAddresses: React.Dispatch<
    React.SetStateAction<Record<BoxType, ApiAddress[]>>
  >;
  loading: Record<BoxType, boolean>;
  setLoading: React.Dispatch<React.SetStateAction<Record<BoxType, boolean>>>;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement> | any) => void;
}

export function useAddressLogic({
  supplierId,
  selected,
  setSelected,
  selectedIds,
  setSelectedIds,
  addresses,
  setAddresses,
  loading,
  setLoading,
  onFormChange,
}: UseAddressLogicOptions) {
  const lastParamsRef = useRef<Record<BoxType, string>>({
    companyBilling: "",
    supplierBilling: "",
    companyShipping: "",
    supplierDispatch: "",
  });

  const applyAddressToForm = useCallback(
    (prefix: string, addr: ApiAddress) => {
      onFormChange({
        target: { name: `addresses.${prefix}.id`, value: addr.id },
      });
      onFormChange({
        target: { name: `addresses.${prefix}.addressTitle`, value: addr.title },
      });
      onFormChange({
        target: {
          name: `addresses.${prefix}.addressType`,
          value: addr.addressType,
        },
      });
      onFormChange({
        target: {
          name: `addresses.${prefix}.addressLine1`,
          value: addr.addressLine1 ?? "",
        },
      });
      onFormChange({
        target: {
          name: `addresses.${prefix}.addressLine2`,
          value: addr.addressLine2 ?? "",
        },
      });
      onFormChange({
        target: { name: `addresses.${prefix}.city`, value: addr.city ?? "" },
      });
      onFormChange({
        target: { name: `addresses.${prefix}.state`, value: addr.state ?? "" },
      });
      onFormChange({
        target: {
          name: `addresses.${prefix}.country`,
          value: addr.country ?? "",
        },
      });
      onFormChange({
        target: {
          name: `addresses.${prefix}.postalCode`,
          value: addr.pincode ?? "",
        },
      });
      onFormChange({
        target: { name: `addresses.${prefix}.phone`, value: addr.phone ?? "" },
      });
      onFormChange({
        target: { name: `addresses.${prefix}.email`, value: addr.email ?? "" },
      });
    },
    [onFormChange],
  );

  const handleSelect = useCallback(
    (boxKey: BoxType, addr: ApiAddress) => {
      setSelected((prev) => ({ ...prev, [boxKey]: addr }));
      setSelectedIds((prev) => ({ ...prev, [boxKey]: addr.id }));
      applyAddressToForm(prefixMap[boxKey], addr);
    },
    [setSelected, setSelectedIds, applyAddressToForm],
  );

  const loadAddresses = useCallback(
    async (boxKey: BoxType) => {
      let params:
        | { company: true }
        | { supplier: string }
        | { supplier: string; addressType: string };

      if (boxKey === "companyBilling" || boxKey === "companyShipping") {
        params = { company: true };
      } else {
        if (!supplierId) return;
        const config = BOX_CONFIGS.find((c) => c.key === boxKey);

        if (boxKey === "supplierDispatch") {
          params = {
            supplier: supplierId,
          };
        } else {
          params = {
            supplier: supplierId,
            addressType: config?.addressType || "Billing",
          };
        }
      }

      const key = JSON.stringify(params);

      if (boxKey !== "supplierDispatch") {
        if (lastParamsRef.current[boxKey] === key) return;
        lastParamsRef.current[boxKey] = key;
      }

      setLoading((prev) => ({ ...prev, [boxKey]: true }));

      try {
        let apiParams: {
          company?: boolean;
          supplierId?: string;
          addressType?: string;
        } = {};

        if ("company" in params) {
          apiParams.company = true;
        } else {
          apiParams.supplierId = params.supplier;

          if ("addressType" in params) {
            apiParams.addressType = params.addressType;
          }
        }

        const data = await getAddressList(apiParams);
        setAddresses((prev) => ({ ...prev, [boxKey]: data }));

        if (data && data.length > 0) {
          const first = data[0];
          setSelected((prev) => ({ ...prev, [boxKey]: first }));
          setSelectedIds((prev) => ({ ...prev, [boxKey]: first.id }));
          applyAddressToForm(prefixMap[boxKey], first);
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        setLoading((prev) => ({ ...prev, [boxKey]: false }));
      }
    },
    [
      supplierId,
      setSelected,
      setSelectedIds,
      setAddresses,
      setLoading,
      applyAddressToForm,
    ],
  );

  const handleCopyBillingToShipping = useCallback(
    (checked: boolean) => {
      onFormChange({ target: { name: "useShippingAddress", value: checked } });
      if (checked && selected.companyBilling) {
        setSelected((prev) => ({
          ...prev,
          companyShipping: prev.companyBilling,
        }));
        setSelectedIds((prev) => ({
          ...prev,
          companyShipping: prev.companyBilling.id,
        }));
        applyAddressToForm("shippingAddress", selected.companyBilling);
      }
    },
    [selected, setSelected, setSelectedIds, applyAddressToForm, onFormChange],
  );

  const handleCopySupplierToDispatch = useCallback(
    (checked: boolean) => {
      onFormChange({ target: { name: "useDispatchAddress", value: checked } });
      if (checked && selected.supplierBilling) {
        setSelected((prev) => ({
          ...prev,
          supplierDispatch: prev.supplierBilling,
        }));
        setSelectedIds((prev) => ({
          ...prev,
          supplierDispatch: prev.supplierBilling.id,
        }));
        applyAddressToForm("dispatchAddress", selected.supplierBilling);
      }
    },
    [selected, setSelected, setSelectedIds, applyAddressToForm, onFormChange],
  );

  return {
    selected,
    selectedIds,
    addresses,
    loading,
    loadAddresses,
    handleSelect,
    handleCopyBillingToShipping,
    handleCopySupplierToDispatch,
  };
}
