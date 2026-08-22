import { lazy } from "react";
import { createShedular, editShedular } from "../../../api/schedulerApi";
import { getInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";
import type { SchedulerRecord } from "../../Schduler/SchedulerModal";

const SchedulerModal = lazy(() => import("../../Schduler/SchedulerModal"));

export const schedulerModalsRegistry: Record<string, ModalRenderFn> = {
  scheduler: (modal, context, { handleClose }) => (
    <SchedulerModal
      key={modal.id}
      modalId={modal.id}
      mode={modal.isEdit ? "edit" : context?.isViewMode ? "view" : "add"}
      record={getInitialData<SchedulerRecord>(modal.initialData) as any}
      onClose={handleClose}
      onSubmit={async (values: any) => {
        const record = getInitialData<SchedulerRecord>(modal.initialData) as any;
        if (record?.id) {
          await editShedular(record.id, values);
        } else {
          await createShedular(values);
        }
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),
};