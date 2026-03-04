import React, { useEffect, useRef, useState } from "react";
import { getAllCustomers } from "../../api/customerApi";

type Customer = {
  id: string;
  name: string;
  customerCode?: string;
};

interface CustomerSelectProps {
  value?: string;
  selectedId?: string;
  onChange: (customer: { id: string; name: string }) => void;
  className?: string;
  label?: string;
  taxCategory?: string;
  required?: boolean;
}

export default function CustomerSelect({
  value = "",
  selectedId,
  onChange,
  className = "",
  label = "Customer",
  taxCategory,
  required = false,
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const res = await getAllCustomers(1, 100, taxCategory);
        if (res?.status_code !== 200) return;

        setCustomers(
          res.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            customerCode: c.code ?? c.customerCode,
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [taxCategory]);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (!selectedId || customers.length === 0) return;
    const selected = customers.find((c) => c.id === selectedId);
    if (selected) setSearch(selected.name);
  }, [selectedId, customers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={`w-full min-w-0 flex flex-col gap-1 ${className}`}>
      <span className="block text-[10px] font-medium text-main mb-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>

      <div ref={containerRef} className="relative w-full">
        <input
          className={[
            "py-1 px-2 border rounded text-[11px] text-main bg-card w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
            "border-[var(--border)] hover:border-primary/40",
          ].join(" ")}
          placeholder={loading ? "Loading..." : "Select"}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && !loading && (
          <div className="absolute left-0 top-full mt-1 w-full max-w-full bg-card border border-[var(--border)] shadow rounded z-30">
            <ul className="max-h-56 overflow-y-auto text-[13px]">
              {filteredCustomers.map((customer) => (
                <li
                  key={customer.id}
                  className="px-2 py-1 cursor-pointer hover:bg-primary/5 text-main text-[11px]"
                  onClick={() => {
                    setSearch(customer.name);
                    setOpen(false);
                    onChange({ id: customer.id, name: customer.name });
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{customer.name}</span>
                    {customer.customerCode && (
                      <span className="text-xs text-muted">
                        {customer.customerCode}
                      </span>
                    )}
                  </div>
                </li>
              ))}

              {filteredCustomers.length === 0 && (
                <li className="px-2 py-1 text-muted text-[11px]">No match found</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
