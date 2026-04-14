import React, { useCallback, useEffect, useRef, memo, useState } from "react";
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
import type { PurchaseOrderFormData } from "../../../types/Supply/purchaseOrder";
import type { PurchaseInvoiceFormData } from "../../../types/Supply/purchaseInvoice";
import {
  useAddressLogic,
  BOX_CONFIGS,
  type ApiAddress,
  type BoxType,
} from "../../../hooks/useAddressLogic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressTabProps {
  form: PurchaseOrderFormData | PurchaseInvoiceFormData | any;
  onFormChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: any } },
  ) => void;
  /** These props are kept for API compatibility but not rendered */
  customShippingRule?: string;
  setCustomShippingRule?: React.Dispatch<React.SetStateAction<string>>;
  customIncoterm?: string;
  setCustomIncoterm?: React.Dispatch<React.SetStateAction<string>>;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return [addr.phone, addr.email].filter(Boolean).join(" · ");
}

// ─── AddressPicker ────────────────────────────────────────────────────────────

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
          placeholder="Search addresses..."
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
                className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-card border border-transparent"
                }`}
              >
                <div
                  className={`mt-0.5 shrink-0 w-3 h-3 rounded-full border flex items-center justify-center ${
                    isSelected ? "bg-primary border-primary" : "border-theme"
                  }`}
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
});

// ─── AddressBox ───────────────────────────────────────────────────────────────

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
}> = memo(({ config, addresses, selectedAddr, loading, onSelect, onOpen }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
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
      {/* Header */}
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
          className="p-0.5 rounded hover:bg-card transition-colors text-muted"
        >
          {pickerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Body */}
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
                {selectedAddr.title || selectedAddr.id}
                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {selectedAddr.addressType}
                </span>
              </p>
              <p className="text-[10px] text-sub mt-0.5 leading-relaxed">
                {formatAddressPreview(selectedAddr)}
              </p>
              {(selectedAddr.phone || selectedAddr.email) && (
                <p className="text-[10px] text-primary mt-0.5">
                  {formatContactInfo(selectedAddr)}
                </p>
              )}
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

      {/* Picker dropdown */}
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

// ─── AddressTab (main export) ─────────────────────────────────────────────────

export const AddressTab: React.FC<AddressTabProps> = memo(
  ({
    form,
    onFormChange,
    supplierId,
    selected,
    setSelected,
    selectedIds,
    setSelectedIds,
    addresses,
    setAddresses,
    loading,
    setLoading,
    // incoterm / shipping props accepted but intentionally not used
  }) => {
    const { handleSelect, loadAddresses } = useAddressLogic({
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

    return (
      <div className="space-y-4">
        {/* Address grid: 2 columns, 2 rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3 pb-3">
          {/* Left column */}
          <div className="space-y-3">
            <AddressBox
              config={BOX_CONFIGS[0]} // companyBilling
              addresses={addresses.companyBilling}
              selectedAddr={selected.companyBilling}
              loading={loading.companyBilling}
              onSelect={(addr) => handleSelect("companyBilling", addr)}
              onOpen={() => loadAddresses("companyBilling")}
            />
            <AddressBox
              config={BOX_CONFIGS[1]} // supplierBilling
              addresses={addresses.supplierBilling}
              selectedAddr={selected.supplierBilling}
              loading={loading.supplierBilling}
              onSelect={(addr) => handleSelect("supplierBilling", addr)}
              onOpen={() => loadAddresses("supplierBilling")}
            />
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <AddressBox
              config={BOX_CONFIGS[2]} // companyShipping
              addresses={addresses.companyShipping}
              selectedAddr={selected.companyShipping}
              loading={loading.companyShipping}
              onSelect={(addr) => handleSelect("companyShipping", addr)}
              onOpen={() => loadAddresses("companyShipping")}
            />
            <AddressBox
              config={BOX_CONFIGS[3]} // supplierDispatch
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
  },
);