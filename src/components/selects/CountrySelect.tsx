import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getCountryList } from "../../api/lookupApi";

interface CountrySelectProps {
  value?: string;
  onChange: (country: { code: string; name: string }) => void;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function CountrySelect({
  value = "",
  onChange,
  className = "",
  label = "Export To Country",
  required = false,
}: CountrySelectProps) {
  const [countries, setCountries] = useState<
    { sortOrder: number; code: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getCountryList();
      setCountries(
        (res ?? []).map((c: any) => ({
          sortOrder: c.sort_order,
          code: c.code,
          name: c.name,
        })),
      );
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!value) {
      setSearch("");
      return;
    }
    const match = countries.find((c) => c.code === value);
    if (match) setSearch(match.name);
  }, [value, countries]);

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

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openDropdown = () => {
    if (!inputRef.current) return;
    setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <span className="font-medium text-muted text-sm">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>

      <input
        ref={inputRef}
        className="w-full rounded border border-theme bg-card text-main px-3 py-2 text-sm 
  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        placeholder={loading ? "Loading..." : "Search country..."}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          openDropdown();
        }}
        onFocus={openDropdown}
      />

      {open &&
        rect &&
        !loading &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              zIndex: 9999,
            }}
            className="bg-card border border-theme rounded shadow-lg"
          >
            <ul className="max-h-56 overflow-y-auto text-sm">
              {filtered.map((c) => (
                <li
                  key={c.sortOrder}
                  className="px-4 py-2 cursor-pointer hover:bg-row-hover text-main"
                  onClick={() => {
                    setSearch(c.name);
                    setOpen(false);
                    onChange({ code: c.code, name: c.name });
                  }}
                >
                  <div className="flex justify-between">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted">{c.code}</span>
                  </div>
                </li>
              ))}

              {filtered.length === 0 && (
                <li className="px-4 py-2 text-muted">No match found</li>
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
