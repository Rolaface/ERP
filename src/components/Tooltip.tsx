import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom";
  showOnlyWhenFilled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  showOnlyWhenFilled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const shouldShow = showOnlyWhenFilled ? Boolean(content) : true;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const GAP = 8;

    setCoords({
      // TOP: sit right above the element's top edge (not bottom)
      top:
        position === "top"
          ? rect.top + window.scrollY - GAP      // above the element
          : rect.bottom + window.scrollY + GAP,  // below the element
      left: rect.left + window.scrollX + rect.width / 2,
    });
  };

  const handleMouseEnter = () => {
    if (!shouldShow) return;
    updatePosition();
    setVisible(true);
  };

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [visible]);

  return (
    <>
      {/*
        Key fix: use an INLINE span as the ref anchor, not a block div.
        This way getBoundingClientRect() measures only the content itself
        (the text, the input, etc.) — not the full row/cell height.
      */}
      <span
        ref={triggerRef}
        className="inline-block w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </span>

      {visible &&
        shouldShow &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              // translate up by 100% so bottom of tooltip aligns with top of trigger
              transform:
                position === "top"
                  ? "translateX(-50%) translateY(-100%)"
                  : "translateX(-50%)",
              zIndex: 99999,
              pointerEvents: "none",
            }}
          >
            <div className="whitespace-nowrap rounded bg-gray-900 px-2.5 py-1 text-xs text-white shadow-lg">
              {content}
            </div>

            {/* Arrow pointing DOWN toward the element */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                ...(position === "top"
                  ? {
                      bottom: -5,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: "5px solid #111827",
                    }
                  : {
                      top: -5,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderBottom: "5px solid #111827",
                    }),
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
};

export default Tooltip;