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

const SearchSelect: React.FC<SearchSelectProps> = ({
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
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /*  Fetch Options  */

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    if (justSelected) {
      setJustSelected(false);
      return;
    }

    if (!isTyping) return;

    if (!search) {
      return;
    }

    const delay = setTimeout(async () => {
      const data = await fetchOptions(search);
      setOptions(data);
      setOpen(true);
    }, 400);

    return () => clearTimeout(delay);
  }, [search, fetchOptions, justSelected, isTyping]);

  /*  Position Calculation  */
  useEffect(() => {
    if (open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();

      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open, options]);

  /*  Outside Click  */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      {/* Input Wrapper */}
      <div ref={wrapperRef} className="flex flex-col text- w-full">
        <label className="text-[10px] font-medium mb-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>

        <input
          value={search}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setIsTyping(true);
            setSearch(e.target.value);
            setOpen(true);
            onChange("", { label: "", value: "" });
          }}
          onFocus={async () => {
            setOpen(true);

            // fetch all options on focus
            const data = await fetchOptions("");
            setOptions(data);
          }}
          className={`py-1 px-2 border rounded text-[11px] text-main bg-card transition-all w-auto min-w-0, ${error ? "border-danger" : "border-theme"
            }`}
        />
        {error && <span className="text-danger text-[10px] mt-1">{error}</span>}
      </div>

      {/* Portal Dropdown */}
      {open &&
        options.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="  bg-white border rounded shadow-lg max-h-48 overflow-auto  "
          >
            {options.map((opt) => (
              <div
                key={opt.value || opt.label}
                onClick={() => {
                  setIsTyping(false);
                  setJustSelected(true);
                  onChange(opt.value, opt);
                  setSearch(opt.label);
                  setOpen(false);
                }}
                className="px-3 py-2 cursor-pointer text-[13px] hover:bg-gray-100"
              >
                {opt.label}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

export default SearchSelect;
