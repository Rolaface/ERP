import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  useModalStore,
  openCustomerModal,
  ModalContext,
  MODAL_LAYER,
} from "../../store/modalStore";
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
import TaxTemplateModalComponent from "../inventory/TaxTemplateModal";

const GlobalModalHandler: React.FC = () => {
  const { modals, closeModal, getModalContext } = useModalStore();
  const { pending, completeQuickAdd, cancelQuickAdd } = useQuickAdd();

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

      case "taxTemplate":
        return (
          <TaxTemplateModalComponent
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
      <MinimizedDrawer />
    </>
  );
};

const MinimizedDrawer: React.FC = () => {
  const modals = useModalStore((state) => state.modals);
  const { restoreModal, closeModal } = useModalStore();

  const minimizedModals = useMemo(
    () => modals.filter((m) => m.minimized),
    [modals]
  );

  if (typeof document === "undefined" || minimizedModals.length === 0) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="minimized-drawer"
        initial={{ x: 64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 64, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="
          fixed
          flex flex-col justify-start items-center gap-1.5
          rounded-xl border border-[var(--border)]
          bg-card/98 backdrop-blur-md
          px-1.5 py-2
          shadow-lg shadow-black/10
          overflow-y-auto overflow-x-hidden
        "
        style={{
          zIndex: MODAL_LAYER.minimizedTaskbar,
          bottom: 24,
          right: 12,
          maxHeight: "60vh",
          width: 40,
          height: "auto",
        }}
      >
        {[...minimizedModals].reverse().map((inst) => (
          <DrawerChip
            key={inst.id}
            title={inst.meta?.title || inst.type}
            icon={inst.meta?.icon}
            onRestore={() => restoreModal(inst.id)}
            onClose={() => closeModal(inst.id)}
          />
        ))}

        <div className="border-t border-[var(--border)] mx-0.5 mt-0.5 pt-1.5 flex justify-center">
          <div
            className="flex items-center justify-center rounded-full bg-primary"
            style={{ width: 18, height: 18 }}
          >
            <span className="text-[9px] font-black text-white leading-none">
              {minimizedModals.length}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

interface DrawerChipProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRestore: () => void;
  onClose: () => void;
}

const DrawerChip: React.FC<DrawerChipProps> = ({
  title,
  icon: Icon,
  onRestore,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ x: 32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 32, opacity: 0 }}
      transition={{ duration: 0.13 }}
      className="relative group flex justify-center"
      title={title}
    >
      <button
        type="button"
        onClick={onRestore}
        className="
          flex h-8 w-8 items-center justify-center
          rounded-lg border border-primary/20 bg-primary/8
          transition-all duration-150
          hover:border-primary/40 hover:bg-primary/15
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        "
        aria-label={`Restore ${title}`}
      >
        {Icon ? (
          <Icon className="h-3.5 w-3.5 text-primary" />
        ) : (
          <span className="text-[10px] font-bold text-primary">
            {title.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      <span
        role="button"
        tabIndex={0}
        title={`Close ${title}`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            onClose();
          }
        }}
        className="
          absolute -top-1 -right-1
          hidden group-hover:flex
          h-3.5 w-3.5 items-center justify-center
          rounded-full bg-red-500 text-white
          cursor-pointer z-10
          transition-all duration-150
        "
      >
        <X className="h-2 w-2" />
      </span>
    </motion.div>
  );
};

export default GlobalModalHandler;