import { lazy, useState } from "react";
import type { ModalRenderFn } from "./registryTypes";
import type { ModalContext } from "../../../store/modalStore";

const ImportModal = lazy(() => import("../../../components/Import data/importdatamodal")); 


function ImportDataModalInner({
  modalId,
  cfg,
  handleClose,
}: {
  modalId: string;
  cfg: NonNullable<ModalContext["importConfig"]>;
  handleClose: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  return (
    <ImportModal
      modalId={modalId}
      isOpen={true}
      onClose={handleClose}
      title={cfg.title}
      subtitle={cfg.subtitle}
      accept={cfg.accept}
      uploading={uploading}
      downloadingTemplate={downloading}
      onImport={async (file) => {
        setUploading(true);
        try {
          await cfg.onImport(file);
          handleClose();
        } finally {
          setUploading(false);
        }
      }}
      onDownloadTemplate={
        cfg.onDownloadTemplate
          ? async () => {
              setDownloading(true);
              try {
                await cfg.onDownloadTemplate?.();
              } finally {
                setDownloading(false);
              }
            }
          : undefined
      }
    />
  );
}

const ImportDataModalWrapper: ModalRenderFn = (modal, context, { handleClose }) => {
  const cfg = context?.importConfig;
  if (!cfg) return null;

  return (
    <ImportDataModalInner
      key={modal.id}
      modalId={modal.id}
      cfg={cfg}
      handleClose={handleClose}
    />
  );
};

export const importModalsRegistry: Record<string, ModalRenderFn> = {
  importData: ImportDataModalWrapper,
};