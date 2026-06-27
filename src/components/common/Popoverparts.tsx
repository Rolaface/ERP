import React from "react";
import { X } from "lucide-react";
import { usePopoverContext } from "./Popover";

// ---------------------------------------------------------------------------
// PopoverHeader — intentionally NOT styled like MinimizableModal's dark
// header. A popover is a helper, one level below the modal it lives in;
// giving it equal visual weight is what made the old HSN modal feel like a
// second screen instead of an extension of the field beside it.
// ---------------------------------------------------------------------------
interface PopoverHeaderProps {
  title: string;
  icon?: React.ReactNode;
  /** Pass false to hide the close button (rare — most popovers want it). */
  showClose?: boolean;
}

export const PopoverHeader: React.FC<PopoverHeaderProps> = ({
  title,
  icon,
  showClose = true,
}) => {
  const { close } = usePopoverContext();
  return (
    <div className="flex items-center justify-between gap-2 border-b border-theme px-3 py-2">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-main">
        {icon}
        {title}
      </div>
      {showClose && (
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="rounded p-0.5 text-muted transition-colors hover:text-main"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// PopoverSearchInput — plain styled input, reusable in any popover body.
// ---------------------------------------------------------------------------
interface PopoverSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  icon?: React.ReactNode;
}

export const PopoverSearchInput: React.FC<PopoverSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  onKeyDown,
  inputRef,
  icon,
}) => (
  <div className="flex items-center gap-2 border-b border-theme bg-app/40 px-3 py-2">
    {icon}
    <input
      ref={inputRef}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="flex-1 bg-transparent text-[12px] text-main outline-none placeholder:text-muted"
    />
  </div>
);

// ---------------------------------------------------------------------------
// PopoverFooterHint — the keyboard-shortcut row, de-emphasized and optional.
// ---------------------------------------------------------------------------
interface PopoverFooterHintProps {
  children: React.ReactNode;
}

export const PopoverFooterHint: React.FC<PopoverFooterHintProps> = ({
  children,
}) => (
  <div className="border-t border-theme px-3 py-1.5 text-[10px] text-muted">
    {children}
  </div>
);