import { useState, useCallback } from "react";
import { showConfirm } from "../utils/alert";
import { useModalManager } from "../components/common/ModalManagerContext";

export const useUnsavedChanges = () => {
  const [isDirty, setIsDirty] = useState(false);
  const { bringToFront, getTopModalId } = useModalManager();

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  const handleCloseWithConfirm = useCallback(
    async (onClose: () => void, currentModalId?: string) => {
      if (isDirty) {
        const confirmed = await showConfirm(
          "You have unsaved changes. Do you really want to close?"
        );
        if (confirmed) {
          resetDirty();
          onClose();
        } else {
          const modalId = currentModalId || getTopModalId();
          if (modalId) {
            setTimeout(() => bringToFront(modalId), 10);
          }
        }
      } else {
        onClose();
      }
    },
    [isDirty, resetDirty, bringToFront, getTopModalId]
  );

  return {
    isDirty,
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
  };
};