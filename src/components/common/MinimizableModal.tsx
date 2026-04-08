import React, { useMemo, useEffect,useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useModalStore,
  MODAL_LAYER,
} from "../../store/modalStore";

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
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "6xl" | "wide" | "full";
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
  const { minimizeModal, restoreModal, bringToFront, registerModalMeta } = useModalStore();

  React.useEffect(() => {
    if (isOpen) {
      registerModalMeta(modalId, { title, subtitle, icon });
    }
  }, [isOpen, modalId, title, subtitle, icon, registerModalMeta]);

  const modalMeta = useMemo(
    () => modals.find((m) => m.id === modalId),
    [modals, modalId]
  );

  const minimized = modalMeta?.minimized ?? false;
  const focused = useMemo(() => {
    const visible = modals.filter((m) => !m.minimized);
    if (!visible.length) return false;
    const top = [...visible].sort((a, b) => b.focusOrder - a.focusOrder)[0];
    return top.id === modalId;
  }, [modals, modalId]);

  const layer = useMemo(() => {
    const visible = modals
      .filter((m) => !m.minimized)
      .sort((a, b) => a.focusOrder - b.focusOrder);
    const rank = Math.max(visible.findIndex((m) => m.id === modalId), 0);
    const backdrop = MODAL_LAYER.modalBackdropBase + rank * MODAL_LAYER.modalStep;
    return {
      backdrop,
      panel: backdrop + MODAL_LAYER.modalPanelOffset,
    };
  }, [modals, modalId]);

  const interactionLocked = swalDepth > 0;

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
            focused={focused}
            interactionLocked={interactionLocked}
            onClose={onClose}
            onMinimize={() => minimizeModal(modalId)}
            onFocus={() => bringToFront(modalId)}
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
  focused: boolean;
  interactionLocked: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
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
  focused,
  interactionLocked,
  onClose,
  onMinimize,
  onFocus,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!focused || typeof document === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focused]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="erp-modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: backdropZIndex,
          cursor: !focused && !interactionLocked ? "pointer" : "default",
          background: focused ? "rgba(15,23,42,0.32)" : "rgba(15,23,42,0.1)",
          backdropFilter: focused ? "blur(2px)" : "none",
          transition: "background 0.2s ease, backdrop-filter 0.2s ease",
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !focused && !interactionLocked)
            onFocus();
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
          animate={{
            opacity: 1,
            scale: focused ? 1 : 0.985,
            y: 0,
          }}
          exit={{ opacity: 0, scale: 0.9, y: 32 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className={`erp-modal-panel flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-card ${
            !customWidth ? MAX_WIDTH_CLASSES[maxWidth] ?? "max-w-4xl" : ""
          }`}
          style={{
            pointerEvents: "auto",
            height,
            width: customWidth || undefined,
            maxWidth: customWidth ? "none" : undefined,
            boxShadow: focused
              ? "0 28px 70px rgba(15,23,42,0.28), 0 0 0 1px rgba(15,23,42,0.06)"
              : "0 10px 28px rgba(15,23,42,0.14)",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseDown={() => {
            if (!focused && !interactionLocked) onFocus();
          }}
        >
          <header
            className="relative overflow-hidden bg-primary px-4 py-3"
            style={{ opacity: focused ? 1 : 0.9, transition: "opacity 0.2s ease" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className="rounded-lg bg-white/10 p-1.5 backdrop-blur-sm">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">{title}</h2>
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!focused && (
                  <span className="mr-2 text-[9px] font-semibold tracking-[0.12em] text-white/60">
                    CLICK TO FOCUS
                  </span>
                )}
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

          <section
            className="flex-1 overflow-x-hidden overflow-y-auto bg-app px-4 py-3 text-sm text-main"
            style={{
              opacity: focused ? 1 : 0.78,
              transition: "opacity 0.2s ease",
            }}
          >
            {children}
          </section>

          {footer && (
            <footer
              className="flex shrink-0 items-center justify-between border-t border-[var(--border)] bg-app px-4 py-3"
              style={{
                opacity: focused ? 1 : 0.78,
                transition: "opacity 0.2s ease",
              }}
            >
              {footer}
            </footer>
          )}
        </motion.div>
      </div>
    </>,
    document.body
  );
};