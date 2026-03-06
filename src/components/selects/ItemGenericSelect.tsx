import { useEffect, useRef, useState } from "react";
import type { AxiosResponse } from "axios";

interface Props {
  value?: string;
  onChange: (item: { name: string; id: string }) => void;
  fetchData: () => Promise<AxiosResponse<any>>;
  label: string;
  placeholder?: string;
  className?: string;
  displayField?: "code" | "name";
  displayFormatter?: (option: any) => string;
  variant?: "default" | "modal";
  required?: boolean;
}

export default function ItemGenericSelect({
  value = "",
  onChange,
  fetchData,
  label,
  placeholder = "Search...",
  className = "",
  displayField,
  displayFormatter,
  variant = "default",
  required = false,
}: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchData();

        let data = res?.data?.data ?? res?.data ?? res;
        if (!Array.isArray(data)) data = [];
        setItems(data);
      } catch (err) {
        console.error("Load error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // const getId = (item: any): string => {
  //   return item.code ?? item.itemClsCd ?? String(item);
  // };

  // const getDisplayName = (item: any): string => {
  //   if (displayFormatter) {
  //     return displayFormatter(item);
  //   }
  //   if (displayField === "code") {
  //     return getId(item);
  //   }

  //   if (item.code_name) return item.code_name;
  //   if (item.name) return item.name;
  //   if (item.itemClsNm) return item.itemClsNm;
  //   return getId(item);
  // };
  const getId = (item: any): string => {
    return item.code ?? item.itemClsCd ?? String(item);
  };

  const getCodeForDisplay = (item: any): string => {
    return item.code ?? item.itemClsCd ?? "";
  };

  const getNameForDisplay = (item: any): string => {
    return item.name ?? item.code_name ?? item.itemClsNm ?? "";
  };

  const getDisplayName = (item: any): string => {
    if (displayFormatter) {
      return displayFormatter(item);
    }

    if (displayField === "code") {
      return getCodeForDisplay(item) || getId(item);
    }

    if (displayField === "name") {
      return getNameForDisplay(item) || String(item);
    }

    // Default format: "CODE - NAME"
    const code = getCodeForDisplay(item);
    const name = getNameForDisplay(item);

    if (code && name) {
      return `${code} - ${name}`;
    }
    if (name) return name;
    if (code) return code;
    return String(item);
  };

  const selectedItem = items.find((item) => getId(item) === value);
  const displayValue = selectedItem ? getDisplayName(selectedItem) : "";

  // Filter with search
  const filtered = items.filter((item) => {
    const name = getDisplayName(item).toLowerCase();
    const code = getId(item).toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  const rootClassName =
    variant === "modal"
      ? "flex flex-col text-sm w-full group"
      : "flex flex-col gap-1";

  const labelClassName =
    variant === "modal"
      ? "block text-[10px] font-medium text-main mb-1"
      : "font-medium text-muted text-sm";

  const inputClassName =
    variant === "modal"
      ? "w-full py-2 px-3 border rounded text-[13px] text-main bg-card transition-all border-[var(--border)] hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
      : "w-full rounded border border-theme bg-card text-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

  return (
    <div className={`${rootClassName} ${className}`}>
      <span className={labelClassName}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>

      <div ref={ref} className="relative w-full">
        <input
          className={inputClassName}
          placeholder={loading ? "Loading..." : placeholder}
          value={open ? search : displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={loading}
        />

        {open && !loading && (
          <div className="absolute left-0 top-full mt-1 w-full bg-card border border-theme shadow-lg rounded z-30 max-h-60 overflow-y-auto">
            <ul className="text-sm">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <li
                    className={`px-4 py-2 cursor-pointer hover:bg-row-hover ${
                      getId(item) === value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-main"
                    }`}
                    onClick={() => {
                      setSearch("");
                      setOpen(false);
                      onChange({ name: getDisplayName(item), id: getId(item) });
                    }}
                  >
                    {getDisplayName(item)}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-muted">
                  {search ? "No match found" : "No items available"}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
