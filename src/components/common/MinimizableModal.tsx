import React, { useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useModalStore, MODAL_LAYER } from "../../store/modalStore";

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  wide: "w-[70vw] max-w-6xl",
  full: "max-w-[92vw]",
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
}) => {
  const modals = useModalStore((state) => state.modals);
  const swalDepth = useModalStore((state) => state.swalDepth);
  const { minimizeModal, bringToFront, registerModalMeta } = useModalStore();

  React.useEffect(() => {
    if (isOpen) {
      registerModalMeta(modalId, { title, subtitle, icon });
    }
  }, [isOpen, modalId, title, subtitle, icon, registerModalMeta]);

  const modalMeta = useMemo(
    () => modals.find((m) => m.id === modalId),
    [modals, modalId],
  );

  const minimized = modalMeta?.minimized ?? false;

  const layer = useMemo(() => {
    const visible = modals
      .filter((m) => !m.minimized)
      .sort((a, b) => a.focusOrder - b.focusOrder);
    const rank = Math.max(
      visible.findIndex((m) => m.id === modalId),
      0,
    );
    const backdrop =
      MODAL_LAYER.modalBackdropBase + rank * MODAL_LAYER.modalStep;
    return {
      backdrop,
      panel: backdrop + MODAL_LAYER.modalPanelOffset,
    };
  }, [modals, modalId]);

  if (!isOpen) return null;

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
          padding: 16,
          pointerEvents: "none",
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
            !customWidth ? (MAX_WIDTH_CLASSES[maxWidth] ?? "max-w-4xl") : ""
          }`}
          style={{
            pointerEvents: "auto",
            height,
            width: customWidth || undefined,
            maxWidth: customWidth ? "calc(100vw - 32px)" : undefined,
            maxHeight: "calc(100vh - 32px)",
            boxShadow: "0 28px 70px rgba(15,23,42,0.28), 0 0 0 1px rgba(15,23,42,0.06)",
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
          </header>

          <section className="min-h-0 flex-1 overflow-x-auto overflow-y-auto bg-app px-4 py-3 text-sm text-main">
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
    document.body,
  );
};
