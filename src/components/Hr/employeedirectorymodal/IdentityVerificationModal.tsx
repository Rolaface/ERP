import React, { useState } from "react";
import { IdCard, ArrowRight, UserRoundPen, Loader2, ScanLine } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  modalId: string;
  onVerified: (data: {
    identityInfo?: { nationalId?: string };
    personalInfo?: {
      firstName?: string;
      lastName?: string;
      gender?: string;
      dateOfBirth?: string;
    };
  }) => void;
  onManualEntry: () => void;
};

const IdentityVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  modalId,
  onVerified,
  onManualEntry,
}) => {
  const [nationalId, setNationalId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!nationalId.trim()) {
      setError("National Identification Number is required.");
      return;
    }
    setError(null);
    setVerifying(true);

    setTimeout(() => {
      onVerified({
        identityInfo: { nationalId: nationalId.trim() },
        personalInfo: {
          firstName: "",
          lastName: "",
          gender: "",
          dateOfBirth: "",
        },
      });
      setVerifying(false);
    }, 600);
  };

  const footer = (
    <div className="flex w-full items-center justify-between">
      <button
        onClick={onManualEntry}
        disabled={verifying}
        className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-main transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <UserRoundPen className="w-3.5 h-3.5" />
        Add Manually
      </button>

      <button
        onClick={handleVerify}
        disabled={verifying}
        className="flex items-center gap-1.5 px-5 py-2 min-w-[100px] justify-center text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
      >
        {verifying ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            Verify
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Identity Verification"
      subtitle="Verify employee identity before proceeding"
      icon={IdCard}
      maxWidth="sm"
      height="auto"
      hideMinimize
      footer={footer}
    >
      <div className="space-y-5 py-2">
        {/* Icon + description block */}
        <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/10 p-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <ScanLine className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-muted leading-relaxed pt-0.5">
            Enter the employee's National Identification Number to fetch and
            pre-fill their details automatically.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-main uppercase tracking-wide">
            National Identification Number
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={nationalId}
              onChange={(e) => {
                setNationalId(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !verifying) handleVerify();
              }}
              placeholder="e.g. 123456/78/1"
              autoFocus
              disabled={verifying}
              className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border bg-app text-main outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                error
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-theme focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              }`}
            />
          </div>
          {error && (
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default IdentityVerificationModal;