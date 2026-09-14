import React from "react";
import { Landmark } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";

export interface PdcDetail {
  name: string;
  cheque_reference_number: string;
  cheque_date: string;
  amount: number;
  status: string;
  attachment?: string;
}

const formatDate = (iso: string) => {
  if (!iso) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [year, month, day] = iso.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
};

interface PdcSelectionModalProps {
  open: boolean;
  pdcList: PdcDetail[];
  loading: boolean;
  onClose: () => void;
  onSelect: (pdc: PdcDetail) => void;
  onSkip: () => void;
  modalId?: string;
}

const PdcSelectionModal: React.FC<PdcSelectionModalProps> = ({
  open,
  pdcList,
  loading,
  onClose,
  onSelect,
  onSkip,
  modalId = "pdc-selection",
}) => {
  const footerContent = (
    <div className="flex justify-end w-full">
      <button
        type="button"
        onClick={onSkip}
        className="text-xs font-medium text-primary hover:underline"
      >
        Skip PDC &amp; Pay
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={open}
      onClose={onClose}
      title="Select PDC"
      subtitle="Choose the post-dated cheque to receive payment against"
      icon={Landmark}
      footer={footerContent}
      maxWidth="md"
      height="auto"
       hideMinimize
    >
      <div className="p-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted">
            Loading PDCs...
          </div>
        ) : pdcList.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            No PDCs found for this invoice
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {pdcList.map((pdc) => {
              const disabled = pdc.status !== "Unused";
              return (
                <button
                  key={pdc.name}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(pdc)}
                  className={`w-full text-left bg-card rounded-lg p-3 border border-theme transition-all ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:border-primary cursor-pointer"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-main">
                        {pdc.cheque_reference_number}
                      </span>
                      <span className="text-[10px] text-muted">
                       {formatDate(pdc.cheque_date)}
                        
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-main tabular-nums">
                        {pdc.amount.toFixed(2)}
                      </span>
                      <span
                        className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                          pdc.status === "Unused"
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {pdc.status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MinimizableModal>
  );
};

export default PdcSelectionModal;