import React, { useState, useEffect, useCallback } from "react";
import {
  FaUpload,
  FaTimes,
  FaCheckCircle,
  FaImage,
  FaFileSignature,
  FaEye,
  FaDownload,
  FaTrash,
  FaClock,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

import { updateCompanyFiles, getCompanyById } from "../../api/companySetupApi";
import { ERP_BASE } from "../../config/api";
// TYPES

type UploadedFile = {
  id: string;
  file: File;
  preview: string;
  uploadedAt: Date;
  size: string;
  isExisting?: boolean; // Flag to identify pre-existing files
};

type UploadProgress = {
  type: "logo" | "signature";
  progress: number;
  isUploading: boolean;
};

interface UploadProps {
  COMPANY_ID: string;
  onUploadSuccess?: () => void;
}

// CONSTANTS

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
];
const ACCEPTED_EXTENSIONS = ["PNG", "JPG", "JPEG", "SVG"];

// UTILITY FUNCTIONS

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFullImageUrl = (path: string): string => {
  return `${ERP_BASE}${path}`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toUpperCase() || "UNKNOWN";
};

// MAIN COMPONENT

const Upload: React.FC<UploadProps> = ({ COMPANY_ID, onUploadSuccess }) => {
  // STATE

  const [logo, setLogo] = useState<UploadedFile | null>(null);
  const [signature, setSignature] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState<"logo" | "signature" | null>(
    null,
  );
  const [previewModal, setPreviewModal] = useState<{
    type: "logo" | "signature";
    url: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<"logo" | "signature">(
    "logo",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // LOAD EXISTING FILES

  const loadExistingFiles = useCallback(async () => {
    if (!COMPANY_ID) {
      console.error("No COMPANY_ID provided");
      setIsLoadingExisting(false);
      return;
    }

    try {
      setIsLoadingExisting(true);
      const response = await getCompanyById(COMPANY_ID);

      if (!response?.data) {
        console.warn("No company data found");
        return;
      }

      const documents = response.data.documents;

      if (documents?.companyLogoUrl) {
        const logoUrl = getFullImageUrl(documents.companyLogoUrl);

        setLogo({
          id: "existing-logo",
          file: new File([], "company-logo"), // dummy
          preview: logoUrl,
          uploadedAt: new Date(),
          size: "—",
          isExisting: true,
        });
      }

      // Load existing signature
      if (documents?.authorizedSignatureUrl) {
        const signatureUrl = getFullImageUrl(documents.authorizedSignatureUrl);

        setSignature({
          id: "existing-signature",
          file: new File([], "signature"), // dummy
          preview: signatureUrl,
          uploadedAt: new Date(),
          size: "—",
          isExisting: true,
        });
      }
    } catch (error) {
      console.error("Error loading company files:", error);
      showErrorMessage("Failed to load existing files");
    } finally {
      setIsLoadingExisting(false);
    }
  }, [COMPANY_ID]);

  // EFFECTS

  useEffect(() => {
    loadExistingFiles();
  }, [loadExistingFiles]);

  // Auto-hide success/error messages
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  // HELPER FUNCTIONS

  const showErrorMessage = useCallback((message: string) => {
    setErrorMessage(message);
    setShowError(true);
  }, []);

  const showSuccessMessage = useCallback(() => {
    setShowSuccess(true);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed.";
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Unsupported file format. Please use: ${ACCEPTED_EXTENSIONS.join(", ")}`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit.`;
    }

    return null;
  };

  // FILE UPLOAD SIMULATION

  const simulateUpload = useCallback(
    (file: File, type: "logo" | "signature"): Promise<string> => {
      return new Promise((resolve, reject) => {
        setUploadProgress({ type, progress: 0, isUploading: true });

        const reader = new FileReader();

        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress({ type, progress, isUploading: true });
          }
        };

        reader.onloadend = () => {
          setTimeout(() => {
            setUploadProgress({ type, progress: 100, isUploading: false });
            setTimeout(() => {
              setUploadProgress(null);
              resolve(reader.result as string);
            }, 500);
          }, 300);
        };

        reader.onerror = () => {
          setUploadProgress(null);
          reject(new Error("Failed to read file"));
        };

        reader.readAsDataURL(file);
      });
    },
    [],
  );

  // FILE PROCESSING

  const processFile = useCallback(
    async (file: File, type: "logo" | "signature") => {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        showErrorMessage(validationError);
        return;
      }

      try {
        const preview = await simulateUpload(file, type);

        const uploadedFile: UploadedFile = {
          id: `new-${Date.now()}`,
          file,
          preview,
          uploadedAt: new Date(),
          size: formatFileSize(file.size),
          isExisting: false,
        };

        if (type === "logo") {
          setLogo(uploadedFile);
        } else {
          setSignature(uploadedFile);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        showErrorMessage("Failed to process file. Please try again.");
      }
    },
    [simulateUpload, showErrorMessage],
  );

  // EVENT HANDLERS

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature") => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file, type);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [processFile],
  );

  const handleDrag = useCallback(
    (e: React.DragEvent, type: "logo" | "signature") => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(
        e.type === "dragenter" || e.type === "dragover" ? type : null,
      );
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "logo" | "signature") => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(null);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file, type);
      }
    },
    [processFile],
  );

  const removeFile = useCallback((type: "logo" | "signature") => {
    if (type === "logo") {
      setLogo(null);
    } else {
      setSignature(null);
    }
  }, []);

  const downloadFile = useCallback(
    (uploadedFile: UploadedFile) => {
      try {
        const link = document.createElement("a");
        link.href = uploadedFile.preview;
        link.download = uploadedFile.file.name;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading file:", error);
        showErrorMessage("Failed to download file");
      }
    },
    [showErrorMessage],
  );

  const openPreview = useCallback((type: "logo" | "signature", url: string) => {
    setPreviewModal({ type, url });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewModal(null);
  }, []);

  const handleResetAll = useCallback(() => {
    if (window.confirm("Are you sure you want to remove all files?")) {
      setLogo(null);
      setSignature(null);
    }
  }, []);

  // SAVE HANDLER

  const handleSave = useCallback(async () => {
    // Check if there are files to upload (only new files, not existing ones)
    const hasNewLogo = logo && !logo.isExisting;
    const hasNewSignature = signature && !signature.isExisting;

    if (!hasNewLogo && !hasNewSignature) {
      showErrorMessage("Please upload at least one new file before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateCompanyFiles(
        COMPANY_ID,
        hasNewLogo ? logo.file : null,
        hasNewSignature ? signature.file : null,
      );

      console.warn("Upload successful:", response);
      showSuccessMessage();

      // Reload existing files to get updated URLs
      await loadExistingFiles();

      // Call parent success callback
      onUploadSuccess?.();
    } catch (error: any) {
      console.error("Error uploading files:", error);

      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload files. Please try again.";

      showErrorMessage(errorMsg);
    } finally {
      setIsSaving(false);
    }
  }, [
    logo,
    signature,
    COMPANY_ID,
    loadExistingFiles,
    onUploadSuccess,
    showErrorMessage,
    showSuccessMessage,
  ]);

  // DERIVED STATE

  const currentFile = selectedType === "logo" ? logo : signature;
  const isUploading =
    uploadProgress?.type === selectedType && uploadProgress.isUploading;
  const progress =
    uploadProgress?.type === selectedType ? uploadProgress.progress : 0;
  const hasNewFiles =
    (logo && !logo.isExisting) || (signature && !signature.isExisting);

  // RENDER

  if (isLoadingExisting) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading existing files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-full">
        {/* Success Alert */}
        {showSuccess && (
          <div
            className="mb-6 rounded-lg p-4 flex items-center gap-3 shadow-sm badge-success"
            role="alert"
            aria-live="polite"
          >
            <FaCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-success font-medium text-sm">
              Documents uploaded successfully!
            </p>
          </div>
        )}

        {/* Error Alert */}
        {showError && (
          <div
            className="mb-6 rounded-lg p-4 flex items-center gap-3 shadow-sm bg-danger/10 border border-danger/20"
            role="alert"
            aria-live="assertive"
          >
            <FaExclamationTriangle className="w-5 h-5 text-danger flex-shrink-0" />
            <p className="text-danger font-medium text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Sidebar - Document Types */}
          <div className="lg:col-span-2 bg-card rounded-lg shadow-sm border border-theme overflow-hidden">
            <div className="px-4 py-3 bg-primary-600 text-table-head-text">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FaUpload className="w-5 h-5" />
                Upload Documents
              </h2>
            </div>

            <div className="p-4 space-y-2">
              {/* Upload Type Cards */}
              <div className="space-y-2">
                {/* Logo Card */}
                <button
                  onClick={() => setSelectedType("logo")}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedType === "logo"
                      ? "border-primary-600 bg-primary-10"
                      : "border-theme row-hover bg-card"
                  }`}
                  aria-pressed={selectedType === "logo"}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            selectedType === "logo"
                              ? "var(--primary-20)"
                              : "var(--bg)",
                        }}
                      >
                        <FaImage
                          className="w-5 h-5"
                          style={{
                            color:
                              selectedType === "logo"
                                ? "var(--primary)"
                                : "var(--muted)",
                          }}
                        />
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{
                            color:
                              selectedType === "logo"
                                ? "var(--text)"
                                : "var(--main)",
                          }}
                        >
                          Company Logo
                        </p>
                        <p className="text-xs text-muted">
                          {ACCEPTED_EXTENSIONS.join(", ")}
                        </p>
                      </div>
                    </div>
                    {logo && (
                      <span className="text-xs badge-success px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <FaCheck className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>
                  {logo && (
                    <div className="mt-3 pt-3 border-t border-theme">
                      <p
                        className="text-xs text-main truncate"
                        title={logo.file.name}
                      >
                        {logo.file.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted">{logo.size}</p>
                        {logo.isExisting && (
                          <span className="text-xs text-primary-600 font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {/* Signature Card */}
                <button
                  onClick={() => setSelectedType("signature")}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedType === "signature"
                      ? "border-primary-600 bg-primary-10"
                      : "border-theme row-hover bg-card"
                  }`}
                  aria-pressed={selectedType === "signature"}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            selectedType === "signature"
                              ? "var(--primary-20)"
                              : "var(--bg)",
                        }}
                      >
                        <FaFileSignature
                          className="w-5 h-5"
                          style={{
                            color:
                              selectedType === "signature"
                                ? "var(--primary)"
                                : "var(--muted)",
                          }}
                        />
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{
                            color:
                              selectedType === "signature"
                                ? "var(--text)"
                                : "var(--main)",
                          }}
                        >
                          Authorized Signature
                        </p>
                        <p className="text-xs text-muted">
                          {ACCEPTED_EXTENSIONS.join(", ")}
                        </p>
                      </div>
                    </div>
                    {signature && (
                      <span className="text-xs badge-success px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <FaCheck className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>
                  {signature && (
                    <div className="mt-3 pt-3 border-t border-theme">
                      <p
                        className="text-xs text-main truncate"
                        title={signature.file.name}
                      >
                        {signature.file.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted">{signature.size}</p>
                        {signature.isExisting && (
                          <span className="text-xs text-primary-600 font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </div>

              {/* Upload Guidelines */}
              <div className="mt-6 pt-4 border-t border-theme">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-main">
                  <FaExclamationTriangle className="w-4 h-4 text-danger" />
                  Guidelines
                </h3>
                <ul className="space-y-2">
                  <li className="text-xs flex items-start gap-2">
                    <span className="text-primary-700 font-bold mt-0.5">•</span>
                    <span className="text-muted">
                      Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
                    </span>
                  </li>
                  <li className="text-xs flex items-start gap-2">
                    <span className="text-primary-700 font-bold mt-0.5">•</span>
                    <span className="text-muted">
                      Supported formats: {ACCEPTED_EXTENSIONS.join(", ")}
                    </span>
                  </li>
                  <li className="text-xs flex items-start gap-2">
                    <span className="text-primary-700 font-bold mt-0.5">•</span>
                    <span className="text-muted">
                      Use transparent background for logos
                    </span>
                  </li>
                  <li className="text-xs flex items-start gap-2">
                    <span className="text-primary-700 font-bold mt-0.5">•</span>
                    <span className="text-muted">
                      Ensure signatures are clear and legible
                    </span>
                  </li>
                </ul>
              </div>

              {/* Progress Summary */}
              {(logo || signature) && (
                <div className="mt-6 pt-4 border-t border-theme">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-main">
                      Overall Progress
                    </p>
                    <p className="text-sm font-bold text-primary-700">
                      {(logo ? 50 : 0) + (signature ? 50 : 0)}%
                    </p>
                  </div>
                  <div className="bg-app rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(logo ? 50 : 0) + (signature ? 50 : 0)}%`,
                        background: "var(--primary)",
                      }}
                      role="progressbar"
                      aria-valuenow={(logo ? 50 : 0) + (signature ? 50 : 0)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Upload Area & Details */}
          <div className="lg:col-span-3 bg-card rounded-lg shadow-sm border border-theme overflow-hidden">
            <div className="px-4 py-3 flex justify-between items-center bg-primary-600">
              <h2 className="text-lg font-semibold text-white">
                {selectedType === "logo"
                  ? "Company Logo"
                  : "Authorized Signature"}
              </h2>
              {currentFile && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      openPreview(selectedType, currentFile.preview)
                    }
                    className="px-3 py-1.5 rounded-md transition-all text-sm font-medium flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white"
                    aria-label="Preview file"
                  >
                    <FaEye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => removeFile(selectedType)}
                    className="px-3 py-1.5 rounded-md transition-all text-sm font-medium flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white"
                    aria-label="Remove file"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {isUploading ? (
                // Uploading State
                <div className="p-12 text-center">
                  <div className="inline-block p-6 rounded-full mb-4 bg-primary/10">
                    <FaUpload className="w-12 h-12 animate-pulse text-primary-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-main mb-2">
                    Processing...
                  </h3>
                  <p className="text-muted mb-4">
                    Please wait while we prepare your file
                  </p>

                  <div className="max-w-md mx-auto space-y-2">
                    <div className="bg-app rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                          background: "var(--primary)",
                        }}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className="text-sm font-semibold text-primary-700">
                      {progress}% Complete
                    </p>
                  </div>
                </div>
              ) : !currentFile ? (
                // Upload Zone
                <div
                  onDragEnter={(e) => handleDrag(e, selectedType)}
                  onDragLeave={(e) => handleDrag(e, selectedType)}
                  onDragOver={(e) => handleDrag(e, selectedType)}
                  onDrop={(e) => handleDrop(e, selectedType)}
                  className="relative border-2 border-dashed rounded-lg p-12 transition-all"
                  style={{
                    borderColor:
                      dragActive === selectedType
                        ? "var(--primary-700)"
                        : "var(--border)",
                    background:
                      dragActive === selectedType
                        ? "var(--row-hover)"
                        : "var(--card)",
                    transform:
                      dragActive === selectedType ? "scale(1.02)" : undefined,
                  }}
                >
                  <input
                    type="file"
                    accept={ACCEPTED_FILE_TYPES.join(",")}
                    onChange={(e) => handleFileSelect(e, selectedType)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id={`${selectedType}-upload`}
                    aria-label={`Upload ${selectedType}`}
                  />
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-primary/10">
                      <FaUpload className="w-10 h-10 text-primary-700" />
                    </div>
                    <p className="text-lg font-semibold text-main mb-2">
                      {dragActive === selectedType
                        ? "Drop your file here"
                        : "Drag & drop your file"}
                    </p>
                    <p className="text-sm text-muted mb-6">or</p>

                    <label
                      htmlFor={`${selectedType}-upload`}
                      className="px-6 py-3 rounded-md font-medium text-sm flex items-center gap-2 cursor-pointer transition-all shadow-sm bg-primary text-white hover:opacity-90"
                    >
                      <FaUpload className="w-4 h-4" /> Browse Files
                    </label>

                    <div className="mt-8 pt-6 border-t border-theme w-full">
                      <p className="text-xs text-muted">
                        Supported formats: {ACCEPTED_EXTENSIONS.join(", ")} •
                        Maximum size: {formatFileSize(MAX_FILE_SIZE)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // File Details View
                <div className="space-y-6">
                  {/* Preview Image */}
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="w-64 h-64 flex items-center justify-center">
                        <img
                          src={currentFile.preview}
                          alt={`${selectedType} preview`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              currentFile.preview,
                            );
                            e.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo Preview%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() =>
                            openPreview(selectedType, currentFile.preview)
                          }
                          className="bg-white text-main p-3 rounded-lg hover:bg-gray-100 transition"
                          aria-label="Preview full size"
                        >
                          <FaEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => downloadFile(currentFile)}
                          className="bg-white text-main p-3 rounded-lg hover:bg-gray-100 transition"
                          aria-label="Download file"
                        >
                          <FaDownload className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* File Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-main">
                        File Name
                      </label>
                      <div className="bg-app border border-theme rounded-lg px-4 py-3">
                        <p
                          className="font-medium text-sm truncate text-main"
                          title={currentFile.file.name}
                        >
                          {currentFile.file.name}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-main">
                        File Size
                      </label>
                      <div className="bg-app border border-theme rounded-lg px-4 py-3 flex items-center justify-between">
                        <p className="font-medium text-sm text-main">
                          {currentFile.size}
                        </p>
                        <span className="text-success">✓</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-main">
                        Format
                      </label>
                      <div className="bg-app border border-theme rounded-lg px-4 py-3">
                        <p className="font-medium text-sm uppercase text-main">
                          {getFileExtension(currentFile.file.name)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-main">
                        Status
                      </label>
                      <div className="bg-app border border-theme rounded-lg px-4 py-3">
                        <p className="font-medium text-sm flex items-center gap-2 text-main">
                          {currentFile.isExisting ? (
                            <>
                              <FaCheckCircle className="w-3.5 h-3.5 text-success" />
                              Current File
                            </>
                          ) : (
                            <>
                              <FaClock className="w-3.5 h-3.5 text-warning" />
                              Ready to Upload
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Replace File Button */}
                  <div className="pt-4 border-t border-theme text-center">
                    <label
                      htmlFor={`${selectedType}-replace`}
                      className="inline-flex items-center gap-2 font-medium cursor-pointer text-sm text-primary-700 hover:text-primary-800 transition"
                    >
                      <FaUpload className="w-4 h-4" />
                      Upload a different file
                    </label>
                    <input
                      type="file"
                      accept={ACCEPTED_FILE_TYPES.join(",")}
                      onChange={(e) => handleFileSelect(e, selectedType)}
                      className="hidden"
                      id={`${selectedType}-replace`}
                      aria-label={`Replace ${selectedType}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={handleResetAll}
            disabled={isSaving || (!logo && !signature)}
            className="px-6 py-2.5 border border-theme text-muted text-sm font-semibold rounded-lg hover:bg-row-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset All
          </button>
          <button
            onClick={handleSave}
            disabled={!hasNewFiles || isSaving}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
              hasNewFiles && !isSaving
                ? "bg-primary text-white cursor-pointer shadow-sm hover:opacity-90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
            }`}
          >
            {isSaving ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Documents"
            )}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
        >
          <div
            className="bg-card rounded-lg max-w-4xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
              <h3
                id="preview-modal-title"
                className="text-lg font-semibold text-main"
              >
                {previewModal.type === "logo"
                  ? "Company Logo"
                  : "Authorized Signature"}{" "}
                Preview
              </h3>
              <button
                onClick={closePreview}
                className="text-muted hover:text-main p-2 rounded-lg transition"
                aria-label="Close preview"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-app flex items-center justify-center p-12 min-h-96">
              <img
                src={previewModal.url}
                alt={`${previewModal.type} preview`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                onError={(e) => {
                  console.error("Preview image failed to load");
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
