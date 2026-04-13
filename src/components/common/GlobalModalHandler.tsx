import React, { useEffect, useMemo, Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useModalStore, MODAL_LAYER } from "../../store/modalStore";
import type { ModalInstance, ModalType } from "../../store/modalStore";
import type { ModalSubmitHandler } from "../../types/modal";
import { useQuickAdd } from "../../context/QuickAddContext";
import type { CustomerDetail } from "../../types/customer";
import type { Supplier } from "../../types/Supply/supplier";
import type { ItemInitialData } from "../inventory/ItemModal";
import type { TaxCategoryFormData as TaxTemplateFormData } from "../../types/tax/taxTemplate";
import type { SalesTaxTemplateFormData } from "../../types/tax/salesTemplate";

const CustomerModal = lazy(() => import("../crm/CustomerModal"));
const SupplierModal = lazy(() => import("../procurement/supply/SupplierModal"));
const InvoiceModal = lazy(() => import("../sales/InvoiceModal"));
const ProformaInvoiceModal = lazy(() => import("../sales/ProformaInvoiceModal"));
const QuotationModal = lazy(() => import("../sales/QuotationModal"));
const PurchaseOrderModal = lazy(() => import("../procurement/PurchaseOrderModal"));
const PurchaseInvoiceModal = lazy(() => import("../procurement/PurchaseInvoiceModal"));
const ItemModal = lazy(() => import("../inventory/ItemModal"));
const ItemsCategoryModal = lazy(() => import("../inventory/ItemsCategoryModal"));
const WarehouseModal = lazy(() => import("../inventory/WarehouseModal"));
const TaxTemplateModalComponent = lazy(() => import("../../companies/taxMaintaince/TaxTemplateModal"));
const TaxCategoryModalComponent = lazy(() => import("../inventory/TaxCategoryModal"));
const SalesTaxTemplateModalComponent = lazy(() => import("../../companies/taxMaintaince/SalesTempleteModal"));

const modalFallback = (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getInitialData = <T,>(value: unknown): T | null =>
  isRecord(value) ? (value as T) : null;

const getRecordInitialData = (
  value: unknown,
): Record<string, unknown> | null => (isRecord(value) ? value : null);

const getModalSeedValue = (
  value: unknown,
  key: string,
): string | number | undefined => {
  if (!isRecord(value)) return undefined;
  const seedValue = value[key];
  return typeof seedValue === "string" || typeof seedValue === "number"
    ? seedValue
    : undefined;
};

const toQuickAddText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const GlobalModalHandler: React.FC = () => {
  const { modals, closeModal, getModalContext } = useModalStore();
  const { pending, completeQuickAdd, cancelQuickAdd } = useQuickAdd();

  useEffect(() => {
    if (pending) {
      const entityTypeMap: Partial<Record<string, ModalType>> = {
        invoice: "invoice",
        proforma: "proforma",
        quotation: "quotation",
        purchaseOrder: "purchaseOrder",
        purchaseInvoice: "purchaseInvoice",
        customer: "customer",
        supplier: "supplier",
        item: "item",
        customerGroup: "itemCategory",
        taxTemplate: "taxTemplate",
        taxCategory: "taxCategory",
      };

      const modalType = entityTypeMap[pending.entityType];
      if (modalType) {
        useModalStore.getState().openModal(modalType, null, false, {
          source: "quickAdd",
          fieldId: pending.fieldId,
          callback: pending.callback,
          onSuccess: (data) => {
            if (!isRecord(data)) return;
            completeQuickAdd({
              id: toQuickAddText(data.id || data.customerId),
              name: toQuickAddText(data.name),
            });
          },
        });
      }
    }
  }, [pending, completeQuickAdd]);

  const renderModal = (modal: ModalInstance) => {
    const context = getModalContext(modal.id);

    const handleClose = () => {
      if (context?.source === "quickAdd") {
        cancelQuickAdd();
      }
      closeModal(modal.id);
    };

    const handleSubmit: ModalSubmitHandler = async (data) => {
      await context?.onSuccess?.(data);
      await context?.callback?.(data);
      closeModal(modal.id);
      return true;
    };

    const wrappedModal = (modalContent: React.ReactNode) => (
      <Suspense fallback={modalFallback}>
        {modalContent}
      </Suspense>
    );

    switch (modal.type) {
      case "customer":
        return wrappedModal(
          <CustomerModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<CustomerDetail>(modal.initialData)}
            isEditMode={modal.isEdit}
          />
        );

      case "supplier":
        return wrappedModal(
          <SupplierModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<Supplier>(modal.initialData)}
            isEditMode={modal.isEdit}
          />
        );

      case "invoice":
        return wrappedModal(
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
        return wrappedModal(
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
        return wrappedModal(
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
        return wrappedModal(
          <PurchaseOrderModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            poId={getModalSeedValue(modal.initialData, "poId")}
          />
        );

      case "purchaseInvoice":
        return wrappedModal(
          <PurchaseInvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            pId={getModalSeedValue(modal.initialData, "pId")}
          />
        );

      case "item":
        return wrappedModal(
          <ItemModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<ItemInitialData>(modal.initialData)}
            isEditMode={modal.isEdit}
          />
        );

      case "itemCategory":
        return wrappedModal(
          <ItemsCategoryModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getRecordInitialData(modal.initialData)}
            isEditMode={modal.isEdit}
          />
        );

      case "taxTemplate":
        return wrappedModal(
          <TaxTemplateModalComponent
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<TaxTemplateFormData>(modal.initialData)}
            isEditMode={modal.isEdit}
          />
        );

      case "warehouse":
        return wrappedModal(
          <WarehouseModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getRecordInitialData(modal.initialData)}
            isEditMode={modal.isEdit}
          />
        );

      case "taxCategory":
        return wrappedModal(
          <TaxCategoryModalComponent
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={async (data) => {
              await handleSubmit(data);
            }}
          />
        );
      case "salesTax":
        return wrappedModal(
          <SalesTaxTemplateModalComponent
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<SalesTaxTemplateFormData>(
              modal.initialData,
            )}
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
    [modals],
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
    document.body,
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
