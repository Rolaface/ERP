import { useCallback, useRef, useState } from "react";
import { useModalManager } from "../components/common/ModalManagerContext";
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
  const {
    bringToFront,
    getTopModalId,
    isMinimized,
    restore,
  } = useModalManager();

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  const restoreModalFocus = useCallback(
    (modalId?: string) => {
      const targetModalId = modalId || getTopModalId();
      if (!targetModalId) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (isMinimized(targetModalId)) {
          restore(targetModalId);
        } else {
          bringToFront(targetModalId);
        }
      });
    },
    [bringToFront, getTopModalId, isMinimized, restore]
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
