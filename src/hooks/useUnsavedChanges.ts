import { useCallback, useRef, useState, useMemo } from "react";
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
  const pendingConfirmationRef = useRef(false);

  const modals = useModalStore((state) => state.modals);
  const { bringToFront, restoreModal } = useModalStore();

  const topModalId = useMemo(() => {
    const visible = modals.filter((m) => !m.minimized);
    if (!visible.length) return null;
    return [...visible].sort((a, b) => b.focusOrder - a.focusOrder)[0].id;
  }, [modals]);

  const isMinimized = useCallback(
    (id: string) => {
      const modal = modals.find((m) => m.id === id);
      return modal?.minimized ?? false;
    },
    [modals]
  );

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  const restoreModalFocus = useCallback(
    (modalId?: string) => {
      const targetModalId = modalId || topModalId;
      if (!targetModalId) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (isMinimized(targetModalId)) {
          restoreModal(targetModalId);
        } else {
          bringToFront(targetModalId);
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

      if (pendingConfirmationRef.current) {
        return false;
      }

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
  };
};

export const useUnsavedChanges = useUnsavedChangesGuard;