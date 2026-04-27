import React, { useEffect, useRef, useState, useCallback } from "react";
import { getAllItems, getItemByItemCode } from "../../../api/itemApi";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Item = {
  id: string;
  itemName: string;
  unitOfMeasureCd: string;
  description: string;
  buyingPrice: number;
};

interface RfqItemSelectProps {
  value?: string;        // display name shown in input
  selectedId?: string;   // item code (id)
  onChange: (item: any) => void; // full item object from getById
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const mapItem = (i: any): Item => ({
  id: i.id,
  itemName: i.itemName,
  unitOfMeasureCd: i.unitOfMeasureCd,
  description: i.description ?? "",
  buyingPrice: i.buyingPrice ?? 0,
});

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const RfqItemSelect: React.FC<RfqItemSelectProps> = ({
  value = "",
  selectedId,
  onChange,
  label,
  placeholder = "Search item...",
  required = false,
  disabled = false,
  error,
  className = "",
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync display value from parent (e.g. reset) ───────────────────────────
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // ── Resolve name from selectedId after list loads ─────────────────────────
  useEffect(() => {
    if (value) {
      setSearch(value);
      return;
    }
    if (selectedId && items.length > 0) {
      const found = items.find((i) => i.id === selectedId);
      if (found) setSearch(found.itemName);
    }
  }, [value, selectedId, items]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        if (!items.find((i) => i.itemName === search)) {
          setSearch(value);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [search, items, value]);

  // ── Load items ────────────────────────────────────────────────────────────
  const loadItems = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm && fetched) return;
      setLoading(true);
      try {
        const res = await getAllItems(1, 20, {
          search: searchTerm || undefined,
        });
        const raw: any[] = res?.data?.data ?? res?.data ?? [];
        setItems(Array.isArray(raw) ? raw.map(mapItem) : []);
        if (!searchTerm) setFetched(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [fetched],
  );

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    inputRef.current?.select();
    loadItems("");
  }, [disabled, loadItems]);

  // ── Debounced search as user types ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadItems(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Client-side filter on cached results ──────────────────────────────────
  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.itemName.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
  });

  // ── Select: call getById for full data ────────────────────────────────────
  const handleSelect = async (item: Item) => {
    setSearch(item.itemName);
    setOpen(false);
    try {
      const res = await getItemByItemCode(item.id);
      const detail = res?.data ?? res;
      onChange(detail);
    } catch {
      onChange(item);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
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
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={loading ? "Loading..." : placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={handleOpen}
          className={[
            "py-1 px-2 border rounded text-[11px] text-main bg-card w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
            disabled
              ? "opacity-50 cursor-not-allowed border-[var(--border)]"
              : error
              ? "border-red-400/60"
              : "border-[var(--border)] hover:border-primary/40",
          ].join(" ")}
        />

        {error && (
          <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
        )}

        {open && !loading && (
          <div className="absolute left-0 top-full mt-1 w-full min-w-[220px] bg-card border border-[var(--border)] shadow rounded z-30">
            <ul className="max-h-56 overflow-y-auto text-[13px]">
              {filtered.length === 0 ? (
                <li className="px-2 py-1 text-muted text-[11px]">
                  {search ? `No match for "${search}"` : "No items found"}
                </li>
              ) : (
                filtered.map((i) => (
                  <li
                    key={i.id}
                    className={[
                      "px-2 py-1 cursor-pointer text-[11px]",
                      i.id === selectedId
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-primary/5 text-main",
                    ].join(" ")}
                    onClick={() => handleSelect(i)}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate">{i.itemName}</span>
                      <span className="text-[10px] text-muted shrink-0">
                        {i.unitOfMeasureCd}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqItemSelect;