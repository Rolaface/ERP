import { convertDocument } from "../utils/documentConversion";
import { DOCUMENT_CONVERSIONS, ConversionKey } from "../utils/documentConversionConfigs";
import type { ModalContext } from "../store/modalStore";

export function useDocumentConversion(key: ConversionKey) {
  const config = DOCUMENT_CONVERSIONS[key];

  return (sourceId: string, modalContext?: ModalContext) =>
    convertDocument({
      confirmTitle: config.confirmTitle,
      confirmText: config.confirmText(sourceId),
      loadingMessage: config.loadingMessage,
      successMessage: config.successMessage,
      createFn: () => config.createFn(sourceId),
      extractStatusCode: config.extractStatusCode,
      extractCreatedId: config.extractCreatedId,
      extractErrorMessage: config.extractErrorMessage,
      getByIdFn: config.getByIdFn,
      extractDetail: config.extractDetail,
      openModalFn: (detail, createdId) =>
        config.openModalFn(detail, createdId, modalContext),
      refreshKeys: config.refreshKeys,
    });
}