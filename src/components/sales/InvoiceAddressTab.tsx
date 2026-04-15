import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  MapPin,
  Truck,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Check,
} from "lucide-react";
import { getAddressList } from "../../api/Adressapi";

interface ApiAddress {
  id: string;
  title: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  email?: string | null;
  phone?: string | null;
  addressType: string;
}

interface Props {
  customerId?: string;
  formData: any;
  onFormChange: (e: any) => void;
}

const formatAddressPreview = (addr: ApiAddress) => {
  const line = [addr.addressLine1, addr.addressLine2]
    .filter(Boolean)
    .join(", ");
  const loc = [addr.city, addr.state, addr.pincode, addr.country]
    .filter(Boolean)
    .join(", ");
  return line + (line && loc ? " · " : "") + loc;
};

const AddressPicker = memo(({ list, selectedId, onSelect, loading }: any) => {
  const [query, setQuery] = useState("");

  const filtered = query
    ? list.filter(
        (a: ApiAddress) =>
          a.id.toLowerCase().includes(query.toLowerCase()) ||
          a.title.toLowerCase().includes(query.toLowerCase()),
      )
    : list;
    

  return (
    <div className="mt-2 border border-theme rounded-lg bg-app">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-theme">
        <Search size={12} />
        <input
          className="flex-1 text-xs bg-transparent outline-none"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="max-h-40 overflow-y-auto p-1">
        {loading ? (
          <div className="text-xs text-center py-3">Loading...</div>
        ) : (
          filtered.map((addr: ApiAddress) => {
            const isSelected = addr.id === selectedId;
            return (
              <button
                type="button"
                key={addr.id}
                onClick={() => onSelect(addr)}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  isSelected
                    ? "bg-primary/10 border border-primary"
                    : "hover:bg-card"
                }`}
              >
                <div className="w-3 h-3 rounded-full border flex items-center justify-center">
                  {isSelected && <Check size={8} />}
                </div>
                <span className="text-xs">{addr.id}</span>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t px-2 py-1">
        <button
          type="button"
          className="text-xs text-primary flex items-center gap-1"
        >
          <Plus size={12} /> Add new
        </button>
      </div>
    </div>
  );
});

const AddressBox = memo(
  ({ title, icon: Icon, selected, list, loading, onSelect, onOpen }: any) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: any) => {
        if (!ref.current?.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggle = () => {
      if (!open) onOpen();
      setOpen(!open);
    };

    
    return (
      <div ref={ref} className="bg-card border rounded-lg">
        <div className="flex justify-between items-center px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Icon size={14} />
            <span className="text-xs font-semibold">{title}</span>
          </div>
          <button type="button" onClick={toggle}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <div className="p-2">
          {selected ? (
            <div>
              <div className="text-xs font-medium">
  {typeof selected.title === "string"
    ? selected.title
    : JSON.stringify(selected.title)}
</div>
              <div className="text-[10px] text-muted">
                {formatAddressPreview(selected)}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggle}
              className="text-xs text-primary"
            >
              Select address
            </button>
          )}
        </div>

        {open && (
          <div className="p-2">
            <AddressPicker
              list={list}
              selectedId={selected?.id}
              loading={loading}
              onSelect={(addr: ApiAddress) => {
                onSelect(addr);
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    );
  },
);

export const InvoiceAddressTab: React.FC<Props> = ({
  customerId,
  formData,
  onFormChange,
}) => {
  const [billingList, setBillingList] = useState<ApiAddress[]>([]);
  const [shippingList, setShippingList] = useState<ApiAddress[]>([]);

  const [loading, setLoading] = useState(false);

  const loadAddresses = async () => {
    if (!customerId) return;
    setLoading(true);

    try {
      const billing = await getAddressList({
        customerId,
        addressType: "Billing",
      });

      const shipping = await getAddressList({
        customerId,
        addressType: "Shipping",
      });

      setBillingList(billing);
      setShippingList(shipping);
    } catch (e) {
      console.error("Address fetch failed", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  if (customerId) {
    loadAddresses();
  }
}, [customerId]);

//billing block
const selectedBilling =
  billingList.find((a) => a.id === formData.billingAddress) ||
  (formData.billingAddress
    ? { id: formData.billingAddress, title: String(formData.billingAddress) }
    : null);
 
    //shipping block 
    const selectedShipping =
  shippingList.find((a) => a.id === formData.shippingAddress) ||
  (formData.shippingAddress
    ? { id: formData.shippingAddress, title: formData.shippingAddress }
    : null);

  const handleBilling = useCallback((addr: ApiAddress) => {
    onFormChange({
      target: { name: "billingAddress", value: addr.id },
    });
  }, []);

  const handleShipping = useCallback((addr: ApiAddress) => {
    onFormChange({
      target: { name: "shippingAddress", value: addr.id },
    });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 p-3">
      <AddressBox
        title="Customer Billing"
        icon={MapPin}
        selected={selectedBilling}
        list={billingList}
        loading={loading}
        onSelect={handleBilling}
        onOpen={loadAddresses}
      />

      <AddressBox
        title="Customer Shipping"
        icon={Truck}
        selected={selectedShipping}
        list={shippingList}
        loading={loading}
        onSelect={handleShipping}
        onOpen={loadAddresses}
      />
    </div>
  );
};
