import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { getAllItems } from "../../../api/itemApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = {
  id: string;
  itemName: string;
  unitOfMeasureCd?: string;
  sellingPrice?: number;
  taxPerct?: number;
  vatRate?: number;
  vatCd?: string;
  taxCode?: string;
};

interface POItemSelectProps {
  value?: string;
  selectedId?: string;
  taxCategory?: string;
  className?: string;
  onChange: (item: Item) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DROPDOWN_MAX_HEIGHT = 224; // max-h-56
const DROPDOWN_OFFSET = 4;

// ─── Component ────────────────────────────────────────────────────────────────

export default function POItemSelect({
  value = "",
  selectedId,
  taxCategory,
  onChange,
  className = "",
}: POItemSelectProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Load items ───────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getAllItems(1, 1000, taxCategory ?? undefined);
        if (!cancelled) {
          const rawList = Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
          setItems(rawList);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [taxCategory]);

  // ── Sync selected item name ──────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedId || items.length === 0) return;
    const match = items.find((x) => x.id === selectedId);
    if (match) setSearch(match.itemName);
  }, [selectedId, items]);

  // ── Reset on taxCategory / value clear ──────────────────────────────────────

  useEffect(() => {
    if (!value) setSearch("");
    setOpen(false);
  }, [taxCategory, value]);

  // ── Outside click handler ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Open dropdown & capture position ────────────────────────────────────────

  const openDropdown = useCallback(() => {
    if (!inputRef.current) return;
    setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  }, []);

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filtered = items.filter((item) =>
    item.itemName.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Select handler ───────────────────────────────────────────────────────────

  const handleSelect = (item: Item) => {
    setSearch(item.itemName);
    setOpen(false);
    onChange(item);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        className="w-full py-1 px-2 border border-theme rounded text-[11px] bg-card text-main
            focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder={loading ? "Loading items..." : "Search item..."}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          openDropdown();
        }}
        onFocus={openDropdown}
        autoComplete="off"
      />

      {open && rect && !loading &&
        createPortal(
          (() => {
            // Smart horizontal positioning — don't overflow viewport
            const dropdownWidth = Math.max(rect.width, 260);
            const maxLeft = Math.max(8, window.innerWidth - dropdownWidth - 8);
            const left = Math.min(rect.left, maxLeft);

            // Smart vertical positioning — show above if not enough space below
            const spaceBelow = window.innerHeight - rect.bottom;
            const top =
              spaceBelow < DROPDOWN_MAX_HEIGHT
                ? rect.top - DROPDOWN_MAX_HEIGHT - DROPDOWN_OFFSET
                : rect.bottom + DROPDOWN_OFFSET;

            return (
              <div
                ref={dropdownRef}
                style={{
                  position: "fixed",
                  top,
                  left,
                  width: dropdownWidth,
                  zIndex: 9999,
                }}
                className="bg-card border border-theme rounded shadow-lg"
              >
                <ul className="max-h-56 overflow-y-auto text-sm">
                  {filtered.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-2 cursor-pointer hover:bg-row-hover text-main"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold leading-snug whitespace-normal break-words">
                          {item.itemName}
                        </span>
                        <span className="text-xs text-muted leading-snug whitespace-normal break-words">
                          Code: {item.id}
                        </span>
                      </div>
                    </li>
                  ))}

                  {filtered.length === 0 && (
                    <li className="px-4 py-3 text-center text-muted text-sm">
                      No items found
                    </li>
                  )}
                </ul>
              </div>
            );
          })(),
          document.body,
        )}
    </div>
  );
}