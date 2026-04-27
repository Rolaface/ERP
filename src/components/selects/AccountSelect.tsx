import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getComponentById } from "../../api/Accounting/JournalEntryApi";

type Account = {
  name: string;
  currency: string;
};

interface AccountSelectProps {
  value?: string;
  onChange: (account: { name: string; currency: string }) => void;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function AccountSelect({
  value = "",
  onChange,
  className = "",
  label = "Account",
  required = false,
  disabled = false,
}: AccountSelectProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false initially
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // 1. New function to fetch accounts on demand
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await getComponentById(
        "Account",
        ["name", "account_currency"],
        [["is_group", "=", 1]]
      );

      const rawAccounts =
        res?.data?.message?.data ||
        res?.data?.message ||
        res?.data?.data ||
        res?.data ||
        [];

      if (Array.isArray(rawAccounts)) {
        setAccounts(
          rawAccounts.map((a: any) => ({
            name: a.name,
            currency: a.account_currency || "",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch account options", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Handle positioning and auto-closing on scroll
  useEffect(() => {
    if (open && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current!.getBoundingClientRect();
        setDropdownStyle({
          position: "fixed",
          top: rect.bottom + 4, 
          left: rect.left,
          width: rect.width,
          zIndex: 99999, 
        });
      };

      updatePosition();

      const handleScroll = (e: Event) => {
        // 2. FIX: Check if e.target is actually a Node before using contains()
        if (
          dropdownRef.current &&
          e.target instanceof Node && 
          dropdownRef.current.contains(e.target)
        ) {
          return;
        }
        setOpen(false);
      };

      window.addEventListener("scroll", handleScroll, true); 
      window.addEventListener("resize", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [open]);

  // Check clicks outside both the input AND the portal dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAccounts = accounts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // 3. Handler to open dropdown and fetch fresh data
  const handleInteraction = () => {
    if (!disabled) {
      setOpen(true);
      fetchAccounts();
    }
  };

  return (
    <div className={`w-full min-w-0 flex flex-col ${className}`}>
      {label && (
        <span className="block text-[10px] font-medium text-main mb-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}

      <div ref={containerRef} className="relative w-full">
        <input
          className={[
            "py-1 px-2 border rounded text-[11px] text-main bg-card w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
            "border-[var(--border)]",
            disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "hover:border-primary/40",
          ].join(" ")}
          placeholder={loading ? "Loading..." : "Select Account"}
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) handleInteraction();
          }}
          onFocus={handleInteraction} // Fetches on focus/tab-in
          onClick={handleInteraction} // Fetches on click
        />

        {open && !disabled && createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-card bg-white border border-[var(--border)] border-gray-200 shadow-xl rounded z-50 overflow-hidden"
          >
            <ul className="max-h-56 overflow-y-auto text-[13px] m-0 p-0 relative">
              {/* Show a mini loading indicator inside the dropdown if fetching */}
              {loading && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
                   <div className="h-full bg-blue-500 animate-pulse"></div>
                 </div>
              )}
              
              {filteredAccounts.map((account) => (
                <li
                  key={account.name}
                  className="px-2 py-1 cursor-pointer hover:bg-primary/5 hover:bg-gray-100 text-main text-[11px]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setSearch(account.name);
                    setOpen(false);
                    onChange({ name: account.name, currency: account.currency });
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{account.name}</span>
                    {account.currency && (
                      <span className="text-xs text-muted ml-2 shrink-0">
                        ({account.currency})
                      </span>
                    )}
                  </div>
                </li>
              ))}

              {!loading && filteredAccounts.length === 0 && (
                <li className="px-2 py-1 text-muted text-[11px]">
                  No match found
                </li>
              )}
            </ul>
          </div>,
          document.body 
        )}
      </div>
    </div>
  );
}