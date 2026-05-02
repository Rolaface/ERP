import React, { useState } from "react";
import { Search, UserPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { showApiError, showSuccess } from "../../../utils/alert";

// ─── Dummy NRC database ───────────────────────────────────────────────────────
const DUMMY_NRC_DB: Record<string, { firstName: string; lastName: string; gender: "Male" | "Female"; dob: string }> = {
  "123456/78/1": { firstName: "James",   lastName: "Banda",    gender: "Male",   dob: "1990-03-15" },
  "234567/89/2": { firstName: "Grace",   lastName: "Mwale",    gender: "Female", dob: "1988-07-22" },
  "345678/90/3": { firstName: "Patrick", lastName: "Tembo",    gender: "Male",   dob: "1995-11-08" },
  "456789/01/4": { firstName: "Charity", lastName: "Phiri",    gender: "Female", dob: "1992-05-30" },
};

type VerifiedData = {
  identityInfo: { nrc: string };
  personalInfo: { firstName: string; lastName: string; gender: string; dateOfBirth: string };
};

type Props = {
  onVerified: (data: VerifiedData) => void;
  onManualEntry: () => void;
  onClose: () => void;
};

const IdentityVerificationModal: React.FC<Props> = ({ onVerified, onManualEntry, onClose }) => {
  const [nrcValue, setNrcValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const trimmed = nrcValue.trim();
    if (!trimmed) { setError("Please enter an NRC number"); return; }

    const nrcRegex = /^\d{6}\/\d{2}\/\d$/;
    if (!nrcRegex.test(trimmed)) {
      setError("Invalid format. Use: 123456/78/1");
      return;
    }

    setError(null);
    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);

    const record = DUMMY_NRC_DB[trimmed];
    if (!record) {
      setError("NRC not found in records. Try: 123456/78/1");
      return;
    }

    showSuccess("Identity verified successfully");
    onVerified({
      identityInfo: { nrc: trimmed },
      personalInfo: {
        firstName: record.firstName,
        lastName: record.lastName,
        gender: record.gender,
        dateOfBirth: record.dob,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleVerify();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-theme w-full max-w-sm relative overflow-hidden">

        {/* top accent bar */}
        <div className="h-1 w-full bg-primary" />

        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-app transition text-muted hover:text-main"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* header */}
        <div className="text-center pt-8 pb-5 px-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-main mb-1">Verify Employee Identity</h2>
          <p className="text-xs text-muted">🇿🇲 Search using NRC number to auto-fill details</p>
        </div>

        {/* hint chips */}
        <div className="px-6 mb-4">
          <p className="text-[10px] text-muted mb-2 font-medium uppercase tracking-wide">Demo NRC numbers:</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(DUMMY_NRC_DB).map((nrc) => (
              <button
                key={nrc}
                onClick={() => { setNrcValue(nrc); setError(null); }}
                className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition font-mono"
              >
                {nrc}
              </button>
            ))}
          </div>
        </div>

        {/* input */}
        <div className="px-6 pb-2">
          <label className="block text-xs font-medium text-main mb-1.5">
            National Registration Card (NRC)
          </label>
          <input
            type="text"
            value={nrcValue}
            onChange={(e) => { setNrcValue(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="123456/78/1"
            className={`w-full px-4 py-2.5 border rounded-lg text-sm font-mono bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition ${
              error ? "border-danger" : "border-theme focus:border-primary"
            }`}
          />
          {error && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
              <p className="text-[11px] text-danger">{error}</p>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="px-6 pt-4 pb-6 space-y-3">
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
            ) : (
              <><Search className="w-4 h-4" /> Verify Identity</>
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-theme border-theme" style={{ borderTop: "1px solid var(--border)" }} />
            <span className="text-[10px] text-muted font-medium">OR</span>
            <div className="flex-1 h-px" style={{ borderTop: "1px solid var(--border)" }} />
          </div>

          <button
            onClick={onManualEntry}
            className="w-full py-2.5 rounded-lg text-sm font-semibold border-2 border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            Enter Details Manually
          </button>

          <p className="text-[10px] text-muted text-center leading-relaxed">
            Verification auto-fills name, gender & DOB to prevent duplicate records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerificationModal;