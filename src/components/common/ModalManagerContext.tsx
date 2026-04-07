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
import { Maximize2, Minus, X } from "lucide-react";
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

export const useModalManager = (): ModalManagerCtx => {
  const ctx = useContext(ModalManagerContext);
  if (!ctx) {
    throw new Error("useModalManager must be used inside <ModalManagerProvider>");
  }
  return ctx;
};

export const ModalManagerProvider: React.FC<{ children: React.ReactNode }> = ({
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
      const existing = prev.find((modal) => modal.id === inst.id);

      if (existing) {
        return prev.map((modal) =>
          modal.id === inst.id
            ? {
                ...modal,
                title: inst.title,
                subtitle: inst.subtitle,
                icon: inst.icon,
              }
            : modal
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
    setInstances((prev) => prev.filter((modal) => modal.id !== id));
  }, []);

  const minimize = useCallback((id: string) => {
    setInstances((prev) =>
      prev.map((modal) =>
        modal.id === id ? { ...modal, minimized: true } : modal
      )
    );
  }, []);

  const restore = useCallback((id: string) => {
    setInstances((prev) => {
      focusCounter.current += 1;

      return prev.map((modal) =>
        modal.id === id
          ? { ...modal, minimized: false, focusOrder: focusCounter.current }
          : modal
      );
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setInstances((prev) => {
      const topVisible = [...prev]
        .filter((modal) => !modal.minimized)
        .sort((a, b) => b.focusOrder - a.focusOrder)[0];

      if (!topVisible || topVisible.id === id) {
        return prev;
      }

      focusCounter.current += 1;

      return prev.map((modal) =>
        modal.id === id
          ? { ...modal, minimized: false, focusOrder: focusCounter.current }
          : modal
      );
    });
  }, []);

  const requestClose = useCallback((id: string) => {
    closeHandlersRef.current.get(id)?.();
  }, []);

  const isMinimized = useCallback(
    (id: string) => instances.find((modal) => modal.id === id)?.minimized ?? false,
    [instances]
  );

  const isFocused = useCallback(
    (id: string) => {
      const visible = instances.filter((modal) => !modal.minimized);
      if (visible.length === 0) {
        return false;
      }

      const topModal = visible.reduce((currentTop, modal) =>
        modal.focusOrder > currentTop.focusOrder ? modal : currentTop
      );

      return topModal.id === id;
    },
    [instances]
  );

  const getTopModalId = useCallback(() => {
    const visible = instances.filter((modal) => !modal.minimized);
    if (visible.length === 0) {
      return null;
    }

    const topModal = visible.reduce((currentTop, modal) =>
      modal.focusOrder > currentTop.focusOrder ? modal : currentTop
    );

    return topModal.id;
  }, [instances]);

  const getModalLayer = useCallback(
    (id: string): ModalLayerPosition => {
      const visible = instances
        .filter((modal) => !modal.minimized)
        .sort((a, b) => a.focusOrder - b.focusOrder);

      const rank = Math.max(
        visible.findIndex((modal) => modal.id === id),
        0
      );
      const backdrop =
        MODAL_LAYER.modalBackdropBase + rank * MODAL_LAYER.modalStep;

      return {
        backdrop,
        panel: backdrop + MODAL_LAYER.modalPanelOffset,
      };
    },
    [instances]
  );

  useEffect(() => {
    const handleSwalOpen = () => {
      setSwalDepth((prev) => prev + 1);
    };

    const handleSwalClose = () => {
      setSwalDepth((prev) => Math.max(prev - 1, 0));
    };

    window.addEventListener(APP_SWAL_OPEN_EVENT, handleSwalOpen as EventListener);
    window.addEventListener(APP_SWAL_CLOSE_EVENT, handleSwalClose as EventListener);

    return () => {
      window.removeEventListener(
        APP_SWAL_OPEN_EVENT,
        handleSwalOpen as EventListener
      );
      window.removeEventListener(
        APP_SWAL_CLOSE_EVENT,
        handleSwalClose as EventListener
      );
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
      instances,
      register,
      unregister,
      minimize,
      restore,
      bringToFront,
      requestClose,
      isMinimized,
      isFocused,
      swalDepth,
      getModalLayer,
      getTopModalId,
    ]
  );

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
      <ModalTaskbar />
    </ModalManagerContext.Provider>
  );
};

const ModalTaskbar: React.FC = () => {
  const { instances, requestClose, restore } = useModalManager();
  const minimized = instances.filter((modal) => modal.minimized);

  if (typeof document === "undefined" || minimized.length === 0) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="taskbar"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[var(--border)] bg-card px-4 py-3 shadow-2xl"
        style={{
          zIndex: MODAL_LAYER.minimizedTaskbar,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <span className="border-r border-[var(--border)] pr-3 text-[10px] font-bold uppercase tracking-wider text-muted">
          Minimized ({minimized.length})
        </span>

        {minimized.map((inst) => (
          <TaskbarPill
            key={inst.id}
            inst={inst}
            onRestore={() => restore(inst.id)}
            onClose={() => requestClose(inst.id)}
          />
        ))}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

const TaskbarPill: React.FC<{
  inst: ModalInstance;
  onRestore: () => void;
  onClose: () => void;
}> = ({ inst, onRestore, onClose }) => {
  const Icon = inst.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      style={{
        display: "flex",
        maxWidth: 220,
        cursor: "pointer",
        userSelect: "none",
        alignItems: "center",
        gap: 6,
        borderRadius: 10,
        border: "1.5px solid rgba(37,99,235,0.2)",
        background: hovered ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)",
        padding: "5px 10px 5px 8px",
        transition: "background 0.15s",
      }}
      onClick={onRestore}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {Icon && (
        <div
          style={{
            display: "flex",
            height: 20,
            width: 20,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            background: "var(--color-primary, #2563eb)",
          }}
        >
          <Icon style={{ height: 11, width: 11, color: "#fff" }} />
        </div>
      )}

      <span
        style={{
          flexShrink: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--color-primary, #2563eb)",
        }}
      >
        {inst.title}
      </span>

      <Maximize2
        style={{
          height: 10,
          width: 10,
          flexShrink: 0,
          color: "var(--color-primary, #2563eb)",
          opacity: 0.5,
        }}
      />

      <button
        type="button"
        title="Close"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        style={{
          marginLeft: 2,
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          border: "none",
          background: "none",
          padding: 0,
          color: "var(--color-primary, #2563eb)",
          opacity: 0.45,
          cursor: "pointer",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.opacity = "0.45";
        }}
      >
        <X style={{ height: 11, width: 11 }} />
      </button>
    </motion.div>
  );
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
  const {
    register,
    unregister,
    minimize,
    isMinimized,
    getModalLayer,
    isFocused,
    bringToFront,
    isInteractionLocked,
  } = useModalManager();
  const registered = useRef(false);

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
      onRequestClose: onClose,
    });
    registered.current = true;
  }, [icon, isOpen, modalId, onClose, register, subtitle, title, unregister]);

  useEffect(() => {
    return () => {
      if (registered.current) {
        unregister(modalId);
        registered.current = false;
      }
    };
  }, [modalId, unregister]);

  if (!isOpen) {
    return null;
  }

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
    if (!focused || typeof document === "undefined") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [focused]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <div
        className="erp-modal-backdrop"
        data-focused={focused ? "true" : "false"}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: backdropZIndex,
          cursor: !focused && !interactionLocked ? "pointer" : "default",
          background: focused ? "rgba(15, 23, 42, 0.32)" : "rgba(15, 23, 42, 0.1)",
          backdropFilter: focused ? "blur(2px)" : "none",
          transition: "background 0.2s ease, backdrop-filter 0.2s ease",
        }}
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !focused &&
            !interactionLocked
          ) {
            onFocus();
          }
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
          animate={{ opacity: 1, scale: focused ? 1 : 0.985, y: 0 }}
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
            transform: focused ? "scale(1)" : "scale(0.985)",
            transition: "box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease",
          }}
          onMouseDown={() => {
            if (!focused && !interactionLocked) {
              onFocus();
            }
          }}
        >
          <header
            className="relative overflow-hidden bg-primary px-4 py-3"
            style={{
              opacity: focused ? 1 : 0.9,
              transition: "opacity 0.2s ease",
            }}
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
                  title="Minimize"
                  className="group rounded-lg p-1.5 transition-all duration-200 hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMinimize();
                  }}
                >
                  <Minus className="h-4 w-4 text-white transition-transform duration-200 group-hover:scale-110" />
                </button>

                <button
                  type="button"
                  aria-label="Close"
                  className="group rounded-lg p-1.5 transition-all duration-200 hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose();
                  }}
                >
                  <X className="h-4 w-4 text-white transition-transform duration-200 group-hover:rotate-90" />
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
              className="flex flex-shrink-0 items-center justify-between border-t border-[var(--border)] bg-app px-4 py-3"
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
