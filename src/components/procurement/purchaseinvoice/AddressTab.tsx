import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  MapPin,
  Truck,
  Building2,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Check,
} from "lucide-react";
import { ModalSelect, ModalInput } from "../../ui/modal/modalComponent";
import type { PurchaseOrderFormData } from "../../../types/Supply/purchaseOrder";
import type { PurchaseInvoiceFormData } from "../../../types/Supply/purchaseInvoice";
import {
  useAddressLogic,
  BOX_CONFIGS,
  ApiAddress,
  BoxType,
} from "../../../hooks/useAddressLogic";

interface AddressTabProps {
  form: PurchaseOrderFormData | PurchaseInvoiceFormData;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
}> = ({ addresses, selectedId, onSelect, loading }) => {
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
      <div className="border-t border-theme px-2 py-1.5">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
        >
          <Plus size={11} /> Add new
        </button>
      </div>
    </div>
  );
};

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
  onOpen: () => void;
}> = ({ config, addresses, selectedAddr, loading, onSelect, onOpen }) => {
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
    if (!pickerOpen) onOpen();
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
              {selectedAddr.title.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-main truncate">
                {selectedAddr.title}
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
};

export const AddressTab: React.FC<AddressTabProps> = ({
  form,
  onFormChange,
  customShippingRule,
  setCustomShippingRule,
  customIncoterm,
  setCustomIncoterm,
  supplierId,
  companyId,
  selected,
  setSelected,
  selectedIds,
  setSelectedIds,
  addresses,
  setAddresses,
  loading,
  setLoading,
}) => {
  const {
    handleSelect,
    loadAddresses,
    handleCopyBillingToShipping,
    handleCopySupplierToDispatch,
  } = useAddressLogic({
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
  });

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
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 p-3">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3 pb-3">
        <div className="space-y-3">
          <AddressBox
            config={BOX_CONFIGS[0]}
            addresses={addresses.companyBilling}
            selectedAddr={selected.companyBilling}
            loading={loading.companyBilling}
            onSelect={(addr) => handleSelect("companyBilling", addr)}
            onOpen={() => loadAddresses("companyBilling")}
          />
          <AddressBox
            config={BOX_CONFIGS[1]}
            addresses={addresses.supplierBilling}
            selectedAddr={selected.supplierBilling}
            loading={loading.supplierBilling}
            onSelect={(addr) => handleSelect("supplierBilling", addr)}
            onOpen={() => loadAddresses("supplierBilling")}
          />
        </div>
        <div className="space-y-3">
          <AddressBox
            config={BOX_CONFIGS[2]}
            addresses={addresses.companyShipping}
            selectedAddr={selected.companyShipping}
            loading={loading.companyShipping}
            onSelect={(addr) => handleSelect("companyShipping", addr)}
            onOpen={() => loadAddresses("companyShipping")}
          />
          <AddressBox
            config={BOX_CONFIGS[3]}
            addresses={addresses.supplierDispatch}
            selectedAddr={selected.supplierDispatch}
            loading={loading.supplierDispatch}
            onSelect={(addr) => handleSelect("supplierDispatch", addr)}
            onOpen={() => loadAddresses("supplierDispatch")}
          />
        </div>
      </div>
    </div>
  );
};
