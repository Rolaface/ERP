import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Check,
} from "lucide-react";
import { ModalInput } from "../../ui/modal/modalComponent";
import type { PurchaseOrderFormData } from "../../../types/Supply/purchaseOrder";
import type { PurchaseInvoiceFormData } from "../../../types/Supply/purchaseInvoice";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getShippingRules } from "../../../api/utils/shippingruleapi";
import { getIncoterms } from "../../../api/utils/incotermApi";
import {
  BOX_CONFIGS,
  ApiAddress,
  BoxType,
} from "../../../hooks/useAddressLogic";

const mapFormAddressToApi = (addr: any): ApiAddress | null => {
  if (!addr?.id) return null;

  return {
    id: addr.id,
    title: addr.addressTitle || addr.id,
    addressType: addr.addressType || "",
    addressLine1: addr.addressLine1 || "",
    addressLine2: addr.addressLine2 || "",
    city: addr.city || "",
    state: addr.state || "",
    country: addr.country || "",
    pincode: addr.postalCode || "",
    phone: addr.phone || "",
    email: addr.email || "",
  };
};

interface AddressTabProps {
  form: PurchaseOrderFormData | PurchaseInvoiceFormData;
  onFormChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: any } },
  ) => void;
  customShippingRule: string;
  setCustomShippingRule: React.Dispatch<React.SetStateAction<string>>;
  customIncoterm: string;
  setCustomIncoterm: React.Dispatch<React.SetStateAction<string>>;
  supplierId?: string;
  companyId?: string;
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
  handleAddressSelect: (boxKey: BoxType, addr: ApiAddress) => void;
  handleCopyBillingToShipping: (checked: boolean) => void;
  handleCopySupplierToDispatch: (checked: boolean) => void;
}

function formatAddressPreview(addr: ApiAddress): string {
  const lines = [addr.addressLine1, addr.addressLine2]
    .filter(Boolean)
    .join(", ");
  const location = [addr.city, addr.state, addr.pincode, addr.country]
    .filter(Boolean)
    .join(", ");
  return lines + (lines && location ? " · " : "") + location;
}

function formatContactInfo(addr: ApiAddress): string {
  const parts = [addr.phone, addr.email].filter(Boolean);
  return parts.join(" · ");
}

const AddressPicker: React.FC<{
  addresses: ApiAddress[];
  selectedId: string | null;
  onSelect: (addr: ApiAddress) => void;
  loading: boolean;
}> = memo(({ addresses, selectedId, onSelect, loading }) => {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? addresses.filter(
      (a) =>
        a.id.toLowerCase().includes(query.toLowerCase()) ||
        a.title.toLowerCase().includes(query.toLowerCase()),
    )
    : addresses;

  return (
    <div className="mt-2 border border-theme rounded-lg bg-app overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-theme">
        <Search size={12} className="text-sub shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-xs text-main placeholder:text-sub outline-none"
        />
      </div>
      <div className="max-h-40 overflow-y-auto p-1 space-y-0.5">
        {loading ? (
          <div className="py-4 text-center text-xs text-sub">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-4 text-center text-xs text-sub">
            No addresses found
          </div>
        ) : (
          filtered.map((addr) => {
            const isSelected = addr.id === selectedId;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelect(addr)}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-card border border-transparent"}`}
              >
                <div
                  className={`mt-0.5 shrink-0 w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-theme"}`}
                >
                  {isSelected && <Check size={6} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-xs font-medium text-main truncate">
                    {addr.id}
                  </span>
                  <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-sub/20 text-sub font-medium">
                    {addr.addressType}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
      {/* <div className="border-t border-theme px-2 py-1.5">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
        >
          <Plus size={11} /> Add new
        </button>
      </div> */}
    </div>
  );
});

const AddressBox: React.FC<{
  config: {
    key: BoxType;
    title: string;
    icon: React.ElementType;
    addressType: string;
  };
  addresses: ApiAddress[];
  selectedAddr: ApiAddress | null;
  loading: boolean;
  onSelect: (addr: ApiAddress) => void;
}> = memo(({ config, addresses, selectedAddr, loading, onSelect }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(
    (addr: ApiAddress) => {
      onSelect(addr);
      setPickerOpen(false);
    },
    [onSelect],
  );
  const togglePicker = () => {
    setPickerOpen((v) => !v);
  };
  const Icon = config.icon;

  return (
    <div
      ref={wrapperRef}
      className="bg-card border border-theme rounded-lg shadow-sm overflow-visible"
    >
      <div className="flex items-center justify-between px-3 py-2 bg-app border-b border-theme rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary p-1.5 rounded">
            <Icon size={13} />
          </div>
          <p className="text-xs font-semibold text-main">{config.title}</p>
        </div>
        <button
          type="button"
          onClick={togglePicker}
          className="p-0.5 rounded row-hover"
        >
          {pickerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      <div className="px-3 py-2">
        {selectedAddr ? (
          <div className="flex items-start gap-2">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-semibold">
              {(selectedAddr.title || selectedAddr.id || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-main truncate">
                {selectedAddr.title
                  || selectedAddr.addressLine1
                  || selectedAddr.id}
                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {selectedAddr.addressType}
                </span>
              </p>
              <p className="text-[10px] text-sub mt-0.5 leading-relaxed">
                {formatAddressPreview(selectedAddr)}
              </p>
              {selectedAddr.phone || selectedAddr.email ? (
                <p className="text-[10px] text-primary mt-0.5">
                  {formatContactInfo(selectedAddr)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={togglePicker}
              className="shrink-0 text-[10px] text-primary hover:opacity-70 transition-opacity mt-0.5"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={togglePicker}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded border border-dashed border-theme text-[10px] text-sub hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Plus size={12} /> Select address
          </button>
        )}
      </div>
      {pickerOpen && (
        <div className="px-3 pb-3">
          <AddressPicker
            addresses={addresses}
            selectedId={selectedAddr?.id ?? null}
            onSelect={handleSelect}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
});

export const AddressTab: React.FC<AddressTabProps> = memo(({
  form,
  onFormChange,
  customShippingRule,
  setCustomShippingRule,
  customIncoterm,
  setCustomIncoterm,
  selected,
  addresses,
  loading,
  handleAddressSelect,
}) => {
  const [incotermLabel, setIncotermLabel] = useState("");
  const [shippingLabel, setShippingLabel] = useState("");


  //SHOW API FIRST VALUE DEFUALT
  useEffect(() => {
    const loadDefaultIncoterm = async () => {
      const list = await getIncoterms("");

      if (!list || list.length === 0) return;

      const first = list[0];

      onFormChange({
        target: { name: "incoterm", value: first.value },
      });

      setIncotermLabel(first.label);
    };

    if (!incotermLabel) {
      loadDefaultIncoterm();
    }
  }, [incotermLabel]);
  //incoterm edit
  useEffect(() => {
    if (form.incoterm && !incotermLabel) {
      const loadLabel = async () => {
        const list = await getIncoterms("");

        const found = list.find((i) => i.value === form.incoterm);
        if (found) setIncotermLabel(found.label);
      };

      loadLabel();
    }
  }, [form.incoterm]);

  //shipping
  useEffect(() => {
    const loadDefaultShipping = async () => {
      const list = await getShippingRules("");

      if (!list || list.length === 0) return;

      const first = list[0];

      onFormChange({
        target: { name: "shippingRule", value: first.value },
      });

      setShippingLabel(first.label);
    };

    if (!shippingLabel) {
      loadDefaultShipping();
    }
  }, [shippingLabel]);

  const fetchShippingRules = async (q: string) => {
    const list = await getShippingRules(q);

    return list.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  };
  const handleResetShippingRule = useCallback(() => {
    setCustomShippingRule("");
    onFormChange({
      target: { name: "shippingRule", value: "" },
    });
  }, [setCustomShippingRule, onFormChange]);
  const fetchIncoterms = async (q: string) => {
    const list = await getIncoterms(q);

    return list.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  };

  const handleResetIncoterm = useCallback(() => {
    setCustomIncoterm("");
    onFormChange({
      target: { name: "incoterm", value: "" },
    });
  }, [setCustomIncoterm, onFormChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 p-3">
        <div className="relative">
          <SearchSelect2
            label="Shipping Rule"
            value={form.shippingRule}
            onChange={(val, option) => {
              onFormChange({
                target: { name: "shippingRule", value: val },
              });

              setShippingLabel(option.label);

              if (val !== "OTHER") setCustomShippingRule("");
            }}
            fetchOptions={fetchShippingRules}
          />
          {form.shippingRule === "OTHER" && (
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="relative">
                <ModalInput
                  label=""
                  placeholder="Enter custom"
                  value={customShippingRule}
                  onChange={(e) => setCustomShippingRule(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleResetShippingRule}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sub hover:text-main text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <SearchSelect2
            label="Incoterm"
            value={incotermLabel}
            onChange={(val, option) => {
              onFormChange({
                target: { name: "incoterm", value: val },
              });

              setIncotermLabel(option.label);

              if (val !== "OTHER") setCustomIncoterm("");
            }}
            fetchOptions={fetchIncoterms}
          />
          {form.incoterm === "OTHER" && (
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="relative">
                <ModalInput
                  label=""
                  placeholder="Enter custom"
                  value={customIncoterm}
                  onChange={(e) => setCustomIncoterm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleResetIncoterm}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sub hover:text-main text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
        <ModalInput
          label="Supplier Contact"
          name="supplierContactDisplay"
          value={form.supplierContactDisplay || ""}
          onChange={onFormChange}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3 pb-3">
        <div className="space-y-3">
          <AddressBox
            config={BOX_CONFIGS[0]}
            addresses={addresses.companyBilling}
            selectedAddr={
              selected.companyBilling
              ?? mapFormAddressToApi(form.addresses?.companyBillingAddress)
            }
            loading={loading.companyBilling}
            onSelect={(addr) => handleAddressSelect("companyBilling", addr)}
          />
          <AddressBox
            config={BOX_CONFIGS[1]}
            addresses={addresses.supplierBilling}
            selectedAddr={
              selected.supplierBilling
              ?? mapFormAddressToApi(form.addresses?.supplierAddress)
            }
            loading={loading.supplierBilling}
            onSelect={(addr) => handleAddressSelect("supplierBilling", addr)}
          />
        </div>
        <div className="space-y-3">
          <AddressBox
            config={BOX_CONFIGS[2]}
            addresses={addresses.companyShipping}
            selectedAddr={
              selected.companyShipping
              ?? mapFormAddressToApi(form.addresses?.shippingAddress)
            }
            loading={loading.companyShipping}
            onSelect={(addr) => handleAddressSelect("companyShipping", addr)}
          />
          <AddressBox
            config={BOX_CONFIGS[3]}
            addresses={addresses.supplierDispatch}
            selectedAddr={
              selected.supplierDispatch
              ?? mapFormAddressToApi(form.addresses?.dispatchAddress)
            }
            loading={loading.supplierDispatch}
            onSelect={(addr) => handleAddressSelect("supplierDispatch", addr)}
          />
        </div>
      </div>
    </div>
  );
});
