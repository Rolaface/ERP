import React, { useState, useEffect } from "react";
import {
  FaUniversity,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaTimes,
} from "react-icons/fa";
import type { BankAccount } from "../../types/company";
import AddBankAccountModal from "../../components/CompanySetup/AddBankAccountModal";
import { updateCompanyById } from "../../api/companySetupApi";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import Swal from "sweetalert2";
import { deleteCompanyBankAccount } from "../../api/companySetupApi";

const VITE_COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

// ─── Masking helper ───────────────────────────────────────────────────────────
const maskValue = (val: string | number | undefined): string => {
  const str = val !== null && val !== undefined ? String(val) : "";
  if (!str.trim()) return "";
  if (str.length <= 4) return "•".repeat(str.length);
  return "•".repeat(str.length - 4) + str.slice(-4);
};

// ─── Detail Field ─────────────────────────────────────────────────────────────
interface DetailProps {
  label: string;
  name: keyof BankAccount;
  value: string | number | undefined;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  masked?: boolean;
}

const Detail: React.FC<DetailProps> = ({ label, name, value, isEditing, onChange, masked }) => {
  const [revealed, setRevealed] = useState(false);
  const safe = value !== null && value !== undefined ? value : "";
  const isEmpty = String(safe).trim() === "";
  const displayValue = !isEditing && masked && !revealed && !isEmpty ? maskValue(safe) : safe;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-muted uppercase tracking-widest">
        {label}
      </label>
      <div
        className={`border rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-150 bg-card ${
          isEditing ? "border-primary ring-2 ring-primary/15 shadow-sm" : "border-theme"
        }`}
      >
        {isEditing ? (
          <input
            name={name}
            value={safe}
            onChange={onChange}
            autoFocus={name === "bankName"}
            className="w-full bg-transparent border-none p-0 text-main focus:outline-none font-medium text-sm"
          />
        ) : isEmpty ? (
          <span className="text-sm text-muted/40 font-medium">—</span>
        ) : (
          <p className="text-sm font-medium flex-1 truncate font-mono tracking-wider text-main">
            {String(displayValue)}
          </p>
        )}

        {masked && !isEditing && !isEmpty && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-muted hover:text-primary transition-colors shrink-0 ml-1"
            aria-label={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Normalize ────────────────────────────────────────────────────────────────
const normalizeBankAccounts = (accounts: any[]): BankAccount[] =>
  accounts.map((acc) => ({
    ...acc,
    isdefault:
      acc.default === "1" || acc.default === 1 ||
      acc.dafault === "1" || acc.dafault === 1 ||
      acc.isdefault === true,
  }));

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props {
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}

const BankDetails: React.FC<Props> = ({ bankAccounts, setBankAccounts }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<BankAccount | null>(null);

  // ✅ FIX: initialize to first account that actually has a bankName (not index 0 blindly)
  const [selectedAccount, setSelectedAccount] = useState<number | null>(() => {
    const idx = bankAccounts.findIndex((a) => a.bankName?.trim());
    return idx !== -1 ? idx : null;
  });

  // ✅ FIX: when bankAccounts loads/updates, re-sync if current selection is invalid
  useEffect(() => {
    if (
      selectedAccount === null ||
      !bankAccounts[selectedAccount]?.bankName?.trim()
    ) {
      const idx = bankAccounts.findIndex((a) => a.bankName?.trim());
      setSelectedAccount(idx !== -1 ? idx : null);
    }
  }, [bankAccounts]);

  useEffect(() => {
    setIsEditing(false);
    if (selectedAccount !== null && bankAccounts[selectedAccount]) {
      setEditForm(bankAccounts[selectedAccount]);
    } else {
      setEditForm(null);
    }
  }, [selectedAccount, bankAccounts]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddSubmit = async (newAccount: BankAccount) => {
    try {
      showLoading("Adding Bank Account...");
      const updatedAccounts = [...bankAccounts, newAccount];
      await updateCompanyById({
        id: VITE_COMPANY_ID,
        bankAccounts: updatedAccounts.map((acc) => ({
          id: acc.id, accountNo: acc.accountNo, accountHolderName: acc.accountHolderName,
          bankName: acc.bankName, swiftCode: acc.swiftCode, sortCode: acc.sortCode,
          branchAddress: acc.branchAddress, currency: acc.currency, dateAdded: acc.dateAdded,
          openingBalance: acc.openingBalance, default: acc.isdefault ? "1" : 0,
        })),
      });
      closeSwal();
      showSuccess("Bank account added successfully.");
      setBankAccounts(updatedAccounts);
      setShowBankModal(false);
    } catch (error) { closeSwal(); showApiError(error); }
  };

  const handleEditClick = () => {
    if (selectedAccount !== null && bankAccounts[selectedAccount]) {
      setEditForm(bankAccounts[selectedAccount]);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedAccount !== null) setEditForm(bankAccounts[selectedAccount]);
  };

  const handleSaveEdit = async () => {
    if (!editForm || selectedAccount === null) return;
    try {
      showLoading("Updating Bank Account...");
      const updatedAccounts = [...bankAccounts];
      updatedAccounts[selectedAccount] = editForm;
      await updateCompanyById({
        id: VITE_COMPANY_ID,
        bankAccounts: updatedAccounts.map((acc) => ({
          id: acc.id, accountNo: acc.accountNo, accountHolderName: acc.accountHolderName,
          bankName: acc.bankName, swiftCode: acc.swiftCode, sortCode: acc.sortCode,
          branchAddress: acc.branchAddress, currency: acc.currency, dateAdded: acc.dateAdded,
          openingBalance: acc.openingBalance, default: acc.isdefault ? "1" : "0",
        })),
      });
      closeSwal();
      showSuccess("Bank account updated successfully.");
      setBankAccounts(updatedAccounts);
      setIsEditing(false);
    } catch (error) { closeSwal(); showApiError(error); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editForm) setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleDelete = async () => {
    if (selectedAccount === null) return;
    const selected = bankAccounts[selectedAccount];
    // ✅ FIX: don't use !id (blocks 0/"")
    if (selected?.id === undefined || selected?.id === null) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Bank Account?",
      text: `Are you sure you want to delete "${selected.bankName}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting Bank Account...");
      await deleteCompanyBankAccount(VITE_COMPANY_ID, selected.id);
      closeSwal();
      showSuccess("Bank account deleted successfully.");
      const updatedAccounts = bankAccounts.filter((acc) => acc.id !== selected.id);
      setBankAccounts(updatedAccounts);
      const nextIdx = updatedAccounts.findIndex((a) => a.bankName?.trim());
      setSelectedAccount(nextIdx !== -1 ? nextIdx : null);
      setIsEditing(false);
      setEditForm(null);
    } catch (error) { closeSwal(); showApiError(error); }
  };

  const handleSetDefault = async () => {
    if (selectedAccount === null) return;
    const selected = bankAccounts[selectedAccount];
    try {
      showLoading("Setting Default Account...");
      await updateCompanyById({
        id: VITE_COMPANY_ID,
        bankAccounts: [{ id: selected.id, default: 1 }],
      });
      closeSwal();
      showSuccess("Default account updated successfully.");
      setBankAccounts((prev) =>
        prev.map((acc) => ({
          ...acc,
          isdefault: acc.id === selected.id,
          default: acc.id === selected.id ? "1" : "0",
        }))
      );
    } catch (error) { closeSwal(); showApiError(error); }
  };

  const normalizedAccounts = normalizeBankAccounts(bankAccounts);

  const filteredAccounts = normalizedAccounts.filter((acc) => {
    if (!acc.bankName?.trim()) return false;
    return (
      (acc.bankName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.accountNo ?? "").includes(searchTerm)
    );
  });

  const getGlobalIndex = (filteredIndex: number) => {
    const acc = filteredAccounts[filteredIndex];
    if (!acc) return -1;
    return bankAccounts.findIndex((a) => a.id === acc.id);
  };

  const isDefaultSelected = normalizedAccounts[selectedAccount ?? -1]?.isdefault;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-card">
      {showBankModal && (
        <AddBankAccountModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      <div className="mx-auto">
        <div className="grid grid-cols-5 gap-6">

          {/* LEFT: Account List */}
          <div className="col-span-2 bg-card rounded-2xl shadow-sm border border-theme overflow-hidden">
            <div className="px-5 py-3.5 bg-primary flex items-center gap-2.5">
              <FaUniversity className="w-4 h-4 text-white/80" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Bank Accounts</h2>
            </div>

            <div className="p-4 space-y-3">
              <div className={`space-y-2.5 ${isEditing ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-theme rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-card text-main transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowBankModal(true)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)" }}
                >
                  <FaPlus className="w-3.5 h-3.5" /> Add New Account
                </button>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <div className="text-center py-10 text-muted text-sm">
                    <FaUniversity className="w-7 h-7 mx-auto mb-2 opacity-20" />
                    No accounts found
                  </div>
                ) : (
                  filteredAccounts.map((acc, i) => {
                    const globalIdx = getGlobalIndex(i);
                    const isSelected = selectedAccount === globalIdx;
                    return (
                      <div
                        key={acc.id ?? i}
                        onClick={() => { if (!isEditing && globalIdx !== -1) setSelectedAccount(globalIdx); }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                          isSelected ? "border-primary/40 bg-primary/5 shadow-sm" : "border-theme bg-card hover:border-primary/25"
                        } ${isEditing ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isSelected ? "text-primary" : "text-main"}`}>
                              {acc.bankName}
                            </p>
                            {acc.isdefault && (
                              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted shrink-0 ml-2 font-mono">{acc.swiftCode}</p>
                        </div>
                        <p className="text-xs text-muted font-mono truncate mt-0.5">{acc.accountNo}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Detail Panel */}
          <div className="col-span-3 bg-card rounded-2xl shadow-sm border border-theme overflow-hidden">
            <div className="px-5 py-3.5 flex justify-between items-center bg-primary min-h-[52px]">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                {isEditing ? "Editing Account" : "Account Details"}
              </h2>

              {selectedAccount !== null && bankAccounts[selectedAccount]?.bankName?.trim() && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={handleSaveEdit}
                        className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-400 transition-colors flex items-center gap-1.5 text-xs font-semibold">
                        <FaCheck className="w-3 h-3" /> Save
                      </button>
                      <button type="button" onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center gap-1.5 text-xs font-medium">
                        <FaTimes className="w-3 h-3" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <Btn onClick={handleEditClick} icon={<FaEdit size={12} />}>Edit</Btn>
                      <Btn onClick={handleDelete} icon={<FaTrash size={12} />}>Delete</Btn>
                      <button type="button" onClick={handleSetDefault} disabled={isDefaultSelected}
                        className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          isDefaultSelected ? "bg-white/20 cursor-not-allowed opacity-60" : "bg-white/15 hover:bg-white/25"
                        }`}>
                        {isDefaultSelected ? "✓ Default" : "Set Default"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            {selectedAccount === null || !bankAccounts[selectedAccount]?.bankName?.trim() ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-app flex items-center justify-center mb-4 border-2 border-dashed border-theme">
                  <FaUniversity className="w-8 h-8 text-muted opacity-30" />
                </div>
                <h3 className="text-base font-semibold text-main mb-1">No Account Selected</h3>
                <p className="text-sm text-muted">Select an account from the list to view its details</p>
              </div>
            ) : (
              <div className="p-6">
                {(() => {
                  const data = isEditing ? editForm : bankAccounts[selectedAccount];
                  if (!data) return null;
                  return (
                    <div className="grid grid-cols-2 gap-5">
                      {/* Plain */}
                      <Detail label="Bank Name"       name="bankName"          value={data.bankName}          isEditing={isEditing} onChange={handleInputChange} />
                      <Detail label="Account Holder"  name="accountHolderName" value={data.accountHolderName} isEditing={isEditing} onChange={handleInputChange} />
                      {/* Masked */}
                      <Detail label="Account Number"  name="accountNo"         value={data.accountNo}         isEditing={isEditing} onChange={handleInputChange} masked />
                      <Detail label="Swift/BIC Code"  name="swiftCode"         value={data.swiftCode}         isEditing={isEditing} onChange={handleInputChange} masked />
                      <Detail label="Sort Code"       name="sortCode"          value={data.sortCode}          isEditing={isEditing} onChange={handleInputChange} masked />
                      {/* Plain */}
                      <Detail label="Currency"        name="currency"          value={data.currency}          isEditing={isEditing} onChange={handleInputChange} />
                      <Detail label="Opening Balance" name="openingBalance"    value={data.openingBalance}    isEditing={isEditing} onChange={handleInputChange} />
                      <Detail label="Date Added"      name="dateAdded"         value={data.dateAdded}         isEditing={isEditing} onChange={handleInputChange} />
                      <div className="col-span-2">
                        <Detail label="Branch Address" name="branchAddress"   value={data.branchAddress}     isEditing={isEditing} onChange={handleInputChange} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Btn: React.FC<{ onClick: () => void; icon: React.ReactNode; children: React.ReactNode }> = ({ onClick, icon, children }) => (
  <button type="button" onClick={onClick}
    className="px-3 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors flex items-center gap-1.5 text-xs font-medium">
    {icon}{children}
  </button>
);

const FaCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default BankDetails;