import { useEffect, useRef, useState } from "react";
import { getAllItemGroups } from "../../api/itemCategoryApi";

interface ItemCategorySelectProps {
  value?: string;
  onChange: (category: { name: string; id: string }) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  filterByItemType?: string;
}

export default function ItemCategorySelect({
  value = "",
  onChange,
  className = "",
  label = "Item Category",
  placeholder = "Search category...",
  required = false,
  filterByItemType,
}: ItemCategorySelectProps) {
  const [categories, setCategories] = useState<{ name: string; id: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const ref = useRef<HTMLDivElement>(null);

  /* ---------------- Load Item Categories ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAllItemGroups(
          1,
          130,
          filterByItemType ? { itemType: filterByItemType } : undefined,
        );

        if (!res || res?.status_code !== 200 || !Array.isArray(res.data)) {
          console.warn("Invalid API response, setting empty categories");
          setCategories([]);
          return;
        }

        const safeCategories = res.data
          .filter((c: any) => c && c.id && typeof c.groupName === "string")
          .map((c: any) => ({
            id: String(c.id),
            name: c.groupName.trim() || `(Unnamed ${c.id})`,
          }));

        setCategories(safeCategories);
      } catch (err) {
        console.error("Failed to load item groups:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filterByItemType]);
  /* -------- Close dropdown when clicking outside -------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- Safe Filter logic ---------------- */
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes((search || "").toLowerCase()),
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="font-medium text-muted text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>

      <div ref={ref} className="relative w-full">
        {/* Search Input */}
        <input
          className="w-full rounded border border-theme bg-card text-main px-3 py-2 text-sm 
           focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder={loading ? "Loading..." : placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={loading}
        />

        {/* Dropdown */}
        {open && !loading && (
          <div className="absolute left-0 top-full mt-1 w-full bg-card border border-theme shadow-lg rounded z-30">
            <ul className="max-h-56 overflow-y-auto text-sm">
              {filtered.length > 0 ? (
                filtered.map((category) => (
                  <li
                    key={category.id}
                    className="px-4 py-2 cursor-pointer hover:bg-row-hover text-main"
                    onClick={() => {
                      setSearch(category.name);
                      setOpen(false);
                      onChange(category);
                    }}
                  >
                    {category.name}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-muted">
                  {search ? "No match found" : "No categories available"}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
