export type ModalSubmitHandler<TData = unknown> = (
  data: TData,
) => Promise<boolean>;

export type ModalCallback<TData = unknown> = (
  data: TData,
) => void | Promise<void>;

export interface StandardModalProps<TData = unknown, TInitialData = unknown> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler<TData>;
  initialData?: TInitialData | null;
  isEditMode?: boolean;
  isViewMode?: boolean;
  modalId?: string;
}

export interface ModalValidationError<TTab extends string = string> {
  tab: TTab;
  field?: string;
  message: string;
}
