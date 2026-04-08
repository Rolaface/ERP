import React, { useEffect } from "react";
import { useModalStore, openCustomerModal, ModalContext } from "../../store/modalStore";
import { useQuickAdd } from "../../context/QuickAddContext";

import CustomerModal from "../crm/CustomerModal";
import SupplierModal from "../procurement/supply/SupplierModal";
import InvoiceModal from "../sales/InvoiceModal";
import ProformaInvoiceModal from "../sales/ProformaInvoiceModal";
import QuotationModal from "../sales/QuotationModal";
import PurchaseOrderModal from "../procurement/PurchaseOrderModal";
import PurchaseInvoiceModal from "../procurement/PurchaseInvoiceModal";
import ItemModal from "../inventory/ItemModal";
import ItemsCategoryModal from "../inventory/ItemsCategoryModal";

const GlobalModalHandler: React.FC = () => {
  const { modals, closeModal, getModalContext } = useModalStore();
  const { pending, completeQuickAdd, cancelQuickAdd } = useQuickAdd();

  // Handle QuickAdd - when pending entity exists, open corresponding modal
  useEffect(() => {
    if (pending) {
      const entityTypeMap: Record<string, string> = {
        customer: "customer",
        supplier: "supplier",
        item: "item",
        customerGroup: "itemCategory",
      };
      
      const modalType = entityTypeMap[pending.entityType];
      if (modalType) {
        openCustomerModal(null, false, {
          source: "quickAdd",
          fieldId: pending.fieldId,
          callback: pending.callback,
          onSuccess: (data) => {
            completeQuickAdd({ id: data.id || data.customerId, name: data.name });
          },
        });
      }
    }
  }, [pending, completeQuickAdd]);

  const renderModal = (modal: typeof modals[0]) => {
    const context = getModalContext(modal.id);
    
    const handleClose = () => {
      if (context?.source === "quickAdd") {
        cancelQuickAdd();
      }
      closeModal(modal.id);
    };

    const handleSubmit = (data: any) => {
      if (context?.onSuccess) {
        context.onSuccess(data);
      }
      if (context?.callback) {
        context.callback(data);
      }
      closeModal(modal.id);
    };

    switch (modal.type) {
      case "customer":
        return (
          <CustomerModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
            isEditMode={modal.isEdit}
          />
        );

      case "supplier":
        return (
          <SupplierModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
            isEditMode={modal.isEdit}
          />
        );

      case "invoice":
        return (
          <InvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
          />
        );

      case "proforma":
        return (
          <ProformaInvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
          />
        );

      case "quotation":
        return (
          <QuotationModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
          />
        );

      case "purchaseOrder":
        return (
          <PurchaseOrderModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            poId={modal.initialData?.poId}
          />
        );

      case "purchaseInvoice":
        return (
          <PurchaseInvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            pId={modal.initialData?.pId}
          />
        );

      case "item":
        return (
          <ItemModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
            isEditMode={modal.isEdit}
          />
        );

      case "itemCategory":
        return (
          <ItemsCategoryModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
            isEditMode={modal.isEdit}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {modals.map((modal) => renderModal(modal))}
    </>
  );
};

export default GlobalModalHandler;