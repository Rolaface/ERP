import { lazy } from "react";
import { useDataRefreshStore, REFRESH_KEYS } from "../../../store/dataRefreshStore";
import { getRecordInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const AddassetCategory = lazy(() => import("../../FixedAsset/AssetCategoryModal"));
const AddAssetModal = lazy(() => import("../../FixedAsset/AddAssetModal"));
const AddAssetMovementModal = lazy(() => import("../../FixedAsset/Addassetmovementmodal "));

export const fixedAssetModalsRegistry: Record<string, ModalRenderFn> = {
  assetCategory: (modal, context, { handleClose, handleSubmit }) => (
    <AddassetCategory
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={async (data: unknown) => {
        await handleSubmit(data);
        useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.ASSET_CATEGORY_LIST);
      }}
      initialData={getRecordInitialData(modal.initialData)}
      isEdit={modal.isEdit}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  fixedAsset: (modal, _context, { handleClose, handleSubmit }) => (
    <AddAssetModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getRecordInitialData(modal.initialData) as any}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),

  assetMovement: (modal, _context, { handleClose, handleSubmit }) => (
    <AddAssetMovementModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getRecordInitialData(modal.initialData) as any}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),
};