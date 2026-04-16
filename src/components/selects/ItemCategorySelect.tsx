import React, { useEffect, useRef, useState } from "react";
import { getItemGroupTree } from "../../api/itemGroupApi";

interface ItemCategorySelectProps {
  value?: string;
  onChange: (category: { name: string; id: string }) => void;
  className?: string;
  label?: string;
  required?: boolean;
  filterByItemType?: string;
}
function flattenItemGroups(nodes: any[]): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];

  const traverse = (list: any[]) => {
    list.forEach((node) => {
      result.push({
        id: node.name,
        name: node.item_group_name,
      });

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return result;
}
export default function ItemCategorySelect({
  value = "",
  onChange,
  className = "",
  label = "Item Category",
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

      const res = await getItemGroupTree();

      const treeData = res?.message?.data?.item_groups;

      if (!Array.isArray(treeData)) {
        console.warn("Invalid API response");
        setCategories([]);
        return;
      }

      const flatData = flattenItemGroups(treeData);

      setCategories(flatData);
    } catch (err) {
      console.error("Failed to load item groups:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);
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
      <span className="flex items-center gap-0.5 font-medium text-muted text-sm">
        <span>{label}</span>
        {required && <span className="text-danger">*</span>}
      </span>


      <div ref={ref} className="relative w-full">
        {/* Search Input */}
        <input
          className="form-input w-full
           focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder={loading ? "Loading..." : "Search category..."}
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
