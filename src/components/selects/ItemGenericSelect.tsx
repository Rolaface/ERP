import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
const inputRef = useRef<HTMLInputElement>(null);
const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

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
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        !(e.target as Element).closest?.("[data-uom-dropdown]")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFocus = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
    setOpen(true);
  };

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
  return (
    item.code ??
    item.itemClsCd ??
    item.name ??     
    String(item)
  );
};

  const getCodeForDisplay = (item: any): string => {
    return item.code ?? item.itemClsCd ?? "";
  };

 const getNameForDisplay = (item: any): string => {
  return (
    item.country_name ??  
    item.name ??
    item.code_name ??
    item.itemClsNm ??
    ""
  );
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

const rootClassName = "flex flex-col gap-0.5 w-full";

const labelClassName =
  "text-[11px] font-medium uppercase tracking-wide text-muted";

const inputClassName = `
  h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5
  focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
`;

  return (
    <div className={`${rootClassName} ${className}`}>
    <span className={labelClassName}>
  {label}
  {required && <span className="text-danger">*</span>}
</span>


      <div ref={ref} className="relative w-full">
          <input
  ref={inputRef}
  className={inputClassName}
  placeholder={loading ? "Loading..." : placeholder}
  value={open ? search : displayValue}
  onChange={(e) => {
    setSearch(e.target.value);
    setOpen(true);
  }}
  onFocus={(e) => {
    e.currentTarget.style.boxShadow =
      "0 0 0 3px rgba(37, 99, 235, 0.16)";
    handleFocus();
  }}
  onBlur={(e) => {
    e.currentTarget.style.boxShadow = "";
  }}
  disabled={loading}
/>

        {open && !loading && createPortal(
          <div
            data-uom-dropdown="true"
            style={dropdownStyle}
            className="bg-card border border-theme shadow-lg rounded max-h-60 overflow-y-auto"
          >
            <ul className="text-sm">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <li
                    key={getId(item)}
                    className={`px-4 py-2 cursor-pointer hover:bg-row-hover ${getId(item) === value ? "bg-primary/10 text-primary font-medium" : "text-main"}`}
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
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
