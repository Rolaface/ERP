import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ModalProps {
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
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = "4xl",
  height = "520px",
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`w-full ${maxWidthClasses[maxWidth]} bg-card shadow-2xl flex flex-col border border-[var(--border)] rounded-2xl overflow-hidden`}
          style={{ height }}
        >
          {/* Header with Gradient */}
          <header className="relative overflow-hidden px-4 py-3 bg-primary flex-shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </header>

          {/* Content Area */}
          <section className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 bg-app text-sm text-main">
            {children}
          </section>

          {/* Footer (if provided) */}
          {footer && (
            <footer className="flex items-center justify-between px-4 py-3 bg-app border-t border-[var(--border)] flex-shrink-0">
              {footer}
            </footer>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Modal;
