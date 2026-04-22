import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Column } from "./type";
import { useLayoutEffect } from "react";

interface ColumnSelectorProps {
  columns: Column<any>[];
  visibleKeys: string[];
  onApply: (keys: string[]) => void;
  allKeys: string[];
  className?: string;
  buttonLabel?: string;
}


interface DropdownContentProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  columns: Column<any>[];
  visibleKeys: string[];
  allKeys: string[];
  onApply: (keys: string[]) => void;
}

function DropdownContent({
  isOpen,
  onClose,
  anchorRef,
  columns,
  visibleKeys,
  allKeys,
  onApply,
}: DropdownContentProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [draftKeys, setDraftKeys] = useState<string[]>(visibleKeys);

  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftKeys(visibleKeys);
      setMenuSearch("");
    }
  }, [isOpen]); 

  const toggleDraft = (key: string) => {
    setDraftKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const dropdownWidth = 288;

    let left = rect.right + window.scrollX - dropdownWidth;
    if (left < 8) left = 8;

    const top = rect.bottom + window.scrollY + 8;

    setPosition({ top, left });
  }, [isOpen]);

  const handleDone = () => {
    onApply(draftKeys); 
    onClose();
    setMenuSearch("");
  };

  const handleCancel = () => {
    onClose();         
    setMenuSearch("");
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
        setMenuSearch("");
      }
    };


    // Handle escape key to close dropdown
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        setMenuSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setMenuSearch("");
    }
  }, [isOpen]);

  // Filter columns based on search input
  const filteredColumns = columns.filter((col) =>
    col.header.toLowerCase().includes(menuSearch.trim().toLowerCase()),
  );

  if (!isOpen || !position) return null;

  // Render dropdown via portal to avoid overflow clipping
  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed w-72 bg-card border border-[var(--border)] rounded-lg shadow-2xl z-[9999] overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
      role="dialog"
      aria-label="Column selector"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">
          Columns ({draftKeys.length}/{columns.length})
        </div>
        <button
          onClick={() => {
            onClose();
            setMenuSearch("");
          }}
          className="p-1 rounded hover:bg-card/20 text-white transition-colors"
          type="button"
          aria-label="Close column selector"
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-card border-b border-[var(--border)]">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search columns..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card text-main placeholder:text-muted transition-none
"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-[var(--border)]">
        <button
          onClick={() => setDraftKeys(allKeys)}
          className="text-xs font-medium bg-primary text-white px-2 py-1 rounded hover:opacity-90 transition-opacity"
          type="button"
        >
          ✓ Show all
        </button>
        <button
          onClick={() => setDraftKeys([])}
          className="text-xs font-medium text-[var(--danger)] hover:text-[var(--danger-700)] px-2 py-1 rounded transition-colors"
          type="button"
        >
          ✕ Hide all
        </button>
      </div>

      {/* Column List */}
      <div className="max-h-64 overflow-y-auto bg-card custom-scrollbar">
        {filteredColumns.length > 0 ? (
          <div className="p-2">
            {filteredColumns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-row-hover cursor-pointer select-none transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={draftKeys.includes(col.key)}   
                  onChange={() => toggleDraft(col.key)}    
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 border border-[var(--border)] rounded bg-card accent-[var(--primary)] cursor-pointer"
                />

                <div className="flex-1 text-sm text-main font-medium">
                  {col.header}
                </div>
                {draftKeys.includes(col.key) && (
                  <svg
                    className="w-4 h-4 text-[var(--success)]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted">
            No columns found matching "{menuSearch}"
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-3 py-3 bg-card border-t border-[var(--border)] flex items-center justify-end gap-2">
        <button
          onClick={handleCancel}
          className="text-sm px-4 py-1.5 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover transition-colors"
          type="button"
        >
          Cancel
        </button>
        <button
          onClick={handleDone}
          className="text-sm px-4 py-1.5 rounded-md bg-primary text-white hover:opacity-90 transition-opacity"
          type="button"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}


export default function ColumnSelector({
  columns,
  visibleKeys,
  onApply,
  allKeys,
  className,
  buttonLabel,
}: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`px-3 py-2 rounded-xl text-sm border transaction-none flex items-center gap-2 ${open
          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
          : "bg-card text-muted border-[var(--border)] hover:text-primary hover:border-primary"
          }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Select visible columns"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest">
          {buttonLabel ?? `Columns (${visibleKeys.length})`}
        </span>
        <svg className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown rendered via Portal */}
      <DropdownContent
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        columns={columns}
        visibleKeys={visibleKeys}
        allKeys={allKeys}
        onApply={onApply}     
      />
    </div>
  );
}
