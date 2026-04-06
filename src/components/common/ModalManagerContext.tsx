/**
 * ModalManagerContext.tsx
 * Place at: src/components/common/ModalManagerContext.tsx
 *
 * Features:
 *  - Multiple modals open simultaneously (stacked)
 *  - Click any modal to bring it to front (focus management)
 *  - Each modal independently minimizable
 *  - Floating taskbar shows all minimized modals
 *  - Restoring a minimized modal brings it to front
 *  - Proper z-index stacking (no backdrop overlap issues)
 *  - State always preserved (never unmounted while open)
 *
 * Exports:
 *  ModalManagerProvider   → wrap AppLayout once
 *  MinimizableModal       → drop-in for <Modal>, add modalId + remove "if (!isOpen) return null" from your modal components
 *  useModalManager        → hook for direct access
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Maximize2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_Z = 50; // z-index of first modal backdrop
const Z_STEP = 10; // increment per stacked modal

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalInstance {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  minimized: boolean;
  openedAt: number;
  focusOrder: number; // higher = on top
}

interface ModalManagerCtx {
  instances: ModalInstance[];
  register: (inst: Omit<ModalInstance, "minimized" | "openedAt" | "focusOrder">) => void;
  unregister: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  bringToFront: (id: string) => void;
  isMinimized: (id: string) => boolean;
  getZIndex: (id: string) => number;
  isFocused: (id: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalManagerContext = createContext<ModalManagerCtx | null>(null);

export const useModalManager = (): ModalManagerCtx => {
  const ctx = useContext(ModalManagerContext);
  if (!ctx)
    throw new Error("useModalManager must be used inside <ModalManagerProvider>");
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ModalManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [instances, setInstances] = useState<ModalInstance[]>([]);
  const focusCounter = useRef(0);

  const register = useCallback(
    (inst: Omit<ModalInstance, "minimized" | "openedAt" | "focusOrder">) => {
      setInstances((prev) => {
        // already registered — just bring to front
        if (prev.find((m) => m.id === inst.id)) {
          focusCounter.current += 1;
          return prev.map((m) =>
            m.id === inst.id
              ? { ...m, minimized: false, focusOrder: focusCounter.current }
              : m
          );
        }
        focusCounter.current += 1;
        return [
          ...prev,
          {
            ...inst,
            minimized: false,
            openedAt: Date.now(),
            focusOrder: focusCounter.current,
          },
        ];
      });
    },
    []
  );

  const unregister = useCallback((id: string) => {
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
        m.id === id
          ? { ...m, minimized: false, focusOrder: focusCounter.current }
          : m
      );
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setInstances((prev) => {
      // Already on top — skip re-render
      const sorted = [...prev].sort((a, b) => b.focusOrder - a.focusOrder);
      if (sorted[0]?.id === id) return prev;

      focusCounter.current += 1;
      return prev.map((m) =>
        m.id === id ? { ...m, focusOrder: focusCounter.current } : m
      );
    });
  }, []);

  const isMinimized = useCallback(
    (id: string) => instances.find((m) => m.id === id)?.minimized ?? false,
    [instances]
  );

  // Compute z-index for a modal based on its focusOrder rank
  const getZIndex = useCallback(
    (id: string) => {
      const visible = instances
        .filter((m) => !m.minimized)
        .sort((a, b) => a.focusOrder - b.focusOrder);
      const rank = visible.findIndex((m) => m.id === id);
      return BASE_Z + rank * Z_STEP;
    },
    [instances]
  );

  const isFocused = useCallback(
    (id: string) => {
      const visible = instances.filter((m) => !m.minimized);
      if (visible.length === 0) return false;
      const top = visible.reduce((a, b) =>
        a.focusOrder > b.focusOrder ? a : b
      );
      return top.id === id;
    },
    [instances]
  );

  return (
    <ModalManagerContext.Provider
      value={{
        instances,
        register,
        unregister,
        minimize,
        restore,
        bringToFront,
        isMinimized,
        getZIndex,
        isFocused,
      }}
    >
      {children}
      <ModalTaskbar />
    </ModalManagerContext.Provider>
  );
};

// ─── Floating Taskbar ─────────────────────────────────────────────────────────

const ModalTaskbar: React.FC = () => {
  const { instances, restore, unregister } = useModalManager();
  const minimized = instances.filter((m) => m.minimized);

  return (
    <AnimatePresence>
      {minimized.length > 0 && (
        <motion.div
          key="taskbar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            // above all modals
            zIndex: BASE_Z + instances.length * Z_STEP + 100,
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "6px 10px",
            background: "var(--bg-card, #fff)",
            border: "1.5px solid var(--border, #e2e8f0)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted, #64748b)",
              textTransform: "uppercase",
              letterSpacing: 1,
              paddingRight: 8,
              borderRight: "1.5px solid var(--border, #e2e8f0)",
              marginRight: 4,
              whiteSpace: "nowrap",
            }}
          >
            Minimized ({minimized.length})
          </span>

          {minimized.map((inst) => (
            <TaskbarPill
              key={inst.id}
              inst={inst}
              onRestore={() => restore(inst.id)}
              onClose={() => unregister(inst.id)}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Taskbar Pill ─────────────────────────────────────────────────────────────

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
        alignItems: "center",
        gap: 6,
        padding: "5px 10px 5px 8px",
        borderRadius: 10,
        background: hovered ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)",
        border: "1.5px solid rgba(37,99,235,0.2)",
        cursor: "pointer",
        userSelect: "none" as const,
        maxWidth: 220,
        transition: "background 0.15s",
      }}
      onClick={onRestore}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {Icon && (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: "var(--color-primary, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 11, height: 11, color: "#fff" }} />
        </div>
      )}

      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--color-primary, #2563eb)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flexShrink: 1,
        }}
      >
        {inst.title}
      </span>

      <Maximize2
        style={{
          width: 10,
          height: 10,
          color: "var(--color-primary, #2563eb)",
          opacity: 0.5,
          flexShrink: 0,
        }}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Discard & close"
        style={{
          marginLeft: 2,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: "var(--color-primary, #2563eb)",
          opacity: 0.45,
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.45")}
      >
        <X style={{ width: 11, height: 11 }} />
      </button>
    </motion.div>
  );
};

// ─── MinimizableModal ─────────────────────────────────────────────────────────
/**
 * Drop-in for <Modal>. Add modalId. 
 *
 * IMPORTANT: Remove "if (!isOpen) return null" from the TOP of your
 * modal component (e.g. InvoiceModal). MinimizableModal handles
 * visibility itself so state is never lost.
 *
 * Usage:
 *   <MinimizableModal
 *     modalId="invoice-create"
 *     isOpen={isOpen}
 *     onClose={handleClose}
 *     title="Create Invoice"
 *     icon={FileText}
 *   >
 *     <InvoiceForm />
 *   </MinimizableModal>
 */

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
  const { register, unregister, minimize, isMinimized, getZIndex, isFocused, bringToFront } =
    useModalManager();

  const registered = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // register (or re-focus if already registered)
      register({ id: modalId, title, subtitle, icon });
      registered.current = true;
    } else if (!isOpen && registered.current) {
      unregister(modalId);
      registered.current = false;
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always clean up on unmount
  useEffect(() => {
    return () => {
      if (registered.current) {
        unregister(modalId);
        registered.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render anything if not open
  if (!isOpen) return null;

  const minimized = isMinimized(modalId);
  const zIndex = getZIndex(modalId);
  const focused = isFocused(modalId);

  const handleClose = () => {
    unregister(modalId);
    registered.current = false;
    onClose();
  };

  return (
    <>
      {/* Children hidden but mounted when minimized — state preserved */}
      {minimized && (
        <div style={{ display: "none" }} aria-hidden="true">
          {children}
        </div>
      )}

      {/* Visible modal shell */}
      {!minimized && (
        <ModalShell
          title={title}
          subtitle={subtitle}
          icon={icon}
          footer={footer}
          maxWidth={maxWidth}
          height={height}
          customWidth={customWidth}
          zIndex={zIndex}
          focused={focused}
          onClose={handleClose}
          onMinimize={() => minimize(modalId)}
          onFocus={() => bringToFront(modalId)}
        >
          {children}
        </ModalShell>
      )}
    </>
  );
};

// ─── ModalShell ───────────────────────────────────────────────────────────────

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
  zIndex: number;
  focused: boolean;
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
  zIndex,
  focused,
  onClose,
  onMinimize,
  onFocus,
}) => {
  return (
    <>
      {/*
        Backdrop: only the FOCUSED (top) modal shows a dark backdrop.
        Background modals show a very faint tint so you know they're there.
      */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: zIndex,
          background: focused
            ? "rgba(0,0,0,0.30)"
            : "rgba(0,0,0,0.08)",
          backdropFilter: focused ? "blur(1px)" : "none",
          transition: "background 0.2s",
          // Clicking the backdrop of a background modal brings it to front
          cursor: focused ? "default" : "pointer",
        }}
        onClick={(e) => {
          // Only trigger if clicking the backdrop itself, not the modal
          if (e.target === e.currentTarget) {
            if (!focused) {
              onFocus();
            }
          }
        }}
      />

      {/* Modal panel — sits above its own backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: zIndex + 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          pointerEvents: "none", // let backdrop clicks pass through
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{
            opacity: 1,
            scale: focused ? 1 : 0.98,
            y: 0,
          }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          // Re-enable pointer events on the modal itself
          style={{ pointerEvents: "auto" }}
          className={`w-full ${
            !customWidth ? MAX_WIDTH_CLASSES[maxWidth] ?? "max-w-4xl" : ""
          } bg-card flex flex-col border border-[var(--border)] rounded-2xl overflow-hidden`}
          style={{
            height,
            width: customWidth || undefined,
            maxWidth: customWidth ? "none" : undefined,
            // Focused modal: full shadow. Background: softer
            boxShadow: focused
              ? "0 25px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)"
              : "0 8px 24px rgba(0,0,0,0.10)",
            // Slightly scale down background modals for depth
            transform: focused ? "scale(1)" : "scale(0.985)",
            transition: "box-shadow 0.2s, transform 0.2s",
            pointerEvents: "auto",
          }}
          // Clicking anywhere on a background modal brings it to front
          onMouseDown={onFocus}
        >
          {/* ── Header ── */}
          <header
            className="relative overflow-hidden px-4 py-3 bg-primary flex-shrink-0"
            style={{
              // Slightly dim header of background modals
              opacity: focused ? 1 : 0.85,
              transition: "opacity 0.2s",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex items-center justify-between">
              {/* Title */}
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">{title}</h2>
                  {subtitle && (
                    <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Focused indicator dot + buttons */}
              <div className="flex items-center gap-1">
                {/* Subtle indicator that this modal is in background */}
                {!focused && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.6)",
                      marginRight: 6,
                      letterSpacing: 0.5,
                    }}
                  >
                    CLICK TO FOCUS
                  </span>
                )}

                {/* Minimize */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimize();
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                  aria-label="Minimize"
                  title="Minimize — your progress is saved"
                >
                  <Minus className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-200" />
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </header>

          {/* ── Content ── */}
          <section
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 bg-app text-sm text-main"
            style={{
              // Slightly dim content of background modals
              opacity: focused ? 1 : 0.7,
              transition: "opacity 0.2s",
              pointerEvents: focused ? "auto" : "none",
            }}
          >
            {children}
          </section>

          {/* ── Footer ── */}
          {footer && (
            <footer
              className="flex items-center justify-between px-4 py-3 bg-app border-t border-[var(--border)] flex-shrink-0"
              style={{
                opacity: focused ? 1 : 0.7,
                transition: "opacity 0.2s",
                pointerEvents: focused ? "auto" : "none",
              }}
            >
              {footer}
            </footer>
          )}
        </motion.div>
      </div>
    </>
  );
};