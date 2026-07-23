import { lazy } from "react";
import type { FeedbackRow } from "../../Hr/performance/section/AddFeedbackModal";
import type { SetupRow } from "../../../views/hr/performace/types";
import { getInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const AddKRAModal = lazy(() => import("../../Hr/performance/section/AddKRAModal"));
const AddFeedbackModal = lazy(() => import("../../Hr/performance/section/AddFeedbackModal"));
const NewCycleModal = lazy(() => import("../../Hr/performance/Newcyclemodal"));
const AppraisalModal = lazy(() => import("../../Hr/performance/AppraisalFormModal"));
const FeedbackModal = lazy(() => import("../../Hr/performance/FeedbackModal"));

export const performanceModalsRegistry: Record<string, ModalRenderFn> = {
  KRA: (modal, context, { handleClose }) => (
    <AddKRAModal
      key={modal.id}
      modalId={modal.id}
      selectedKRA={getInitialData<SetupRow>(modal.initialData)}
      isViewMode={modal.context?.isViewMode ?? false}
      onClose={handleClose}
      onAdd={(row: any) => {
        if (context?.onSuccess) context.onSuccess(row);
        handleClose();
      }}
    />
  ),

  feedback: (modal, context, { handleClose }) => (
    <AddFeedbackModal
      key={modal.id}
      modalId={modal.id}
      selectedFeedback={getInitialData<FeedbackRow>(modal.initialData)}
      isViewMode={modal.context?.isViewMode ?? false}
      onClose={handleClose}
      onAdd={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),

  appraisalCycle: (modal, context, { handleClose }) => (
    <NewCycleModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSave={async (payload: unknown) => {
        if (context?.onSubmit) await context.onSubmit(payload);
        handleClose();
      }}
    />
  ),

  appraisal: (modal, _context, { handleClose, handleSubmit }) => (
    <AppraisalModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),

  employeeFeedback: (modal, _context, { handleClose, handleSubmit }) => (
    <FeedbackModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),
};