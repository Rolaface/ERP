import { lazy } from "react";
import type { ModalRenderFn } from "./registryTypes";

const JournalEntriesModal = lazy(() => import("../../JournalEntries/JournalEntriesModal"));

export const accountingModalsRegistry: Record<string, ModalRenderFn> = {
  JournalEntries: (modal, _context, { handleClose, handleSubmit }) => (
    <JournalEntriesModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
    />
  ),
};