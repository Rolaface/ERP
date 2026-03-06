import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAllItems } from "../../api/itemApi";

interface ItemSelectProps {
  taxCategory?: string | undefined;
  value?: string;
  excludeItemCodes?: string[];
  onChange: (item: {
    id: string;
    itemCode: string;
    itemName: string;
    sellingPrice?: number;
  }) => void;
  onAddNew?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ItemSelect({
  taxCategory = "",
  value = "",
  excludeItemCodes = [],
  onChange,
  onAddNew,
  className = "",
  disabled = false,
}: ItemSelectProps) {
  const [items, setItems] = useState<
    Array<{
      id: string;
      itemCode: string;
      itemName: string;
      sellingPrice?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const res = await getAllItems(
          1,
          1000,
          taxCategory ? { taxCategory } : undefined,
        );

        if (!cancelled && res?.status_code === 200) {
          setItems(
            res.data.map((it: any) => ({
              id: it.id,
              itemCode: it.id,
              itemName: it.itemName,
              sellingPrice: it.sellingPrice ?? 0,
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load items", err);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [taxCategory]);

  useEffect(() => {
    if (!value) {
      setSearch("");
    }
    setOpen(false);
  }, [taxCategory, value]);

  useEffect(() => {
    if (!value) {
      setSearch("");
      return;
    }

    const match = items.find((it) => it.itemCode === value);
    if (match) setSearch(match.itemName);
  }, [value, items]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exclude = new Set(
    (excludeItemCodes ?? []).map((c) => String(c ?? "").trim()).filter(Boolean),
  );

  const filtered = items
    .filter((it) => !exclude.has(String(it.itemCode ?? "").trim()))
    .filter((it) => it.itemName.toLowerCase().includes(search.toLowerCase()));

  const openDropdown = () => {
    if (!inputRef.current || disabled) return;

    setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        className="w-full rounded border border-theme bg-card text-main px-3 py-1.5 text-sm 
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        placeholder={loading ? "Loading items..." : "Search item"}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          openDropdown();
        }}
        onFocus={openDropdown}
        disabled={disabled}
      />

      {open &&
        rect &&
        !loading &&
        createPortal(
          (() => {
            const dropdownWidth = Math.max(rect.width, 360);
            const maxLeft = Math.max(8, window.innerWidth - dropdownWidth - 8);
            const left = Math.min(rect.left, maxLeft);

            return (
              <div
                ref={dropdownRef}
                style={{
                  position: "fixed",
                  top: rect.bottom,
                  left,
                  width: dropdownWidth,
                  zIndex: 9999,
                }}
                className="bg-card border border-theme rounded shadow-lg"
              >
                <ul className="max-h-56 overflow-y-auto text-sm">
                  {filtered.map((it) => (
                    <li
                      key={it.id}
                      className="px-4 py-2 cursor-pointer hover:bg-row-hover text-main"
                      onClick={() => {
                        setSearch(it.itemName);
                        setOpen(false);
                        onChange({
                          id: it.id,
                          itemCode: it.itemCode,
                          itemName: it.itemName,
                          sellingPrice: it.sellingPrice,
                        });
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold leading-snug whitespace-normal break-words">
                          {it.itemName}
                        </span>
                        <span className="text-xs text-muted leading-snug whitespace-normal break-words">
                          Code: {it.itemCode}
                        </span>
                      </div>
                    </li>
                  ))}
                  {filtered.length === 0 && (
                    <li className="px-4 py-3 text-center">
                      <p className="text-muted mb-3">No items found</p>
                      {onAddNew && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            onAddNew();
                          }}
                          className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-primary/90"
                        >
                          + Add New Item
                        </button>
                      )}
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
