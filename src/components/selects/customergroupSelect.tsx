import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { getCustomerGroups } from "../../api/customerApi";

type CustomerGroup = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
};

const CustomerGroupSearchSelect: React.FC<Props> = ({
  value,
  onChange,
  label = "Customer Group",
  required = false,
  error,
}) => {
  const [results, setResults] = useState<CustomerGroup[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Resolve display label when value is set externally (edit mode) ─────────
  useEffect(() => {
    if (!value) {
      setSearch("");
      return;
    }
    const resolveLabel = async () => {
      try {
        const res = await getCustomerGroups(value);
        const data: CustomerGroup[] = res?.message?.data ?? [];
        const found = data.find((g) => g.value === value);
        setSearch(found ? found.label : value);
      } catch {
        setSearch(value);
      }
    };
    resolveLabel();
  }, [value]);

  // ── Fetch groups from API ──────────────────────────────────────────────────
const fetchGroups = useCallback(async (query: string) => {
  setLoading(true);
  try {
    const res = await getCustomerGroups();

    const all = res?.data ?? [];

    console.log("DATA:", all);

    if (!Array.isArray(all)) {
      setResults([]);
      return;
    }

    if (!query) {
      setResults(all); // show all when empty
      return;
    }

    const filtered = all.filter((g: CustomerGroup) =>
      g.label?.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  } catch (err) {
    console.error("Customer group search error:", err);
    setResults([]);
  } finally {
    setLoading(false);
  }
}, []);
  // ── Handle typing — debounce 300ms ────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    openDropdown();

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGroups(val), 300);
  };

  // ── On focus — load initial list ──────────────────────────────────────────
  const handleFocus = () => {
    openDropdown();
    if (results.length === 0) fetchGroups(search);
  };

  // ── Portal positioning ────────────────────────────────────────────────────
  const openDropdown = () => {
    if (!inputRef.current) return;
    setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  };

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cleanup debounce on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelect = (item: CustomerGroup) => {
    setSearch(item.label);
    setOpen(false);
    onChange?.(item.value);
  };

  return (
    <div className="flex flex-col  w-full">
      {label && (
        <span className="block text-[10px] font-medium text-main mb-1">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
      )}

      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Search customer group..."
        className={[
          "w-full py-1 px-2 border rounded text-[11px] text-main bg-card transition-all focus:outline-none",
          error
            ? "border-danger"
            : "border-[var(--border)] hover:border-primary/40 focus:border-primary",
        ].join(" ")}
      />

      {error && (
        <span className="text-[10px] text-danger mt-0.5">{error}</span>
      )}

      {open &&
        rect &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX,
              width: rect.width,
              zIndex: 9999,
            }}
            className="bg-card border border-theme rounded shadow-lg"
          >
            <ul className="max-h-56 overflow-y-auto text-[11px]">
              {loading && (
                <li className="px-3 py-2 text-muted animate-pulse">
                  Searching...
                </li>
              )}

              {!loading && results.length > 0 &&
                results.map((item, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelect(item)}
                    className="px-3 py-2 cursor-pointer hover:bg-row-hover text-main"
                  >
                    <div className="font-medium">{item.label}</div>
                    {item.description && item.description !== item.label && (
                      <div className="text-[10px] text-muted">
                        {item.description}
                      </div>
                    )}
                  </li>
                ))}

              {!loading && results.length === 0 && (
                <li className="px-3 py-2 text-muted">No results found</li>
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CustomerGroupSearchSelect;