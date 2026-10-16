import {
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

const VIEWPORT_GAP = 8;
const TRIGGER_GAP = 4;
const FLIP_THRESHOLD = 12;

export const usePopoverPosition = (
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  minWidth = 300,
) => {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  const update = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, minWidth);
    const left = Math.max(
      VIEWPORT_GAP,
      Math.min(rect.left, window.innerWidth - width - VIEWPORT_GAP),
    );
    const fitsBelow =
      window.innerHeight - rect.bottom > popover.offsetHeight + FLIP_THRESHOLD;
    const top = fitsBelow
      ? rect.bottom + TRIGGER_GAP
      : Math.max(VIEWPORT_GAP, rect.top - popover.offsetHeight - TRIGGER_GAP);

    setStyle({ top, left, width, visibility: "visible" });
  }, [triggerRef, popoverRef, minWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle({ visibility: "hidden" });
      return;
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, update]);

  return style;
};