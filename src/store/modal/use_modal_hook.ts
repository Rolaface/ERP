import { create } from "zustand";
import type {
  ModalType,
  ModalContext,
  ModalMeta,
  ModalInstance,
  ModalLayerPosition,
} from "../../types/modal_store_types/modalTypes";
import { MODAL_LAYER } from "../../types/modal_store_types/modalTypes";

let modalIdCounter = 0;

const createModalId = (type: ModalType) => {
  modalIdCounter += 1;
  const randomSuffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${modalIdCounter}`;

  return `${type}-${randomSuffix}`;
};

interface ModalState {
  modals: ModalInstance[];
  activeModalId: string | null;
  swalDepth: number;
  focusCounter: number;

  openModal: (
    type: ModalType,
    initialData?: unknown,
    isEdit?: boolean,
    context?: ModalContext,
    meta?: ModalMeta,
  ) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  registerModalMeta: (id: string, meta: ModalMeta) => void;
  unregisterModalMeta: (id: string) => void;

  minimizeModal: (id: string) => void;
  restoreModal: (id: string) => void;
  bringToFront: (id: string) => void;

  isMinimized: (id: string) => boolean;
  isFocused: (id: string) => boolean;
  getTopModalId: () => string | null;
  getModalLayer: (id: string) => ModalLayerPosition;
  getModalById: (id: string) => ModalInstance | undefined;
  getModalsByType: (type: ModalType) => ModalInstance[];

  setModalContext: (id: string, context: ModalContext) => void;
  clearModalContext: (id: string) => void;
  getModalContext: (id: string) => ModalContext | undefined;

  isModalOpen: (type: ModalType) => boolean;
  isInteractionLocked: () => boolean;

  incrementSwalDepth: () => void;
  decrementSwalDepth: () => void;

  getVisibleModals: () => ModalInstance[];
  getMinimizedModals: () => ModalInstance[];
}

export const useModalStore = create<ModalState>((set, get) => ({
  modals: [],
  activeModalId: null,
  swalDepth: 0,
  focusCounter: 0,

  openModal: (type, initialData, isEdit = false, context, meta) => {
    const id = createModalId(type);

    set((state) => {
      const nextFocusOrder = state.focusCounter + 1;
      const openedAt = Date.now();
      const newModal: ModalInstance = {
        id,
        type,
        initialData,
        isEdit,
        context,
        meta,
        minimized: false,
        openedAt,
        focusOrder: nextFocusOrder,
      };

      return {
        modals: [...state.modals, newModal],
        activeModalId: id,
        focusCounter: nextFocusOrder,
      };
    });

    return id;
  },

  closeModal: (id) => {
    set((state) => {
      const remaining = state.modals.filter((m) => m.id !== id);
      const visibleModals = remaining.filter((m) => !m.minimized);
      const newActiveId =
        state.activeModalId === id
          ? visibleModals.length > 0
            ? visibleModals.sort((a, b) => b.focusOrder - a.focusOrder)[0].id
            : null
          : state.activeModalId;

      return {
        modals: remaining,
        activeModalId: newActiveId,
      };
    });
  },

  closeAllModals: () => {
    set({ modals: [], activeModalId: null });
  },

  registerModalMeta: (id, meta) => {
    set((state) => ({
      modals: state.modals.map((m) =>
        m.id === id
          ? {
              ...m,
              meta: {
                title: meta.title,
                subtitle: meta.subtitle,
                icon: meta.icon,
                onRequestClose: meta.onRequestClose,
              },
            }
          : m,
      ),
    }));
  },

  unregisterModalMeta: (id) => {
    set((state) => ({
      modals: state.modals.map((m) =>
        m.id === id ? { ...m, meta: undefined } : m,
      ),
    }));
  },

  minimizeModal: (id) => {
    set((state) => ({
      modals: state.modals.map((m) =>
        m.id === id ? { ...m, minimized: true } : m,
      ),
    }));
  },

  restoreModal: (id) => {
    set((state) => {
      const newFocusOrder = state.focusCounter + 1;
      return {
        focusCounter: newFocusOrder,
        activeModalId: id,
        modals: state.modals.map((m) =>
          m.id === id
            ? { ...m, minimized: false, focusOrder: newFocusOrder }
            : m,
        ),
      };
    });
  },

  bringToFront: (id) => {
    set((state) => {
      const visible = state.modals.filter((m) => !m.minimized);
      const topVisible = [...visible].sort(
        (a, b) => b.focusOrder - a.focusOrder,
      )[0];

      if (!topVisible || topVisible.id === id) {
        return state;
      }

      const newFocusOrder = state.focusCounter + 1;
      return {
        focusCounter: newFocusOrder,
        modals: state.modals.map((m) =>
          m.id === id
            ? { ...m, minimized: false, focusOrder: newFocusOrder }
            : m,
        ),
      };
    });
  },

  isMinimized: (id) => {
    const modal = get().modals.find((m) => m.id === id);
    return modal?.minimized ?? false;
  },

  isFocused: (id) => {
    const state = get();
    const visible = state.modals.filter((m) => !m.minimized);
    if (!visible.length) return false;
    const top = [...visible].sort((a, b) => b.focusOrder - a.focusOrder)[0];
    return top.id === id;
  },

  getTopModalId: () => {
    const state = get();
    const visible = state.modals.filter((m) => !m.minimized);
    if (!visible.length) return null;
    return [...visible].sort((a, b) => b.focusOrder - a.focusOrder)[0].id;
  },

  getModalLayer: (id) => {
    const state = get();
    const visible = state.modals
      .filter((m) => !m.minimized)
      .sort((a, b) => a.focusOrder - b.focusOrder);
    const rank = Math.max(
      visible.findIndex((m) => m.id === id),
      0,
    );
    const backdrop =
      MODAL_LAYER.modalBackdropBase + rank * MODAL_LAYER.modalStep;
    return {
      backdrop,
      panel: backdrop + MODAL_LAYER.modalPanelOffset,
    };
  },

  getModalById: (id) => {
    return get().modals.find((m) => m.id === id);
  },

  getModalsByType: (type) => {
    return get().modals.filter((m) => m.type === type);
  },

  setModalContext: (id, context) => {
    set((state) => ({
      modals: state.modals.map((m) => (m.id === id ? { ...m, context } : m)),
    }));
  },

  clearModalContext: (id) => {
    set((state) => ({
      modals: state.modals.map((m) =>
        m.id === id ? { ...m, context: undefined } : m,
      ),
    }));
  },

  getModalContext: (id) => {
    return get().modals.find((m) => m.id === id)?.context;
  },

  isModalOpen: (type) => {
    return get().modals.some((m) => m.type === type);
  },

  isInteractionLocked: () => {
    return get().swalDepth > 0;
  },

  incrementSwalDepth: () => {
    set((state) => ({ swalDepth: state.swalDepth + 1 }));
  },

  decrementSwalDepth: () => {
    set((state) => ({ swalDepth: Math.max(state.swalDepth - 1, 0) }));
  },

  getVisibleModals: () => {
    return get().modals.filter((m) => !m.minimized);
  },

  getMinimizedModals: () => {
    return get().modals.filter((m) => m.minimized);
  },
}));

export const useVisibleModals = () =>
  useModalStore((state) => state.getVisibleModals());
export const useMinimizedModals = () =>
  useModalStore((state) => state.getMinimizedModals());
export const useModalMeta = (id: string) =>
  useModalStore((state) => state.getModalById(id)?.meta);
