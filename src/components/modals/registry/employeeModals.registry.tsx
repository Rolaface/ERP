import { lazy } from "react";
import type { ModalRenderFn } from "./registryTypes";

const EmployeeModal = lazy(() => import("../../Hr/employeedirectorymodal/AddEmployeeModal"));

export const employeeModalsRegistry: Record<string, ModalRenderFn> = {
  employee: (modal, _context, { handleClose, handleSubmit }) => (
    <EmployeeModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      editData={modal.isEdit ? modal.initialData : undefined}
      mode={modal.isEdit ? "edit" : "add"}
    />
  ),
};