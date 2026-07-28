import { useModalStore } from "../modalStore";
import { modalRegistry } from "../../components/modals/registry";

export function defineModal<TProps extends Record<string, unknown>>(
  type: string,
  Component: React.ComponentType<any>,
) {
  modalRegistry[type] = (modal: any, _context: any, { handleClose }: any) => (
    <Component
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      {...modal.initialData}
    />
  );

  return function open(props: TProps) {
    return useModalStore
      .getState()
      .openModal(type as any, props, false, undefined, undefined);
  };
}