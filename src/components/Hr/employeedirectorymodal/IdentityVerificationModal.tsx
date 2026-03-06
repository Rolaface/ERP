import React, { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import {
  showApiError,
  showLoading,
  showSuccess,
  closeSwal,
} from "../../../utils/alert";
type IdentityVerificationModalProps = {
  onVerified: (data: any) => void;
  onManualEntry: () => void;
  onClose: () => void;
};
import { verifyEmployeeIdentity } from "../../../api/employeeapi";

const IdentityVerificationModal: React.FC<IdentityVerificationModalProps> = ({
  onVerified,
  onManualEntry,
  onClose,
}) => {
  const [identityValue, setIdentityValue] = useState("");

  const formatNrc = (raw: string): string => {
    const digits = String(raw ?? "")
      .replace(/\D/g, "")
      .slice(0, 9);
    const part1 = digits.slice(0, 6);
    const part2 = digits.slice(6, 8);
    const part3 = digits.slice(8, 9);

    let out = part1;
    if (part2) out += `/${part2}`;
    if (part3) out += `/${part3}`;
    return out;
  };

  const handleVerify = async () => {
    if (!identityValue.trim()) {
      showApiError("Please enter an NRC Number");
      return;
    }

    const nrcRegex = /^\d{6}\/\d{2}\/\d$/;
    if (!nrcRegex.test(identityValue.trim())) {
      showApiError("Invalid NRC format. Example: 123456/78/9");
      return;
    }

    try {
      showLoading("Verifying Identity...");

      const result = await verifyEmployeeIdentity("NRC", identityValue.trim());

      if (result.status !== "success") {
        throw new Error(result.message || "Verification failed");
      }

      closeSwal();

      const mappedData = {
        identityInfo: {
          nrc: identityValue.trim(),
          ssn: result.data.ssn || result.data.socialSecurityNumber || "",
        },
        personalInfo: {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          gender: result.data.gender === "F" ? "Female" : "Male",
        },
      };

      showSuccess("Identity verified successfully");

      onVerified(mappedData);
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-theme w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-app transition text-muted hover:text-main"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-6 px-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-main mb-2">
            Verify Employee Identity
          </h2>
          <p className="text-sm text-muted">🇿🇲 Search using NRC</p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          {/* Identity Type Toggle */}

          {/* Input Field */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-main mb-2">
              National Registration Card (NRC)
            </label>
            <input
              type="text"
              value={identityValue}
              onChange={(e) => setIdentityValue(formatNrc(e.target.value))}
              onKeyDown={handleKeyPress}
              placeholder="123456/78/9"
              className="w-full px-4 py-3 border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mb-4"
          >
            <Search className="w-4 h-4" />
            Verify Identity
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border-theme"></div>
            <span className="text-xs text-muted font-medium">OR</span>
            <div className="flex-1 h-px bg-border-theme"></div>
          </div>

          {/* Manual Entry Button */}
          <button
            onClick={onManualEntry}
            className="w-full bg-card text-primary py-3 rounded-lg font-semibold border-2 border-primary hover:bg-primary/10 transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Enter Details Manually
          </button>

          {/* Info Text */}
          <p className="text-xs text-muted text-center mt-4 leading-relaxed">
            Identity verification helps prevent duplicates and auto-fills data
            from national databases.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerificationModal;
