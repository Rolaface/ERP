import React, { useState } from "react";
import { FaTimes, FaUpload, FaFileAlt } from "react-icons/fa";
import { MinimizableModal } from "../../common/MinimizableModal";
import { ModalInput } from "../../ui/modal/modalComponent";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (payload: { description: string; file: File }) => Promise<void>;
};

const DocumentUploadModal: React.FC<Props> = ({ isOpen, onClose, onUpload }) => {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description || !file) return;
    setLoading(true);
    await onUpload({ description, file });
    setLoading(false);
    onClose();
  };

  const resetForm = () => {
    setDescription("");
    setFile(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <MinimizableModal
      modalId="document-upload"
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Document"
      maxWidth="md"
      height="auto"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-xs rounded-lg border border-theme text-main hover:bg-app transition"
          >
            Cancel
          </button>
          <button
            disabled={!description || !file || loading}
            onClick={handleSubmit}
            className="px-5 py-1.5 text-xs bg-primary text-white rounded-lg disabled:opacity-50 transition"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      }
    >
      {/* Description */}
      <div className="mb-4">
        <ModalInput
          label="Document Description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. NRC, Offer Letter"
        />
      </div>

      {/* Upload Box */}
      <label className="block mb-4">
        <div className="border-2 border-dashed border-theme rounded-lg p-5 text-center cursor-pointer hover:border-primary bg-app transition">
          <FaUpload className="w-6 h-6 mx-auto text-primary mb-2" />
          <p className="text-xs text-main">
            Click to upload or drag & drop
          </p>
          <p className="text-[11px] text-muted mt-1">
            PDF, JPG, PNG (max 5MB)
          </p>
        </div>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      {/* Selected File Preview */}
      {file && (
        <div className="flex items-center gap-2 text-xs bg-app border border-theme rounded-lg px-3 py-2">
          <FaFileAlt className="w-4 h-4 text-muted" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      )}
    </MinimizableModal>
  );
};

export default DocumentUploadModal;
