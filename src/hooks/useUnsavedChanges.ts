import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModalStore } from "../store/modalStore";
import { showConfirm } from "../utils/alert";

interface UnsavedChangesGuardOptions {
  confirmTitle?: string;
  confirmMessage?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

interface ConfirmCloseOptions {
  onConfirmClose: () => void;
  modalId?: string;
  dirtyOverride?: boolean;
}

export const useUnsavedChangesGuard = (
  options: UnsavedChangesGuardOptions = {}
) => {
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  const readyRef = useRef(false);
  const pendingConfirmationRef = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const modals = useModalStore((state) => state.modals);
  const { bringToFront, restoreModal } = useModalStore();

  const topModalId = useMemo(() => {
    const visible = modals.filter((m) => !m.minimized);
    if (!visible.length) return null;
    return [...visible].sort((a, b) => b.focusOrder - a.focusOrder)[0].id;
  }, [modals]);

  const isMinimized = useCallback(
    (id: string) => modals.find((m) => m.id === id)?.minimized ?? false,
    [modals]
  );

  const markDirty = useCallback(() => {
    if (!readyRef.current) return;
    if (isDirtyRef.current) return;
    isDirtyRef.current = true;
    setIsDirty(true);
  }, []);

  const resetDirty = useCallback(() => {
    isDirtyRef.current = false;
    setIsDirty(false);
  }, []);

  const activate = useCallback(() => {
    const t = setTimeout(() => {
      readyRef.current = true;
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const deactivate = useCallback(() => {
    readyRef.current = false;
  }, []);

  useEffect(() => {
    const cleanup = activate();

    return () => {
      cleanup();
      deactivate();
      resetDirty();
    };
  }, [activate, deactivate, resetDirty]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("input", markDirty);
    el.addEventListener("change", markDirty);

    return () => {
      el.removeEventListener("input", markDirty);
      el.removeEventListener("change", markDirty);
    };
  }, [markDirty]);

  const restoreModalFocus = useCallback(
    (modalId?: string) => {
      const target = modalId ?? topModalId;
      if (!target) return;

      window.requestAnimationFrame(() => {
        if (isMinimized(target)) {
          restoreModal(target);
        } else {
          bringToFront(target);
        }
      });
    },
    [bringToFront, topModalId, isMinimized, restoreModal]
  );

  const confirmClose = useCallback(
    async ({ onConfirmClose, modalId, dirtyOverride }: ConfirmCloseOptions) => {
      const shouldConfirm = dirtyOverride ?? isDirty;

      if (!shouldConfirm) {
        onConfirmClose();
        return true;
      }

      if (pendingConfirmationRef.current) return false;

      pendingConfirmationRef.current = true;
      restoreModalFocus(modalId);

      try {
        const confirmed = await showConfirm(
          options.confirmMessage ??
            "You have unsaved changes. Do you really want to close?",
          {
            title: options.confirmTitle ?? "Discard unsaved changes?",
            confirmButtonText: options.confirmButtonText ?? "Discard",
            cancelButtonText: options.cancelButtonText ?? "Keep Editing",
          }
        );

        if (confirmed) {
          resetDirty();
          onConfirmClose();
          return true;
        }

        restoreModalFocus(modalId);
        return false;
      } finally {
        pendingConfirmationRef.current = false;
      }
    },
    [isDirty, options, resetDirty, restoreModalFocus]
  );

  const handleCloseWithConfirm = useCallback(
    async (onClose: () => void, modalId?: string) =>
      confirmClose({ onConfirmClose: onClose, modalId }),
    [confirmClose]
  );

  return {
    isDirty,
    setIsDirty,
    markDirty,
    resetDirty,
    confirmClose,
    handleCloseWithConfirm,
    containerRef,
    activate,
    deactivate,
  };
};

export const useUnsavedChanges = useUnsavedChangesGuard;
