import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  APP_SWAL_CLOSE_EVENT,
  APP_SWAL_OPEN_EVENT,
} from "../../utils/swalManager";

export const MODAL_LAYER = {
  sidebar: 100,
  appChrome: 120,
  modalBackdropBase: 1000,
  modalStep: 20,
  modalPanelOffset: 10,
  minimizedTaskbar: 1800,
} as const;

export interface ModalInstance {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  minimized: boolean;
  openedAt: number;
  focusOrder: number;
}

interface ModalRegistration {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onRequestClose?: () => void;
}

interface ModalLayerPosition {
  backdrop: number;
  panel: number;
}

interface ModalManagerCtx {
  instances: ModalInstance[];
  register: (inst: ModalRegistration) => void;
  unregister: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  bringToFront: (id: string) => void;
  requestClose: (id: string) => void;
  isMinimized: (id: string) => boolean;
  isFocused: (id: string) => boolean;
  isInteractionLocked: boolean;
  getModalLayer: (id: string) => ModalLayerPosition;
  getTopModalId: () => string | null;
}

const ModalManagerContext = createContext<ModalManagerCtx | null>(null);

interface ModalManagerProviderProps {
  children: React.ReactNode;
  dockWidth?: "80" | "90" | "100"; // kept for API compatibility
}

export const useModalManager = (): ModalManagerCtx => {
  const ctx = useContext(ModalManagerContext);
  if (!ctx) throw new Error("useModalManager must be used inside <ModalManagerProvider>");
  return ctx;
};

export const ModalManagerProvider: React.FC<ModalManagerProviderProps> = ({
  children,
}) => {
  const [instances, setInstances] = useState<ModalInstance[]>([]);
  const [swalDepth, setSwalDepth] = useState(0);
  const focusCounter = useRef(0);
  const closeHandlersRef = useRef(new Map<string, () => void>());

  const register = useCallback((inst: ModalRegistration) => {
    if (inst.onRequestClose) {
      closeHandlersRef.current.set(inst.id, inst.onRequestClose);
    }

    setInstances((prev) => {
      const existing = prev.find((m) => m.id === inst.id);
      if (existing) {
        const unchanged =
          existing.title === inst.title &&
          existing.subtitle === inst.subtitle &&
          existing.icon === inst.icon;
        if (unchanged) return prev;
        return prev.map((m) =>
          m.id === inst.id
            ? { ...m, title: inst.title, subtitle: inst.subtitle, icon: inst.icon }
            : m
        );
      }
      focusCounter.current += 1;
      return [
        ...prev,
        {
          id: inst.id,
          title: inst.title,
          subtitle: inst.subtitle,
          icon: inst.icon,
          minimized: false,
          openedAt: Date.now(),
          focusOrder: focusCounter.current,
        },
      ];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    closeHandlersRef.current.delete(id);
    setInstances((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const minimize = useCallback((id: string) => {
    setInstances((prev) =>
      prev.map((m) => (m.id === id ? { ...m, minimized: true } : m))
    );
  }, []);

  const restore = useCallback((id: string) => {
    setInstances((prev) => {
      focusCounter.current += 1;
      return prev.map((m) =>
        m.id === id ? { ...m, minimized: false, focusOrder: focusCounter.current } : m
      );
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setInstances((prev) => {
      const topVisible = [...prev]
        .filter((m) => !m.minimized)
        .sort((a, b) => b.focusOrder - a.focusOrder)[0];
      if (!topVisible || topVisible.id === id) return prev;
      focusCounter.current += 1;
      return prev.map((m) =>
        m.id === id ? { ...m, minimized: false, focusOrder: focusCounter.current } : m
      );
    });
  }, []);

  const requestClose = useCallback((id: string) => {
    closeHandlersRef.current.get(id)?.();
  }, []);

  const isMinimized = useCallback(
    (id: string) => instances.find((m) => m.id === id)?.minimized ?? false,
    [instances]
  );

  const isFocused = useCallback(
    (id: string) => {
      const visible = instances.filter((m) => !m.minimized);
      if (!visible.length) return false;
      const top = visible.reduce((a, b) => (b.focusOrder > a.focusOrder ? b : a));
      return top.id === id;
    },
    [instances]
  );

  const getTopModalId = useCallback(() => {
    const visible = instances.filter((m) => !m.minimized);
    if (!visible.length) return null;
    return visible.reduce((a, b) => (b.focusOrder > a.focusOrder ? b : a)).id;
  }, [instances]);

  const getModalLayer = useCallback(
    (id: string): ModalLayerPosition => {
      const visible = instances
        .filter((m) => !m.minimized)
        .sort((a, b) => a.focusOrder - b.focusOrder);
      const rank = Math.max(visible.findIndex((m) => m.id === id), 0);
      const backdrop = MODAL_LAYER.modalBackdropBase + rank * MODAL_LAYER.modalStep;
      return { backdrop, panel: backdrop + MODAL_LAYER.modalPanelOffset };
    },
    [instances]
  );

  useEffect(() => {
    const up = () => setSwalDepth((p) => p + 1);
    const down = () => setSwalDepth((p) => Math.max(p - 1, 0));
    window.addEventListener(APP_SWAL_OPEN_EVENT, up as EventListener);
    window.addEventListener(APP_SWAL_CLOSE_EVENT, down as EventListener);
    return () => {
      window.removeEventListener(APP_SWAL_OPEN_EVENT, up as EventListener);
      window.removeEventListener(APP_SWAL_CLOSE_EVENT, down as EventListener);
    };
  }, []);

  const value = useMemo(
    () => ({
      instances,
      register,
      unregister,
      minimize,
      restore,
      bringToFront,
      requestClose,
      isMinimized,
      isFocused,
      isInteractionLocked: swalDepth > 0,
      getModalLayer,
      getTopModalId,
    }),
    [
      instances, register, unregister, minimize, restore,
      bringToFront, requestClose, isMinimized, isFocused,
      swalDepth, getModalLayer, getTopModalId,
    ]
  );

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
      <MinimizedDrawer />
    </ModalManagerContext.Provider>
  );
};

/* ─────────────────────────────────────────────
   MINIMIZED DRAWER
   Compact icon-chips pinned to the right edge,
   below the app topbar (~56px). Never overlaps
   table content — sits outside the scroll area.
───────────────────────────────────────────── */

const MinimizedDrawer: React.FC = () => {
  const { instances, requestClose, restore } = useModalManager();
  const minimized = instances.filter((m) => m.minimized);

  if (typeof document === "undefined" || minimized.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="minimized-drawer"
        initial={{ x: 64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 64, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="
          fixed
          flex flex-col gap-1.5
          rounded-xl border border-[var(--border)]
          bg-card/98 backdrop-blur-md
          px-1.5 py-2
          shadow-lg shadow-black/10
          overflow-y-auto overflow-x-hidden
        "
        style={{
          zIndex: MODAL_LAYER.minimizedTaskbar,
          bottom: 24,           // anchored to bottom — never overlaps tabs/topbar
          right: 12,            // 12px gap from edge
          maxHeight: "60vh",
          width: 40,
        }}
      >
        {/* Chips */}
        {[...minimized].reverse().map((inst) => (
          <DrawerChip
            key={inst.id}
            inst={inst}
            onRestore={() => restore(inst.id)}
            onClose={() => requestClose(inst.id)}
          />
        ))}

        {/* Count badge — bottom of stack */}
        <div className="border-t border-[var(--border)] mx-0.5 mt-0.5 pt-1.5 flex justify-center">
          <div
            className="flex items-center justify-center rounded-full bg-primary"
            style={{ width: 18, height: 18 }}
          >
            <span className="text-[9px] font-black text-white leading-none">
              {minimized.length}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

/* ─────────────────────────────────────────────
   DRAWER CHIP
   Icon-only button with tooltip title.
   Close (×) appears on hover as a tiny badge
   in the top-right corner of the icon.
───────────────────────────────────────────── */

const DrawerChip: React.FC<{
  inst: ModalInstance;
  onRestore: () => void;
  onClose: () => void;
}> = ({ inst, onRestore, onClose }) => {
  const Icon = inst.icon;

  return (
    <motion.div
      initial={{ x: 32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 32, opacity: 0 }}
      transition={{ duration: 0.13 }}
      className="relative group flex justify-center"
      title={inst.title}
    >
      {/* Restore button — icon */}
      <button
        type="button"
        onClick={onRestore}
        className="
          flex h-8 w-8 items-center justify-center
          rounded-lg border border-primary/20 bg-primary/8
          transition-all duration-150
          hover:border-primary/40 hover:bg-primary/15
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        "
        aria-label={`Restore ${inst.title}`}
      >
        {Icon
          ? <Icon className="h-3.5 w-3.5 text-primary" />
          : <span className="text-[10px] font-bold text-primary">{inst.title.charAt(0)}</span>
        }
      </button>

      {/* Close badge — top-right, visible on group hover */}
      <span
        role="button"
        tabIndex={0}
        title={`Close ${inst.title}`}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClose(); } }}
        className="
          absolute -top-1 -right-1
          hidden group-hover:flex
          h-3.5 w-3.5 items-center justify-center
          rounded-full bg-red-500 text-white
          cursor-pointer z-10
          transition-all duration-150
        "
      >
        <X className="h-2 w-2" />
      </span>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MINIMIZABLE MODAL
───────────────────────────────────────────── */

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
  const {
    register, unregister, minimize,
    isMinimized, getModalLayer, isFocused,
    bringToFront, isInteractionLocked,
  } = useModalManager();

  const registered = useRef(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (registered.current) {
        unregister(modalId);
        registered.current = false;
      }
      return;
    }

    register({
      id: modalId,
      title,
      subtitle,
      icon,
      onRequestClose: () => onCloseRef.current(),
    });
    registered.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, modalId, title, subtitle, icon, register, unregister]);

  useEffect(() => {
    return () => {
      if (registered.current) {
        unregister(modalId);
        registered.current = false;
      }
    };
  }, [modalId, unregister]);

  if (!isOpen) return null;

  const minimized = isMinimized(modalId);
  const layer = getModalLayer(modalId);
  const focused = isFocused(modalId);

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
            interactionLocked={isInteractionLocked}
            onClose={onClose}
            onMinimize={() => minimize(modalId)}
            onFocus={() => bringToFront(modalId)}
          >
            {children}
          </ModalShell>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─────────────────────────────────────────────
   MODAL SHELL
───────────────────────────────────────────── */

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
  title, subtitle, icon: Icon, children, footer,
  maxWidth = "4xl", height = "520px", customWidth,
  backdropZIndex, panelZIndex, focused, interactionLocked,
  onClose, onMinimize, onFocus,
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
      {/* Backdrop */}
      <div
        className="erp-modal-backdrop"
        style={{
          position: "fixed", inset: 0, zIndex: backdropZIndex,
          cursor: !focused && !interactionLocked ? "pointer" : "default",
          background: focused ? "rgba(15,23,42,0.32)" : "rgba(15,23,42,0.1)",
          backdropFilter: focused ? "blur(2px)" : "none",
          transition: "background 0.2s ease, backdrop-filter 0.2s ease",
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !focused && !interactionLocked) onFocus();
        }}
      />

      {/* Panel layer */}
      <div
        className="erp-modal-layer"
        style={{
          position: "fixed", inset: 0, zIndex: panelZIndex,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, pointerEvents: "none",
        }}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: focused ? 1 : 0.985, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 32 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className={`erp-modal-panel flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-card ${
            !customWidth ? (MAX_WIDTH_CLASSES[maxWidth] ?? "max-w-4xl") : ""
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
          onMouseDown={() => { if (!focused && !interactionLocked) onFocus(); }}
        >
          {/* Header */}
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
                  {subtitle && <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>}
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
                  onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                >
                  <Minus className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  className="group rounded-lg p-1.5 transition-all hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                  <X className="h-4 w-4 text-white transition-transform group-hover:rotate-90" />
                </button>
              </div>
            </div>
          </header>

          {/* Body */}
          <section
            className="flex-1 overflow-x-hidden overflow-y-auto bg-app px-4 py-3 text-sm text-main"
            style={{ opacity: focused ? 1 : 0.78, transition: "opacity 0.2s ease" }}
          >
            {children}
          </section>

          {/* Footer */}
          {footer && (
            <footer
              className="flex shrink-0 items-center justify-between border-t border-[var(--border)] bg-app px-4 py-3"
              style={{ opacity: focused ? 1 : 0.78, transition: "opacity 0.2s ease" }}
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