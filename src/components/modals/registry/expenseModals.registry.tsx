import { lazy } from "react";
import type { ModalRenderFn } from "./registryTypes";

const ExpenseModal = lazy(() => import("../../expense/addExpenseModal"));
const ExpenseTypeModal = lazy(() => import("../../expense/addExpenseTypeModal"));
const EmployeeAdvanceModal = lazy(() => import("../../expense/addEmployeeAdvance"));

export const expenseModalsRegistry: Record<string, ModalRenderFn> = {
  expense: (modal, _context, { handleClose, handleSubmit }) => (
    <ExpenseModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
    />
  ),

  expenseType: (modal, _context, { handleClose, handleSubmit }) => (
    <ExpenseTypeModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
    />
  ),

  employeeAdvance: (modal, _context, { handleClose, handleSubmit }) => (
    <EmployeeAdvanceModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
    />
  ),
};