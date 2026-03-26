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
}

const DEBOUNCE_DELAY = 400;
const MIN_SEARCH_LENGTH = 2;

const SearchSelect2: React.FC<SearchSelectProps> = React.memo(({
  label,
  value,
  onChange,
  fetchOptions,
  placeholder = "Type to search...",
  disabled,
  error,
  required,
}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  // stable fetch ref
  const fetchOptionsRef = useRef(fetchOptions);
  useEffect(() => {
    fetchOptionsRef.current = fetchOptions;
  }, [fetchOptions]);


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_DELAY);

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

    const run = async () => {
      const data = await fetchOptionsRef.current(debouncedSearch);

      if (id !== requestIdRef.current) return;

      setOptions(data);
    };

    run();
  }, [debouncedSearch, open]);


  useEffect(() => {
    if (open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
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
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    // only sync when dropdown closed (user not typing)
    if (!open && value) {
      setSearch(value);
    }
  }, [value, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [options]);



  return (
    <>
      <div ref={wrapperRef} className="flex flex-col w-full">
        <label className="text-[10px] font-medium mb-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>

        <input
          ref={inputRef}
          placeholder={placeholder}
          value={search}
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (!open) setOpen(true);
          }}
          onFocus={async () => {
            if (!open) {
              setOpen(true);
              const data = await fetchOptionsRef.current("");
              setOptions(data);
            }
          }}
          className={`py-1 px-2 border rounded text-[11px] text-main bg-card transition-all w-auto min-w-0 ${error ? "border-danger" : "border-theme"
            }`}
        />

        {error && (
          <span className="text-danger text-[10px] mt-1">{error}</span>
        )}
      </div>

      {open && options.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            onMouseDown={(e) => e.preventDefault()} // prevent blur
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="bg-white border rounded shadow-lg max-h-48 overflow-auto"
          >
            {options.length > 0 ? (
              options.map((opt) => (
                <div
                  key={opt.value || opt.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt.value, opt);
                    setSearch(opt.label);
                    setOpen(false);
                  }}
                  className="px-3 py-2 cursor-pointer text-[13px] hover:bg-gray-100"
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <>
              </>
              // <div className="px-3 py-2 text-xs text-gray-400">
              //   {debouncedSearch.length < MIN_SEARCH_LENGTH
              //     ? "Type at least 2 characters..."
              //     : "No results"}
              // </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
});

export default SearchSelect2;