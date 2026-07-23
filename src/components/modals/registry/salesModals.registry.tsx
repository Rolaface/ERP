import { lazy } from "react";
import type { CustomerDetail } from "../../../types/customer";
import { getInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const CustomerModal = lazy(() => import("../../crm/CustomerModal"));
const InvoiceModal = lazy(() => import("../../sales/InvoiceModal"));
const ProformaInvoiceModal = lazy(() => import("../../sales/ProformaInvoiceModal"));
const QuotationModal = lazy(() => import("../../sales/QuotationModal"));
const SalesOrderModal = lazy(() => import("../../sales/SalesOrderModal"));
const CreditNoteModal = lazy(() => import("../../../views/Sales/CreateCreditNoteModal"));
const SalesDebitNoteModal = lazy(() => import("../../../views/Sales/CreateSalesDebitNoteModal"));
const DebitNoteModal = lazy(() => import("../../../views/Sales/createDebitNoteModal"));

export const salesModalsRegistry: Record<string, ModalRenderFn> = {
  customer: (modal, context, { handleClose, handleSubmit }) => (
    <CustomerModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getInitialData<CustomerDetail>(modal.initialData)}
      isEditMode={modal.isEdit}
    />
  ),

  invoice: (modal, context, { handleClose, handleSubmit }) => (
    <InvoiceModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),

  proforma: (modal, context, { handleClose, handleSubmit }) => (
    <ProformaInvoiceModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),

  quotation: (modal, context, { handleClose, handleSubmit }) => (
    <QuotationModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),

  salesOrder: (modal, context, { handleClose, handleSubmit }) => (
    <SalesOrderModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData}
      mode={modal.isEdit ? "edit" : "create"}
    />
  ),

  CreditNote: (modal, context, { handleClose, handleSubmit }) => (
    <CreditNoteModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData as string}
      isEdit={modal.isEdit}
    />
  ),

  SalesDebitNote: (modal, context, { handleClose, handleSubmit }) => (
    <SalesDebitNoteModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData as string}
      isEdit={modal.isEdit}
    />
  ),

  DebitNote: (modal, context, { handleClose, handleSubmit }) => (
    <DebitNoteModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={modal.initialData as string}
      isEdit={modal.isEdit}
    />
  ),
};