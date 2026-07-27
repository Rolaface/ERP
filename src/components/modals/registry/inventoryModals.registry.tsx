import { lazy } from "react";
import type { ItemInitialData } from "../../inventory/ItemModal";
import { getInitialData, getRecordInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const ItemModal = lazy(() => import("../../inventory/ItemModal"));
const ItemsCategoryModal = lazy(() => import("../../inventory/ItemsCategoryModal"));
const WarehouseModal = lazy(() => import("../../inventory/WarehouseModal"));
const StockCorrectionModal = lazy(() => import("../../inventory/stock/Stockcorrectionmodal"));
const ImportInventoryModal = lazy(() => import("../../inventory/stock/inventoryimport"));

export const inventoryModalsRegistry: Record<string, ModalRenderFn> = {
  item: (modal, _context, { handleClose, handleSubmit }) => (
    <ItemModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getInitialData<ItemInitialData>(modal.initialData)}
      isEditMode={modal.isEdit}
    />
  ),

  itemCategory: (modal, context, { handleClose, handleSubmit }) => (
    <ItemsCategoryModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getRecordInitialData(modal.initialData)}
      isEditMode={modal.isEdit}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  warehouse: (modal, context, { handleClose, handleSubmit }) => (
    <WarehouseModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getRecordInitialData(modal.initialData)}
      isEditMode={modal.isEdit}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  stockCorrection: (modal, context, { handleClose, handleSubmit }) => {
    const d = getRecordInitialData(modal.initialData) ?? {};
    return (
      <StockCorrectionModal
        key={modal.id}
        modalId={modal.id}
        isOpen={true}
        onClose={handleClose}
        onSubmit={async (payload: unknown) => {
          await handleSubmit(payload);
        }}
        selectedBatch={d.selectedBatch ?? null}
        branchOptions={(d.branchOptions as any) ?? []}
        isViewMode={context?.isViewMode ?? false}
      />
    );
  },

  importInventory: (modal, _context, { handleClose, handleSubmit }) => (
    <ImportInventoryModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={async () => {
        await handleSubmit(undefined);
      }}
    />
  ),
};