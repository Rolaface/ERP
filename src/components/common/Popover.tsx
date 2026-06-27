import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// Why this exists
// ---------------------------------------------------------------------------
// MinimizableModal is great for primary, taskbar-able workflows ("Add Item").
// It's the wrong tool for "pick a value to fill one field" â€” that should feel
// anchored to the field, not like a second screen. This component is the
// shared anchored-popover primitive for that whole family of interactions
// (HSN search, brand picker, warehouse picker, tax category picker, etc).
//
// Usage:
//   const triggerRef = useRef<HTMLButtonElement>(null);
//   <Popover triggerRef={triggerRef} open={open} onClose={() => setOpen(false)}>
//     ...content...
//   </Popover>
// ---------------------------------------------------------------------------

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

interface PopoverContextValue {
  close: () => void;
}
const PopoverContext = createContext<PopoverContextValue | null>(null);

/** Lets deeply-nested popover content (e.g. a list row) close the popover
 *  without threading onClose down as a prop through every layer. */
export function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error("usePopoverContext must be used inside <Popover>");
  }
  return ctx;
}

interface PopoverProps {
  /** Element the popover is anchored to. */
  triggerRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  placement?: PopoverPlacement;
  /** Fixed width in px. Height is intrinsic (content-driven) unless maxHeight is set. */
  width?: number;
  maxHeight?: number;
  /** Dim the page behind the popover. Off by default â€” popovers are usually
   *  light-touch. Turn on for picker flows where you want to force focus
   *  (mirrors the modal feel without becoming a second modal). */
  showScrim?: boolean;
  /** Gap between trigger and popover, in px. */
  offset?: number;
  className?: string;
}

interface PopoverPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

const VIEWPORT_PADDING = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPosition(
  trigger: HTMLElement,
  placement: PopoverPlacement,
  width: number,
  offset: number,
  preferredHeight: number,
): PopoverPosition {
  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;


  const wantsBottom = placement.startsWith("bottom");
  const wantsStart = placement.endsWith("start");

  const renderedWidth = Math.min(width, Math.max(0, vw - VIEWPORT_PADDING * 2));
  const maxLeft = Math.max(VIEWPORT_PADDING, vw - renderedWidth - VIEWPORT_PADDING);
  const preferredLeft = wantsStart ? rect.left : rect.right - renderedWidth;
  const left = clamp(preferredLeft, VIEWPORT_PADDING, maxLeft);

  const bottomTop = rect.bottom + offset;
  const availableBelow = Math.max(0, vh - bottomTop - VIEWPORT_PADDING);
  const topBottom = vh - rect.top + offset;
  const availableAbove = Math.max(0, rect.top - offset - VIEWPORT_PADDING);
  const desiredHeight = Math.min(
    preferredHeight,
    Math.max(0, vh - VIEWPORT_PADDING * 2),
  );

  let openBelow = wantsBottom;

  if (wantsBottom && availableBelow < desiredHeight && availableAbove > availableBelow) {
    openBelow = false;
  } else if (!wantsBottom && availableAbove < desiredHeight && availableBelow > availableAbove) {
    openBelow = true;
  }

  if (openBelow) {
    return {
      top: bottomTop,
      left,
      width: renderedWidth,
      maxHeight: availableBelow,
    };
  }

  return {
    bottom: topBottom,
    left,
    width: renderedWidth,
    maxHeight: availableAbove,
  };
}

export const Popover: React.FC<PopoverProps> = ({
  triggerRef,
  open,
  onClose,
  children,
  placement = "bottom-end",
  width = 320,
  maxHeight = 420,
  showScrim = false,
  offset = 8,
  className = "",
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<PopoverPosition | null>(null);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const preferredHeight = popoverRef.current?.scrollHeight ?? maxHeight;
    const next = getPosition(
      triggerRef.current,
      placement,
      width,
      offset,
      preferredHeight,
    );

    setCoords((current) => {
      if (
        current &&
        current.top === next.top &&
        current.bottom === next.bottom &&
        current.left === next.left &&
        current.width === next.width &&
        current.maxHeight === next.maxHeight
      ) {
        return current;
      }
      return next;
    });
  }, [triggerRef, placement, width, offset, maxHeight]);

  // Position on open, and keep in sync with scroll/resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => reposition())
        : null;
    if (triggerRef.current) resizeObserver?.observe(triggerRef.current);
    if (popoverRef.current) resizeObserver?.observe(popoverRef.current);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      resizeObserver?.disconnect();
    };
  }, [open, reposition, triggerRef]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    // Mousedown (not click) so a drag-select inside the popover doesn't
    // trigger a false close on mouseup outside.
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, triggerRef]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !coords) return null;

  return createPortal(
    <PopoverContext.Provider value={{ close: onClose }}>
      {showScrim && (
        <div
          className="fixed inset-0 z-[var(--z-popover-scrim,1990)] bg-black/35 transition-opacity"
          aria-hidden="true"
        />
      )}
     // Popover.tsx - style fix
<div
  ref={popoverRef}
  role="dialog"
  style={{
    position: "fixed",
    ...(coords.top !== undefined ? { top: coords.top } : {}),
    ...(coords.bottom !== undefined ? { bottom: coords.bottom } : {}),
    left: coords.left,
    width: coords.width,
    maxHeight: coords.maxHeight,  
    zIndex: "var(--z-popover, 2000)" as unknown as number,
  }}
  className={[
    "flex flex-col overflow-hidden rounded-lg border border-theme bg-card shadow-lg",
    "motion-scale-in",
    className,
  ].join(" ")}
>
        {children}
      </div>
    </PopoverContext.Provider>,
    document.body,
  );
};

export default Popover;