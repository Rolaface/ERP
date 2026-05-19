import { useMemo } from "react";
import { useModalStore } from "../store/modalStore";

export const useMinimizedModals = () => {
  const modals = useModalStore((state) => state.modals);
  const restoreModal = useModalStore((state) => state.restoreModal);
  const closeModal = useModalStore((state) => state.closeModal);

  const minimizedModals = useMemo(
    () =>
      modals
        .filter((modal) => modal.minimized)
        .sort((a, b) => a.openedAt - b.openedAt),
    [modals],
  );

  return {
    minimizedModals,
    restoreModal,
    closeModal,
  };
};
