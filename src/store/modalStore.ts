import { create } from "zustand";

export type ModalType = 
  | "invoice" 
  | "proforma" 
  | "quotation" 
  | "customer" 
  | "supplier" 
  | "purchaseOrder" 
  | "purchaseInvoice" 
  | "item" 
  | "itemCategory";

export interface ModalInstance {
  id: string;
  type: ModalType;
  initialData?: any;
  isEdit: boolean;
  context?: ModalContext;
}

export interface ModalContext {
  source?: string;
  fieldId?: string;
  callback?: (data: any) => void;
  onSuccess?: (data: any) => void;
}

interface ModalState {
  modals: ModalInstance[];
  activeModalId: string | null;
  
  // Modal operations
  openModal: (type: ModalType, initialData?: any, isEdit?: boolean, context?: ModalContext) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  getModalById: (id: string) => ModalInstance | undefined;
  getModalsByType: (type: ModalType) => ModalInstance[];
  
  // Context operations (for QuickAdd flow)
  setModalContext: (id: string, context: ModalContext) => void;
  clearModalContext: (id: string) => void;
  getModalContext: (id: string) => ModalContext | undefined;
  
  // Utility
  isModalOpen: (type: ModalType) => boolean;
}

export const useModalStore = create<ModalState>((set, get) => ({
  modals: [],
  activeModalId: null,

  openModal: (type, initialData, isEdit = false, context) => {
    const id = `${type}-${Date.now()}`;
    const newModal: ModalInstance = {
      id,
      type,
      initialData,
      isEdit,
      context,
    };
    
    set((state) => ({
      modals: [...state.modals, newModal],
      activeModalId: id,
    }));
    
    return id;
  },

  closeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
      activeModalId: state.activeModalId === id 
        ? state.modals.find((m) => m.id !== id)?.id || null 
        : state.activeModalId,
    }));
  },

  closeAllModals: () => {
    set({ modals: [], activeModalId: null });
  },

  getModalById: (id) => {
    return get().modals.find((m) => m.id === id);
  },

  getModalsByType: (type) => {
    return get().modals.filter((m) => m.type === type);
  },

  setModalContext: (id, context) => {
    set((state) => ({
      modals: state.modals.map((m) =>
        m.id === id ? { ...m, context } : m
      ),
    }));
  },

  clearModalContext: (id) => {
    set((state) => ({
      modals: state.modals.map((m) =>
        m.id === id ? { ...m, context: undefined } : m
      ),
    }));
  },

  getModalContext: (id) => {
    return get().modals.find((m) => m.id === id)?.context;
  },

  isModalOpen: (type) => {
    return get().modals.some((m) => m.type === type);
  },
}));

// Convenience hooks for specific modal types
export const useCustomerModals = () => useModalStore((s) => s.getModalsByType("customer"));
export const useSupplierModals = () => useModalStore((s) => s.getModalsByType("supplier"));
export const useInvoiceModals = () => useModalStore((s) => s.getModalsByType("invoice"));
export const useQuotationModals = () => useModalStore((s) => s.getModalsByType("quotation"));
export const useItemModals = () => useModalStore((s) => s.getModalsByType("item"));

// Action creators for opening modals
export const openCustomerModal = (initialData?: any, isEdit = false, context?: ModalContext) =>
  useModalStore.getState().openModal("customer", initialData, isEdit, context);

export const openSupplierModal = (initialData?: any, isEdit = false, context?: ModalContext) =>
  useModalStore.getState().openModal("supplier", initialData, isEdit, context);

export const openInvoiceModal = (initialData?: any, isEdit = false, context?: ModalContext) =>
  useModalStore.getState().openModal("invoice", initialData, isEdit, context);

export const openQuotationModal = (initialData?: any, isEdit = false, context?: ModalContext) =>
  useModalStore.getState().openModal("quotation", initialData, isEdit, context);

export const openItemModal = (initialData?: any, isEdit = false, context?: ModalContext) =>
  useModalStore.getState().openModal("item", initialData, isEdit, context);

export const openItemCategoryModal = (initialData?: any, isEdit = false, context?: ModalContext) =>
  useModalStore.getState().openModal("itemCategory", initialData, isEdit, context);

export const openPurchaseOrderModal = (poId?: string | number, context?: ModalContext) =>
  useModalStore.getState().openModal("purchaseOrder", { poId }, !!poId, context);

export const openPurchaseInvoiceModal = (pId?: string | number, context?: ModalContext) =>
  useModalStore.getState().openModal("purchaseInvoice", { pId }, !!pId, context);

export const openProformaModal = (initialData?: any, isEdit = false, context?: ModalContext) =>
  useModalStore.getState().openModal("proforma", initialData, isEdit, context);
