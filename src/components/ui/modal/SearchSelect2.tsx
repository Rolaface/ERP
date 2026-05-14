import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Option = {
  label: string;
  value: string;
  swiftCode?: string;
};

interface SearchSelectProps {
  label: string;
  value?: string;
  onChange: (value: string, option: Option) => void;
  fetchOptions: (q: string) => Promise<Option[]>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  allowCustomInput?: boolean;
  loading?: boolean;
  onInputChange?: (input: string) => void;
}

const DEBOUNCE_DELAY = 400;
const MIN_SEARCH_LENGTH = 2;

const SearchSelect2: React.FC<SearchSelectProps> = React.memo(
  ({
    label,
    value,
    onChange,
    onInputChange,
    fetchOptions,
    placeholder = "Type to search...",
    disabled,
    error,
    required,
    allowCustomInput,
    loading,
  }) => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const [open, setOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({
      top: 0,
      left: 0,
      width: 0,
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const fetchOptionsRef = useRef(fetchOptions);
    const userEditingRef = useRef(false);
    const searchRef = useRef(search);
    const prevValueRef = useRef(value);

    useEffect(() => {
      if (value !== prevValueRef.current) {
        prevValueRef.current = value;
        if (!userEditingRef.current) {
          setSearch(value ?? "");
        }
      } else if (!open && value && !userEditingRef.current) {
        setSearch(value);
      }
    }, [value, open]);

    useEffect(() => {
      fetchOptionsRef.current = fetchOptions;
    }, [fetchOptions]);

    useEffect(() => {
      searchRef.current = search;
    }, [search]);

    useEffect(() => {
      const timer = setTimeout(
        () => setDebouncedSearch(search),
        DEBOUNCE_DELAY,
      );
      return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
      if (!open) return;
      if (!debouncedSearch) {
        fetchOptionsRef.current("").then(setOptions);
        return;
      }
      if (debouncedSearch.length < MIN_SEARCH_LENGTH) return;
      const id = ++requestIdRef.current;
      fetchOptionsRef.current(debouncedSearch).then((data) => {
        if (id !== requestIdRef.current) return;
        setOptions(data);
      });
    }, [debouncedSearch, open]);

    useEffect(() => {
      if (open && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
    }, [open]);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          !wrapperRef.current?.contains(target) &&
          !dropdownRef.current?.contains(target)
        ) {
          setOpen(false);
          if (userEditingRef.current && searchRef.current === "") {
            onChange("", { label: "", value: "" });
          }
          userEditingRef.current = false;
        }
      };
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }, [onChange]);

    // Initialize search with value on mount
    useEffect(() => {
      if (value && !search) {
        setSearch(value);
      }
    }, [value]);

    useEffect(() => {
      if (open && inputRef.current) inputRef.current.focus();
    }, [options]);

    return (
      <>
        <div ref={wrapperRef} className="flex flex-col w-full">
          {label && (
            <label className="text-[10px] font-medium mb-1">
              {label}
              {required && <span className="text-danger"> *</span>}
            </label>
          )}
          <div className="relative w-full">
            <input
              ref={inputRef}
              placeholder={placeholder}
              value={search}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                userEditingRef.current = true;

                setSearch(val);
                setIsCustom(true);
                if (onInputChange) {
                  onInputChange(val);
                }
                if (!open) setOpen(true);
              }}
              onBlur={() => {
                if (allowCustomInput && search) {
                  onChange(search, { label: search, value: search });
                }
              }}
              onFocus={async () => {
                if (!open) {
                  setOpen(true);
                  const data = await fetchOptionsRef.current("");
                  setOptions(data);
                }
              }}
              className={`py-1 px-2 pr-6 border rounded text-[11px] text-main bg-card transition-all w-full ${
                error ? "border-danger" : "border-theme"
              }`}
            />

            {/* Clear button — only show when user is actively typing */}
            {isCustom && search && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearch("");
                  setIsCustom(false);
                  userEditingRef.current = false; // ← CHANGED: explicit clear, stop blocking sync
                  onChange("", { label: "", value: "" });
                  setOpen(true);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted hover:text-danger text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {error && (
            <span className="text-danger text-[10px] mt-1">{error}</span>
          )}
        </div>

        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: "fixed",
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 99999,
              }}
              className="bg-white border rounded shadow-lg max-h-52 overflow-auto"
            >
              {options.map((opt) => (
                <div
                  key={opt.value || opt.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt.value, opt);
                    setSearch(opt.label);
                    setIsCustom(false);
                    userEditingRef.current = false; // ← CHANGED: selection done, allow future sync
                    setOpen(false);
                  }}
                  className="px-3 py-2 cursor-pointer text-[13px] hover:bg-gray-100"
                >
                  {opt.label}
                </div>
              ))}
              {options.length === 0 && (
                <div className="px-3 py-2 text-[12px] text-muted">
                  No records found
                </div>
              )}

              {allowCustomInput &&
                search &&
                !options.some(
                  (opt) => opt.label.toLowerCase() === search.toLowerCase(),
                ) && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(search, { label: search, value: search });
                      setIsCustom(true);
                      userEditingRef.current = false; // ← CHANGED
                      setOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer text-[13px] text-primary hover:bg-primary/10 border-t"
                  >
                    Add "{search}"
                  </div>
                )}
            </div>,
            document.body,
          )}
      </>
    );
  },
);

export default SearchSelect2;
