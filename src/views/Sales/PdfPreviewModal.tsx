import { X, Download, Printer } from "lucide-react";
import { createPortal } from "react-dom";

interface PdfPreviewModalProps {
  open: boolean;
  title?: string;
  pdfUrl: string | null;
  onClose: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  primaryActionLabel?: string;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  title = "Document Preview",
  pdfUrl,
  onClose,
  onDownload,
  onPrint,
  primaryActionLabel = "Download PDF",
}) => {
  if (!open || !pdfUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[95vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>

          <div className="flex items-center gap-3">
            {onPrint && (
              <button
                onClick={onPrint}
                className="px-3 py-2 text-sm border rounded-md hover:bg-gray-100 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            )}

            {onDownload && (
              <button
                onClick={onDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {primaryActionLabel}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-500 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-100">
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PdfPreviewModal;