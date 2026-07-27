import { lazy } from "react";
import { getInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const DepartmentModal = lazy(() =>
  import("../../empployeesetupmodal/DepartmentModal").then((m) => ({
    default: m.DepartmentModal,
  })),
);
const DesignationModal = lazy(() =>
  import("../../empployeesetupmodal/DesignationModal").then((m) => ({
    default: m.DesignationModal,
  })),
);
const GradeModal = lazy(() =>
  import("../../empployeesetupmodal/GradeModal").then((m) => ({
    default: m.GradeModal,
  })),
);
const EmployeeTypeModal = lazy(() =>
  import("../../empployeesetupmodal/EmployeeTypeModal").then((m) => ({
    default: m.EmployeeTypeModal,
  })),
);

export const employeeSetupModalsRegistry: Record<string, ModalRenderFn> = {
  department: (modal, context, { handleClose }) => (
    <DepartmentModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),

  designation: (modal, context, { handleClose }) => (
    <DesignationModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),

  grade: (modal, context, { handleClose }) => (
    <GradeModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),

  employeeType: (modal, context, { handleClose }) => (
    <EmployeeTypeModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),
};