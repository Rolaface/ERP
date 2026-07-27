import type { ModalContext, ModalInstance } from "../../../store/modalStore";
import type { ModalSubmitHandler } from "../../../types/modal";

export interface RenderHelpers {
  handleClose: () => void;
  handleSubmit: ModalSubmitHandler;
}

export type ModalRenderFn = (
  modal: ModalInstance,
  context: ModalContext | undefined,
  helpers: RenderHelpers,
) => React.ReactNode;