import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { User } from "lucide-react";
import { getAllCustomers } from "../../api/customerApi";
import SelectShell from "../../components/ui/select/SelectShell";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  name: string;
  customerCode?: string;
  currency?: string;
  type?: string;
  status?: string;
  taxCategory?: string;
};

export interface CustomerSelectValue {
  id: string;
  name: string;
  customerCode?: string;
  currency?: string;
  type?: string;
  status?: string;
  taxCategory?: string;
}

interface CustomerSelectProps {
  value?: string;
  selectedId?: string;
  onChange: (customer: CustomerSelectValue) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
  placeholder?: string;
  taxCategory?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const mapCustomer = (c: any): Customer => ({
  id: c.id,
  name: c.name,
  customerCode: c.code ?? c.customerCode,
  currency: c.currency,
  type: c.type,
  status: c.status,
  taxCategory: c.customerTaxCategory,
});

function getDropStyle(
  rect: DOMRect,
  vw: number,
  vh: number,
): React.CSSProperties {
  const PADDING = 8;
  const DROP_H = 230;
  const width = rect.width;

  let left = rect.left;
  if (left + width > vw - PADDING)
    left = Math.max(PADDING, vw - width - PADDING);

  const spaceBelow = vh - rect.bottom - PADDING;
  const spaceAbove = rect.top - PADDING;
  const flipUp = spaceBelow < DROP_H && spaceAbove > spaceBelow;

  const vertPos = flipUp
    ? { bottom: vh - rect.top + 4, top: "auto" as const }
    : { top: rect.bottom + 4, bottom: "auto" as const };

  return { position: "fixed", ...vertPos, left, width, zIndex: 9999 };
}

// getAllCustomers() returns resp.data directly — backend body shape is
// { status_code, message, data: Customer[] } based on the `res.status_code`
// / `res.data` check already used below, so no extra unwrap needed here.
function extractCustomerList(res: any): any[] {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CustomerSelect({
  value = "",
  selectedId,
  onChange,
  onClear,
  className = "",
  label = "Customer",
  placeholder = "Select",
  taxCategory,
  required = false,
  disabled = false,
  error,
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // guards against a slow, stale request overwriting a newer one
  const requestIdRef = useRef(0);

  // ── Sync display value ────────────────────────────────────────────────────
  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (value) {
      setSearch(value);
      return;
    }
    if (selectedId && customers.length > 0) {
      const found = customers.find((c) => c.id === selectedId);
      if (found) setSearch(found.name);
    }
  }, [value, selectedId, customers]);

  // ── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        dropdownRef.current?.contains(t) ||
        containerRef.current?.contains(t)
      )
        return;
      setOpen(false);
      if (!customers.find((c) => c.name === search)) setSearch(value);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, search, customers, value]);

  // ── Reposition on scroll / resize ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const update = () =>
      setDropRect(containerRef.current?.getBoundingClientRect() ?? null);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // ── Server-side search (backend supports page, page_size, taxCategory, search, status) ──
  const fetchCustomers = useCallback(
    async (searchTerm: string) => {
      const requestId = ++requestIdRef.current;
      try {
        setLoading(true);
        const res = await getAllCustomers(
          1,
          PAGE_SIZE,
          taxCategory,
          searchTerm,
          "active",
        );
        if (requestId !== requestIdRef.current) return; // stale response, ignore
        if (res?.status_code !== 200) {
          setCustomers([]);
          return;
        }
        const raw = extractCustomerList(res);
        setCustomers(raw.map(mapCustomer));
      } catch (err) {
        console.error("CustomerSelect: failed to load customers", err);
        if (requestId === requestIdRef.current) setCustomers([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [taxCategory],
  );

  // Debounced trigger whenever the search text changes while the dropdown is open
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, fetchCustomers]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setDropRect(containerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    inputRef.current?.select();
    fetchCustomers(search);
  }, [disabled, fetchCustomers, search]);

  // ── Reset highlight whenever the list changes ──────────────────────────────
  useEffect(() => {
    setHighlightedIndex(customers.length > 0 ? 0 : -1);
  }, [customers]);

  // ── Keep highlighted option in view ────────────────────────────────────────
  useEffect(() => {
    if (highlightedIndex < 0) return;
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // ── Select ────────────────────────────────────────────────────────────────
  const handleSelect = (c: Customer) => {
    setSearch(c.name);
    setOpen(false);
    setHighlightedIndex(-1);
    onChange({
      id: c.id,
      name: c.name,
      customerCode: c.customerCode,
      currency: c.currency,
      type: c.type,
      status: c.status,
      taxCategory: c.taxCategory,
    });
  };

  // ── Keyboard navigation inside the dropdown ─────────────────────────────────
  // While the dropdown is open, arrow keys move the highlight instead of
  // bubbling up to any outer grid/spreadsheet navigation handler.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      // Let ArrowDown open the dropdown, like a native select.
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          customers.length === 0 ? -1 : (prev + 1) % customers.length,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          customers.length === 0
            ? -1
            : (prev - 1 + customers.length) % customers.length,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && customers[highlightedIndex]) {
          handleSelect(customers[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
        if (!customers.find((c) => c.name === search)) setSearch(value);
        break;
      case "Tab":
        // Let Tab move focus naturally; just close the dropdown.
        setOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // ── Dropdown style ────────────────────────────────────────────────────────
  const dropStyle = useMemo((): React.CSSProperties => {
    if (!dropRect) return {};
    return getDropStyle(dropRect, window.innerWidth, window.innerHeight);
  }, [dropRect]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full min-w-0 flex flex-col ${className}`}>
      {label && (
        <span className="block text-[10px] font-medium text-main mb-1">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
      )}

      <div
        ref={containerRef}
        className="relative w-full"
        data-nav-ignore={open ? "true" : undefined}
      >
        <SelectShell
          icon={!search ? <User /> : undefined}
          error={Boolean(error)}
          disabled={disabled}
        >
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            disabled={disabled}
            placeholder={loading ? "Loading..." : placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!open) {
                setDropRect(
                  containerRef.current?.getBoundingClientRect() ?? null,
                );
                setOpen(true);
              }
            }}
            onFocus={handleOpen}
            onKeyDown={handleKeyDown}
            className="overflow-hidden text-ellipsis whitespace-nowrap"
          />
        </SelectShell>

        {error && (
          <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
        )}
      </div>

      {open &&
        dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropStyle}
            className="bg-card border border-theme rounded-lg shadow-xl overflow-hidden"
            data-nav-ignore="true"
          >
            <ul className="max-h-56 overflow-y-auto text-[11px]">
              {loading ? (
                <li className="px-3 py-2 text-muted text-[11px]">
                  Loading…
                </li>
              ) : customers.length === 0 ? (
                <li className="px-3 py-2 text-muted text-[11px]">
                  {search ? `No match for "${search}"` : "No customers found"}
                </li>
              ) : (
                customers.map((c, idx) => (
                  <li
                    key={c.id}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(c);
                    }}
                    onClick={() => {}}
                    className={[
                      "px-3 py-1.5 cursor-pointer border-b border-theme last:border-none transition-colors",
                      idx === highlightedIndex
                        ? "bg-primary/10 text-primary font-semibold"
                        : c.id === selectedId
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-primary/5 text-main",
                    ].join(" ")}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate">{c.name}</span>
                      {c.currency && (
                        <span className="text-[10px] text-muted shrink-0">
                          {c.currency}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}