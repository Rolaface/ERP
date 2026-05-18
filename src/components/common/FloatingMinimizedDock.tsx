import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Minus } from "lucide-react";
import { MODAL_LAYER } from "../../store/modalStore";
import { useMinimizedModals } from "../../hooks/useMinimizedModals";
import { MinimizedModalCard } from "./MinimizedModalCard";

export const FloatingMinimizedDock: React.FC = () => {
  const { minimizedModals, restoreModal, closeModal } = useMinimizedModals();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (minimizedModals.length === 0) {
      setExpanded(false);
      setHovered(false);
    }
  }, [minimizedModals.length]);

  const isOpen = expanded || hovered;
  const latestTitle = useMemo(() => {
    const latest = minimizedModals[minimizedModals.length - 1];
    return latest?.meta?.title || latest?.type || "Minimized modals";
  }, [minimizedModals]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {minimizedModals.length > 0 && (
        <motion.div
          key="floating-minimized-dock"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="
            pointer-events-none fixed flex flex-col items-end gap-2
          "
          style={{
            zIndex: MODAL_LAYER.minimizedTaskbar,
            bottom: "max(16px, env(safe-area-inset-bottom))",
            right: "max(16px, env(safe-area-inset-right))",
          }}
          aria-label="Minimized modals"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="minimized-card-stack"
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                className="
                  pointer-events-auto flex max-h-[min(42vh,320px)] max-w-[calc(100vw-32px)]
                  flex-row-reverse gap-1.5 overflow-x-auto overflow-y-hidden rounded-lg p-0.5
                  sm:w-60 sm:flex-col-reverse sm:overflow-x-hidden sm:overflow-y-auto
                "
              >
                <AnimatePresence initial={false}>
                  {minimizedModals.map((modal) => (
                    <MinimizedModalCard
                      key={modal.id}
                      modal={modal}
                      onRestore={() => restoreModal(modal.id)}
                      onClose={() => closeModal(modal.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="
              pointer-events-auto flex h-10 min-w-10 items-center gap-2 rounded-full border
              border-[var(--border)] bg-card/95 px-3 text-xs font-semibold text-main
              shadow-lg shadow-black/10 backdrop-blur-md transition-colors
              hover:border-primary/35 hover:text-primary
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45
            "
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? "Collapse" : "Expand"} minimized modals`}
            title={latestTitle}
          >
            <Minus className="h-3.5 w-3.5" />
            <span>{minimizedModals.length}</span>
            <ChevronUp
              className={`h-3.5 w-3.5 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
