import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom";
  showOnlyWhenFilled?: boolean;
  delay?: number; // ms before showing, default 300
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  showOnlyWhenFilled = false,
  delay = 300,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false); // drives CSS fade-in
  const triggerRef = useRef<HTMLSpanElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldShow = showOnlyWhenFilled ? Boolean(content) : true;

  const clearTimer = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
  };

  // ── Viewport-aware positioning ──────────────────────────────────────
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const GAP = 8;
    const TOOLTIP_WIDTH = 220; // matches max-width below
    const rawLeft = rect.left + window.scrollX + rect.width / 2;

    // Clamp so tooltip never bleeds outside the viewport
    const clampedLeft = Math.min(
      Math.max(rawLeft, TOOLTIP_WIDTH / 2 + 8),
      window.innerWidth + window.scrollX - TOOLTIP_WIDTH / 2 - 8
    );

    setCoords({
      top:
        position === "top"
          ? rect.top + window.scrollY - GAP
          : rect.bottom + window.scrollY + GAP,
      left: clampedLeft,
    });
  }, [position]);

  // ── Show with delay ─────────────────────────────────────────────────
  const show = useCallback(() => {
    if (!shouldShow) return;
    clearTimer();
    showTimer.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
      // Tiny rAF gap so the element is in the DOM before opacity animates
      requestAnimationFrame(() => setReady(true));
    }, delay);
  }, [shouldShow, delay, updatePosition]);

  // ── Hide immediately ────────────────────────────────────────────────
  const hide = useCallback(() => {
    clearTimer();
    setReady(false);
    // Wait for CSS fade-out to finish before unmounting
    setTimeout(() => setVisible(false), 150);
  }, []);

  // ── Reposition on scroll ────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [visible, updatePosition]);

  // ── Cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => () => clearTimer(), []);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-block w-full"
        // Hover
        onMouseEnter={show}
        onMouseLeave={hide}
        // Keyboard / focus — show on focus, hide when user starts typing
        onFocus={show}
        onBlur={hide}
        onKeyDown={hide} // typing dismisses the tooltip immediately
      >
        {children}
      </span>

      {visible &&
        shouldShow &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              transform:
                position === "top"
                  ? `translateX(-50%) translateY(calc(-100% - 2px))`
                  : "translateX(-50%)",
              zIndex: 99999,
              pointerEvents: "none",
              // ── Fade + slide animation ──
              opacity: ready ? 1 : 0,
              translate: ready
                ? "0 0"
                : position === "top"
                ? "0 4px"
                : "0 -4px",
              transition: "opacity 150ms ease, translate 150ms ease",
              maxWidth: 220,
            }}
          >
            <div
              style={{
                background: "rgba(17,24,39,0.92)",
                backdropFilter: "blur(4px)",
                color: "#fff",
                fontSize: 12,
                lineHeight: 1.5,
                borderRadius: 6,
                padding: "5px 10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                wordBreak: "break-word",
                whiteSpace: "normal", // allow wrapping — no more overflow
              }}
            >
              {content}
            </div>

            {/* Arrow */}
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
                      borderTop: "5px solid rgba(17,24,39,0.92)",
                    }
                  : {
                      top: -5,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderBottom: "5px solid rgba(17,24,39,0.92)",
                    }),
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;