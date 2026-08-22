import React, { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { showValidationError } from "../../utils/alert";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

interface ScanPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  piId?: string;
  modalId: string;
}

const ScanPIModal: React.FC<ScanPIModalProps> = ({
  isOpen,
  onClose,
  piId,
  modalId,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const {
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
  } = useUnsavedChanges();

  const resolvedModalId = modalId;

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const isPdf =
      selectedFile.type === "application/pdf";

    const isImage =
      selectedFile.type.startsWith("image/");

    if (!isPdf && !isImage) {
      showValidationError(
        "Only PDF and image files are supported",
      );
      return;
    }

    setFile(selectedFile);
    markDirty();
  };

  const handleRemoveFile = () => {
    setFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    resetDirty();
  };

  const handleUpload = () => {
    if (!file) return;

    resetDirty();

    // TODO:
    // API integration later

    

    onClose();
  };

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() =>
        handleCloseWithConfirm(
          onClose,
          resolvedModalId,
        )
      }
      title="Scan PI"
      subtitle="Upload purchase invoice document"
      icon={FileText}
      customWidth="600px"
      height="auto"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() =>
              handleCloseWithConfirm(
                onClose,
                resolvedModalId,
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            disabled={!file}
            onClick={handleUpload}
          >
            Upload
          </Button>
        </>
      }
    >
      <form
        noValidate
        onChange={() => markDirty()}
        className="p-4 space-y-4"
      >
        <div className="rounded-lg border-2 border-dashed border-theme p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Upload size={36} />

            <div>
              <p className="font-medium">
                Upload Invoice Document
              </p>

              <p className="text-sm text-muted">
                Supported formats: PDF and Images
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                inputRef.current?.click()
              }
            >
              Choose File
            </Button>
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-md border border-theme p-3">
            <div className="min-w-0">
              <div className="font-medium truncate">
                {file.name}
              </div>

              <div className="text-xs text-muted">
                {(file.size / 1024).toFixed(2)} KB
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </form>
    </MinimizableModal>
  );
};

export default ScanPIModal;