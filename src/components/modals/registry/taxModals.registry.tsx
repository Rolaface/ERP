import { lazy } from "react";
import type { TaxCategoryFormData as TaxTemplateFormData } from "../../../types/tax/taxTemplate";
import type { SalesTaxTemplateFormData } from "../../../types/tax/salesTemplate";
import { getInitialData, isRecord } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const TaxTemplateModalComponent = lazy(() => import("../../../companies/taxMaintaince/TaxTemplateModal"));
const TaxCategoryModalComponent = lazy(() => import("../../inventory/TaxCategoryModal"));
const SalesTaxTemplateModalComponent = lazy(() => import("../../../companies/taxMaintaince/SalesTempleteModal"));

export const taxModalsRegistry: Record<string, ModalRenderFn> = {
  taxTemplate: (modal, context, { handleClose, handleSubmit }) => (
    <TaxTemplateModalComponent
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getInitialData<TaxTemplateFormData>(modal.initialData)}
      isEditMode={modal.isEdit}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  taxCategory: (modal, context, { handleClose, handleSubmit }) => (
    <TaxCategoryModalComponent
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      isViewMode={context?.isViewMode ?? false}
      initialData={
        isRecord(modal.initialData)
          ? {
              title: modal.initialData.title as string,
              disabled: modal.initialData.disabled as boolean,
            }
          : null
      }
      onSubmit={async (data: unknown) => {
        await handleSubmit(data);
        return true;
      }}
    />
  ),

  salesTax: (modal, context, { handleClose, handleSubmit }) => (
    <SalesTaxTemplateModalComponent
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getInitialData<SalesTaxTemplateFormData>(modal.initialData)}
      isEditMode={modal.isEdit}
      isViewMode={context?.isViewMode ?? false}
    />
  ),
};