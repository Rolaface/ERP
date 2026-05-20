import React from "react";
import { Maximize2, X } from "lucide-react";
import { motion } from "framer-motion";
import type { ModalInstance } from "../../store/modalStore";

interface MinimizedModalCardProps {
  modal: ModalInstance;
  onRestore: () => void;
  onClose: () => void;
}

export const MinimizedModalCard: React.FC<MinimizedModalCardProps> = ({
  modal,
  onRestore,
  onClose,
}) => {
  const Icon = modal.meta?.icon;
  const title = modal.meta?.title || modal.type;
  const subtitle = modal.meta?.subtitle || (modal.isEdit ? "Edit" : "Create");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 18, scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="
        group flex h-10 w-56 shrink-0 items-center gap-2 rounded-lg border border-[var(--border)]
        bg-card/95 px-2 text-left shadow-lg shadow-black/10 backdrop-blur-md sm:w-full
        transition-colors duration-150 hover:border-primary/35 hover:bg-card
      "
    >
      <button
        type="button"
        onClick={onRestore}
        className="
          flex min-w-0 flex-1 items-center gap-3 rounded-md text-left
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45
        "
        aria-label={`Restore ${title}`}
        title={title}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {Icon ? (
            <Icon className="h-3.5 w-3.5" />
          ) : (
            <span className="text-xs font-semibold">
              {title.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-main">
            {title}
          </span>
          <span className="block truncate text-[10px] leading-3 text-muted">
            {subtitle}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onRestore}
        className="
          flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted
          transition-colors hover:bg-primary/10 hover:text-primary
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45
        "
        aria-label={`Restore ${title}`}
        title={`Restore ${title}`}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="
          flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted
          transition-colors hover:bg-red-500/10 hover:text-red-600
          focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35
        "
        aria-label={`Close ${title}`}
        title={`Close ${title}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
};
