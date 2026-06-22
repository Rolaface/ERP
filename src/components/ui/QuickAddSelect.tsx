import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Search } from "lucide-react";
import { useQuickAdd, type QuickAddEntityType } from "../../context/QuickAddContext";

export interface QuickAddSelectOption {
  value: string;
  label: string;
}

interface QuickAddSelectProps {
  label: string;
  name: string;
  value?: string;
  onChange: (value: string, option: QuickAddSelectOption) => void;
  options: QuickAddSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  entityType: QuickAddEntityType;
  loading?: boolean;
}

const QuickAddSelect: React.FC<QuickAddSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required,
  disabled,
  entityType,
  loading = false,
}) => {
  const { initiateQuickAdd, pending, completeQuickAdd, cancelQuickAdd } = useQuickAdd();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (pending?.entityType === entityType && !pending.callback) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [pending, entityType]);

  const handleSelect = (option: QuickAddSelectOption) => {
    onChange(option.value, option);
    setIsOpen(false);
    setSearch("");
  };

  const handleAddNew = () => {
    initiateQuickAdd(name, entityType, (entity) => {
      onChange(entity.id, { value: entity.id, label: entity.name });
    });
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex flex-col gap-0.5 text-sm w-full" ref={wrapperRef}>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5 pr-7
            focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
            text-left flex items-center justify-between
            ${disabled ? "opacity-60 cursor-not-allowed bg-app" : "cursor-pointer"}
          `}
        >
          <span className={selectedOption ? "text-main" : "text-muted"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted pointer-events-none"
            viewBox="0 0 10 6"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-theme rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-theme">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-app border border-theme rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-xs text-muted text-center">Loading...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-3 text-xs text-muted text-center">No options found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-row-hover
                      ${option.value === value ? "bg-primary/10 text-primary" : "text-main"}
                    `}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-theme">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearch("");
                  handleAddNew();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
              >
                <Plus size={14} />
                Add {label.replace("*", "").trim()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAddSelect;