import React, { useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useModalStore, MODAL_LAYER } from "../../store/modalStore";

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-lg",
  xl: "w-full max-w-xl",
  "2xl": "w-full max-w-2xl",
  "4xl": "w-full max-w-4xl",
  "5xl": "w-full max-w-5xl",
  "6xl": "w-full max-w-6xl",
  wide: "w-full max-w-6xl",
  full: "w-full max-w-[92vw]",
};

export interface MinimizableModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  summaryBar?: React.ReactNode;
  maxWidth?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "wide"
    | "full";
  height?: string;
  customWidth?: string;
  formContainerRef?: React.RefObject<HTMLElement | null>;
}

export const MinimizableModal: React.FC<MinimizableModalProps> = ({
  modalId,
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "4xl",
  height = "520px",
  customWidth,
  summaryBar,
  formContainerRef,
}) => {
  const modalMeta = useModalStore((state) =>
    state.modals.find((m) => m.id === modalId)
  );
  const { minimizeModal } = useModalStore();

  const registeredRef = useRef(false);

  React.useEffect(() => {
    if (isOpen && !registeredRef.current) {
      registeredRef.current = true;
      useModalStore
        .getState()
        .registerModalMeta(modalId, { title, subtitle, icon });
    }
    if (!isOpen) {
      registeredRef.current = false;
    }
  }, [isOpen, modalId, title, subtitle, icon]);

  const modals = useModalStore((state) => state.modals);
  const layer = useMemo(() => {
    const visible = modals
      .filter((m) => !m.minimized)
      .sort((a, b) => a.focusOrder - b.focusOrder);
    const rank = Math.max(
      visible.findIndex((m) => m.id === modalId),
      0
    );
    const backdrop =
      MODAL_LAYER.modalBackdropBase + rank * MODAL_LAYER.modalStep;
    return {
      backdrop,
      panel: backdrop + MODAL_LAYER.modalPanelOffset,
    };
  }, [modals, modalId]);

  if (!isOpen) return null;

  const minimized = modalMeta?.minimized ?? false;

  return (
    <>
      {minimized && <div style={{ display: "none" }}>{children}</div>}
      <AnimatePresence>
        {!minimized && (
          <ModalShell
            title={title}
            subtitle={subtitle}
            icon={icon}
            footer={footer}
            maxWidth={maxWidth}
            height={height}
            customWidth={customWidth}
            backdropZIndex={layer.backdrop}
            panelZIndex={layer.panel}
            onClose={onClose}
            onMinimize={() => minimizeModal(modalId)}
            summaryBar={summaryBar}
            formContainerRef={formContainerRef}
          >
            {children}
          </ModalShell>
        )}
      </AnimatePresence>
    </>
  );
};

interface ModalShellProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  height?: string;
  customWidth?: string;
  backdropZIndex: number;
  panelZIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  summaryBar?: React.ReactNode;
  formContainerRef?: React.RefObject<HTMLElement | null>;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = "4xl",
  height = "520px",
  customWidth,
  backdropZIndex,
  panelZIndex,
  onClose,
  onMinimize,
  summaryBar,
  formContainerRef,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="erp-modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: backdropZIndex,
          background: "rgba(15,23,42,0.32)",
          backdropFilter: "blur(2px)",
        }}
      />

      <div
        className="erp-modal-layer"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: panelZIndex,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          pointerEvents: "none",
          // If the panel's minWidth ever exceeds the real viewport (very
          // small windows / extreme zoom), this lets the layer itself
          // scroll so the panel is still reachable instead of being
          // clipped off-screen with no way to get to it.
          overflow: "auto",
        }}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 32 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className={`erp-modal-panel flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-card ${
            !customWidth ? (MAX_WIDTH_CLASSES[maxWidth] ?? "w-full max-w-4xl") : ""
          }`}
          style={{
            pointerEvents: "auto",
            height,
            width: customWidth || undefined,
            // Without a floor, customWidth ("90vw" etc.) keeps shrinking as
            // the effective viewport shrinks (browser/OS zoom, smaller
            // windows), while fixed-width children inside the panel
            // (sidebars, table columns) don't shrink with it. That fight
            // is exactly what produces "compact but not actually
            // responsive" — content overlapping, columns collapsing into
            // each other instead of reflowing cleanly. A minWidth means
            // the panel holds a sane working size; if the real viewport
            // is smaller than that, the backdrop layer's own overflow
            // (see above) handles it instead of the panel's internal
            // layout breaking.
            minWidth: customWidth
              ? "min(960px, calc(100vw - 16px))"
              : undefined,
            maxWidth: customWidth ? "calc(100vw - 16px)" : undefined,
            maxHeight: "calc(100dvh - 16px)",
            boxShadow:
              "0 28px 70px rgba(15,23,42,0.28), 0 0 0 1px rgba(15,23,42,0.06)",
          }}
        >
          <header className="relative overflow-hidden bg-primary px-4 py-3">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className="rounded-lg bg-white/10 p-1.5 backdrop-blur-sm">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Minimize"
                  className="group rounded-lg p-1.5 transition-all hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimize();
                  }}
                >
                  <Minus className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  className="group rounded-lg p-1.5 transition-all hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                >
                  <X className="h-4 w-4 text-white transition-transform group-hover:rotate-90" />
                </button>
              </div>
            </div>
            {summaryBar && <div className="relative mt-1">{summaryBar}</div>}
          </header>

          <section
            ref={(node) => {
              if (formContainerRef) {
                (
                  formContainerRef as React.MutableRefObject<HTMLElement | null>
                ).current = node;
              }
            }}
            className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto bg-app px-4 py-3 text-sm text-main"
          >
            {children}
          </section>

          {footer && (
            <footer className="flex shrink-0 items-center justify-between border-t border-[var(--border)] bg-app px-4 py-3">
              {footer}
            </footer>
          )}
        </motion.div>
      </div>
    </>,
    document.body
  );
};