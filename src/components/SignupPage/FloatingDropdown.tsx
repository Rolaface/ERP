import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  autoUpdate,
} from "@floating-ui/react";

import { createPortal } from "react-dom";
import { useEffect } from "react";

export default function FloatingDropdown({
  open,
  onClose,
  referenceRef,
  children,
}: any) {

  const { refs, floatingStyles, update } = useFloating({
    placement: "bottom-start",
    strategy: "fixed",

    middleware: [
      offset(6),

      flip({
        fallbackPlacements: ["top-start"],
      }),

      shift({
        padding: 8,
      }),

      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: "240px",
          });
        },
      }),
    ],
  });

  // connect your external ref to floating-ui
  useEffect(() => {
    if (referenceRef?.current) {
      refs.setReference(referenceRef.current);
    }
  }, [referenceRef]);

  // auto update on scroll/resize
  useEffect(() => {
    if (!open || !refs.reference.current || !refs.floating.current) return;

    return autoUpdate(
      refs.reference.current,
      refs.floating.current,
      update
    );
  }, [open, refs, update]);

  // close on outside click
  useEffect(() => {
    const handleClick = (e: any) => {
      if (
        !refs.reference.current?.contains(e.target) &&
        !refs.floating.current?.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, [refs, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="dropdown overflow-y-auto shadow-lg"
    >
      {children}
    </div>,
    document.body
  );
}