import { lazy } from "react";
import type { Supplier } from "../../../types/Supply/supplier";
import { getInitialData, getModalSeedValue } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const SupplierModal = lazy(() => import("../../procurement/supply/SupplierModal"));
const PurchaseOrderModal = lazy(() => import("../../procurement/PurchaseOrderModal"));
const PurchaseInvoiceModal = lazy(() => import("../../procurement/PurchaseInvoiceModal"));
const RfqModal = lazy(() => import("../../procurement/rfq/RfqModal"));
const ScanPIModal = lazy(() => import("../../../views/Procurement/ScanPurchaseInvoiceModal"));

export const procurementModalsRegistry: Record<string, ModalRenderFn> = {
  supplier: (modal, _context, { handleClose, handleSubmit }) => (
    <SupplierModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getInitialData<Supplier>(modal.initialData)}
      isEditMode={modal.isEdit}
    />
  ),

  purchaseOrder: (modal, _context, { handleClose, handleSubmit }) => (
    <PurchaseOrderModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      poId={getModalSeedValue(modal.initialData, "poId")}
    />
  ),

  purchaseInvoice: (modal, _context, { handleClose, handleSubmit }) => (
    <PurchaseInvoiceModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      pId={getModalSeedValue(modal.initialData, "pId")}
    />
  ),

  Rfq: (modal, context, { handleClose, handleSubmit }) => (
    <RfqModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData as string}
      isEdit={modal.isEdit}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  scanPI: (modal, _context, { handleClose }) => (
    <ScanPIModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      piId={getModalSeedValue(modal.initialData, "pId") as string | undefined}
    />
  ),
};