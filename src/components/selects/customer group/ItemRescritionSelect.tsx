import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { getAllItems } from "../../../api/itemApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RestrictedItem = {
  id: string;
  itemName: string;
};

interface ItemRestrictionSelectProps {
  selectedIds: string[];
  onSelect: (item: RestrictedItem) => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DROPDOWN_MAX_HEIGHT = 224;
const DROPDOWN_OFFSET = 4;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemRestrictionSelect({
  selectedIds,
  onSelect,
  className = "",
}: ItemRestrictionSelectProps) {
  const [items, setItems] = useState<RestrictedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Load all items once ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAllItems(1, 1000);
        if (!cancelled) {
          const rawList: any[] = Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
            ? res.data
            : [];
          setItems(rawList.map((x) => ({ id: x.id, itemName: x.itemName })));
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Keep rect in sync while dropdown is open ─────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // ── Outside-click: close dropdown ────────────────────────────────────────────

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

  // ── Open dropdown ────────────────────────────────────────────────────────────

  const openDropdown = useCallback(() => {
    if (!inputRef.current) return;
    setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  }, []);

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filtered = items.filter(
    (item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase()) &&
      !selectedIds.includes(item.id)
  );

  // ── Select handler ───────────────────────────────────────────────────────────
  // Flow: item select → dropdown band → search clear → input focus wapas
  // Dobara input pe click/focus → onFocus → dropdown khulega

  const handleSelect = (item: RestrictedItem) => {
    // 1. Close dropdown immediately
    setOpen(false);
    // 2. Clear search
    setSearch("");
    // 3. Notify parent
    onSelect(item);
    // 4. Return focus to input so user can click/type again straight away
    //    (blur never fires because onMouseDown used preventDefault)
    requestAnimationFrame(() => {
      inputRef.current?.blur(); // explicitly blur so next focus fires correctly
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        className="w-full py-1.5 px-3 border border-theme rounded text-[12px] bg-card text-main
          focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted"
        placeholder={loading ? "Loading items..." : "Search and add item..."}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          openDropdown();
        }}
        onFocus={openDropdown}
        autoComplete="off"
        disabled={loading}
      />

      {open &&
        rect &&
        !loading &&
        createPortal(
          (() => {
            const dropdownWidth = Math.max(rect.width, 280);
            const maxLeft = Math.max(8, window.innerWidth - dropdownWidth - 8);
            const left = Math.min(rect.left, maxLeft);

            const spaceBelow = window.innerHeight - rect.bottom;
            const top =
              spaceBelow < DROPDOWN_MAX_HEIGHT
                ? rect.top - DROPDOWN_MAX_HEIGHT - DROPDOWN_OFFSET
                : rect.bottom + DROPDOWN_OFFSET;

            return (
              <div
                ref={dropdownRef}
                style={{ position: "fixed", top, left, width: dropdownWidth, zIndex: 9999 }}
                className="bg-card border border-theme rounded shadow-lg"
              >
                <ul className="max-h-56 overflow-y-auto text-sm">
                  {filtered.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-2 cursor-pointer hover:bg-row-hover text-main"
                      onMouseDown={(e) => {
                        // preventDefault: input focus nahi jaati, blur fire nahi hota
                        e.preventDefault();
                        handleSelect(item);
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold leading-snug whitespace-normal break-words text-[12px]">
                          {item.itemName}
                        </span>
                        <span className="text-xs text-muted leading-snug">
                          ID: {item.id}
                        </span>
                      </div>
                    </li>
                  ))}

                  {filtered.length === 0 && (
                    <li className="px-4 py-3 text-center text-muted text-sm">
                      {items.length === 0
                        ? "No items available"
                        : selectedIds.length >= items.length
                        ? "All items have been added"
                        : "No matching items"}
                    </li>
                  )}
                </ul>
              </div>
            );
          })(),
          document.body
        )}
    </div>
  );
}