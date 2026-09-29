import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface ViewOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: readonly ViewOption<T>[];
  onChange: (value: T) => void;
  label?: string;
}

const MENU_GAP_PX = 4;
const MENU_Z_INDEX = 99999;

function ViewSelector<T extends string>({
  value,
  options,
  onChange,
  label = "View",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const active = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    const handleDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const handleViewportChange = () => setOpen(false);

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + MENU_GAP_PX,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((prev) => !prev);
  };

  const select = (next: T) => {
    setOpen(false);
    if (next !== value) onChange(next);
    buttonRef.current?.focus();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-card px-3 py-2.5 text-sm font-semibold text-main transition-colors hover:bg-row-hover focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="hidden text-muted sm:inline">{label}:</span>
        <span>{active?.label}</span>
        <ChevronDown
          size={14}
          className={[
            "text-muted transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos.top,
              right: pos.right,
              zIndex: MENU_Z_INDEX,
            }}
            className="min-w-[9rem] rounded-lg border border-[var(--border)] bg-card p-1 shadow-lg"
          >
            {options.map((o) => {
              const isActive = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => select(o.value)}
                  className={[
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors hover:bg-row-hover focus:outline-none focus-visible:bg-row-hover",
                    isActive ? "text-primary" : "text-main",
                  ].join(" ")}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {isActive && <Check size={14} />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

export default ViewSelector;