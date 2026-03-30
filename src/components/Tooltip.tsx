import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom";
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    if (position === "top") {
      setCoords({
        top: rect.top + scrollY - 8,   // 8px gap above
        left: rect.left + scrollX + rect.width / 2,
      });
    } else {
      setCoords({
        top: rect.bottom + scrollY + 8, // 8px gap below
        left: rect.left + scrollX + rect.width / 2,
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setVisible(true);
  };

  // Recompute if window scrolls while tooltip is visible
  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [visible]);

  const transformY = position === "top" ? "-100%" : "0%";

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>

      {visible &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              transform: `translateX(-50%) translateY(${transformY})`,
              zIndex: 99999,
              pointerEvents: "none",
            }}
          >
            <div className="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;9
