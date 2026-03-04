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
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import Swal from "sweetalert2";

const VITE_COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

interface DetailProps {
  label: string;
  name: keyof BankAccount;
  value: string | number | undefined;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canToggle?: boolean;
  onToggle?: () => void;
  reveal?: boolean;
}

const Detail: React.FC<DetailProps> = ({
  label,
  name,
  value,
  isEditing,
  onChange,
  canToggle,
  onToggle,
  reveal,
}) => {
  const displayValue =
    canToggle && !reveal && !isEditing
      ? "•••• •••• " + String(value).slice(-4)
      : value;

  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
        {label}
      </label>

      <div
        className={`bg-card border rounded-lg px-4 py-3 flex justify-between items-center ${
          isEditing ? "border-primary ring-1 ring-primary/20" : "border-theme"
        }`}
      >
        {isEditing ? (
          <input
            name={name}
            value={value || ""}
            onChange={onChange}
            className="w-full bg-transparent border-none p-0 text-main focus:outline-none font-medium"
            autoFocus={name === "bankName"}
          />
        ) : (
          <p className="text-muted font-medium w-full truncate">
            {displayValue || "—"}
          </p>
        )}

        {canToggle && !isEditing && (
          <button onClick={onToggle} className="text-muted ml-2">
            {reveal ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>
    </div>
  );
};

const normalizeBankAccounts = (accounts: any[]): BankAccount[] =>
  accounts.map((acc) => ({
    ...acc,
    // API returns default as "0"/"1" string — normalize to boolean
    isdefault:
      acc.default === "1" || acc.default === 1 || acc.isdefault === true,
  }));

interface Props {
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}

const BankDetails: React.FC<Props> = ({ bankAccounts, setBankAccounts }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedAccount, setSelectedAccount] = useState<number | null>(
    bankAccounts.length > 0 ? 0 : null,
  );

  const [showBankModal, setShowBankModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<BankAccount | null>(null);

  const [showAccountNumber, setShowAccountNumber] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    setIsEditing(false);
    if (selectedAccount !== null && bankAccounts[selectedAccount]) {
      setEditForm(bankAccounts[selectedAccount]);
    } else {
      setEditForm(null);
    }
  }, [selectedAccount, bankAccounts]);

  const handleAddSubmit = async (newAccount: BankAccount) => {
    try {
      showLoading("Adding Bank Account...");
      const updatedAccounts = [...bankAccounts, newAccount];

      const payload = {
        id: VITE_COMPANY_ID,
        bankAccounts: updatedAccounts.map((acc) => ({
          id: acc.id,
          accountNo: acc.accountNo,
          accountHolderName: acc.accountHolderName,
          bankName: acc.bankName,
          swiftCode: acc.swiftCode,
          sortCode: acc.sortCode,
          branchAddress: acc.branchAddress,
          currency: acc.currency,
          dateAdded: acc.dateAdded,
          openingBalance: acc.openingBalance,
          default: acc.isdefault ? 1 : 0,
        })),
      };

      await updateCompanyById(payload);
      closeSwal();
      showSuccess("Bank account added successfully.");

      setBankAccounts(updatedAccounts);
      setShowBankModal(false);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };
  const handleEditClick = () => {
    if (selectedAccount !== null && bankAccounts[selectedAccount]) {
      setEditForm(bankAccounts[selectedAccount]);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedAccount !== null) {
      setEditForm(bankAccounts[selectedAccount]);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm || selectedAccount === null) return;

    try {
      showLoading("Updating Bank Account...");
      const updatedAccounts = [...bankAccounts];
      updatedAccounts[selectedAccount] = editForm;

      const payload = {
        id: VITE_COMPANY_ID,
        bankAccounts: updatedAccounts.map((acc) => ({
          id: acc.id,
          accountNo: acc.accountNo,
          accountHolderName: acc.accountHolderName,
          bankName: acc.bankName,
          swiftCode: acc.swiftCode,
          sortCode: acc.sortCode,
          branchAddress: acc.branchAddress,
          currency: acc.currency,
          dateAdded: acc.dateAdded,
          openingBalance: acc.openingBalance,
          default: acc.isdefault ? 1 : 0,
        })),
      };

      await updateCompanyById(payload);

      closeSwal();
      showSuccess("Bank account updated successfully.");

      setBankAccounts(updatedAccounts);
      setIsEditing(false);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editForm) {
      setEditForm({ ...editForm, [e.target.name]: e.target.value });
    }
  };

  const handleDelete = async () => {
    if (selectedAccount === null) return;

    const accountName = bankAccounts[selectedAccount].bankName;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Bank Account?",
      text: `Are you sure you want to delete ${accountName}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting Bank Account...");

      const updatedAccounts = bankAccounts.filter(
        (_, index) => index !== selectedAccount,
      );

      const payload = {
        id: VITE_COMPANY_ID,
        bankAccounts: updatedAccounts.map((acc) => ({
          id: acc.id,
          accountNo: acc.accountNo,
          accountHolderName: acc.accountHolderName,
          bankName: acc.bankName,
          swiftCode: acc.swiftCode,
          sortCode: acc.sortCode,
          branchAddress: acc.branchAddress,
          currency: acc.currency,
          dateAdded: acc.dateAdded,
          openingBalance: acc.openingBalance,
          default: acc.isdefault ? 1 : 0,
        })),
      };

      await updateCompanyById(payload);

      closeSwal();
      showSuccess("Bank account deleted successfully.");

      setBankAccounts(updatedAccounts);
      setSelectedAccount(null);
      setIsEditing(false);
      setEditForm(null);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleSetDefault = async () => {
    if (selectedAccount === null) return;

    const selected = bankAccounts[selectedAccount];

    try {
      showLoading("Setting Default Account...");
      const payload = {
        id: VITE_COMPANY_ID,
        bankAccounts: [
          {
            id: selected.id,
            default: 1,
          },
        ],
      };

      await updateCompanyById(payload);

      closeSwal();
      showSuccess("Default account updated successfully.");

      setBankAccounts((prev) =>
        prev.map((acc) => ({
          ...acc,
          isdefault: acc.id === selected.id,
          default: acc.id === selected.id ? "1" : "0",
        })),
      );
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const normalizedAccounts = normalizeBankAccounts(bankAccounts);

  const filteredAccounts = normalizedAccounts.filter((acc) => {
    if (!acc.bankName?.trim()) return false;

    const bankName = acc.bankName ?? "";
    const accountNo = acc.accountNo ?? "";

    return (
      bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accountNo.includes(searchTerm)
    );
  });

  const getGlobalIndex = (filteredIndex: number) => {
    const acc = filteredAccounts[filteredIndex];
    if (!acc) return -1;

    return bankAccounts.findIndex((a) => a.id === acc.id);
  };

  const toggleAccountVisibility = (index: number) => {
    setShowAccountNumber((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="bg-card">
      {/* ADD MODAL */}
      {showBankModal && (
        <AddBankAccountModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      <div className="mx-auto">
        <div className="grid grid-cols-5 gap-6">
          {/* LEFT LIST */}
          <div className="col-span-2 bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-primary">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FaUniversity className="w-5 h-5" />
                Bank Accounts
              </h2>
            </div>

            <div className="p-4 space-y-3">
              {/* Search & Add */}
              <div
                className={`space-y-3 ${isEditing ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Find accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none bg-card text-main"
                  />
                </div>

                <button
                  onClick={() => setShowBankModal(true)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)",
                  }}
                >
                  <FaPlus className="w-4 h-4" />
                  Add New Account
                </button>
              </div>

              {/* Account List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm">
                    No accounts found
                  </div>
                ) : (
                  filteredAccounts.map((acc, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (!isEditing) {
                          const globalIndex = getGlobalIndex(i);
                          if (globalIndex !== -1) {
                            setSelectedAccount(globalIndex);
                          }
                        }
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAccount === getGlobalIndex(i)
                          ? " text-primary"
                          : "border bg-card hover:row-hover text-main"
                      } ${isEditing ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-main text-sm">
                            {acc.bankName}
                          </p>

                          {acc.isdefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Default
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted mt-1">
                          SWIFT: {acc.swiftCode}
                        </p>
                      </div>
                      <p className="text-xs text-muted font-mono truncate">
                        {acc.accountNo}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-3 bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-2 flex justify-between items-center bg-primary min-h-[52px]">
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? "Editing Account" : "Account Details"}
              </h2>

              {selectedAccount !== null && bankAccounts.length > 0 && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                      >
                        <FaCheck className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-md bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <FaTimes className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEditClick}
                        className="px-3 py-1.5 rounded-md text-white hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-medium"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                      >
                        <FaEdit className="w-3.5 h-3.5" /> Edit
                      </button>
                      {/* DELETE BUTTON WIRED UP HERE */}
                      <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 rounded-md text-white hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-medium"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                      >
                        <FaTrash className="w-3.5 h-3.5" /> Delete
                      </button>

                      <button
                        onClick={handleSetDefault}
                        disabled={
                          normalizedAccounts[selectedAccount]?.isdefault
                        }
                        className={`px-3 py-1.5 rounded-md text-white transition-colors flex items-center gap-2 text-sm font-medium ${
                          normalizedAccounts[selectedAccount]?.isdefault
                            ? "bg-gray-400 cursor-not-allowed"
                            : "hover:bg-white/20"
                        }`}
                        style={{
                          background: normalizedAccounts[selectedAccount]
                            ?.isdefault
                            ? "#9CA3AF"
                            : "rgba(255,255,255,0.12)",
                        }}
                      >
                        {normalizedAccounts[selectedAccount]?.isdefault
                          ? "Default Account"
                          : "Set Default"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {selectedAccount === null || bankAccounts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 rounded-full bg-app flex items-center justify-center mb-4 border-2 border-dashed border-[var(--border)]">
                  <FaUniversity className="w-10 h-10 text-muted opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-main mb-2">
                  No Account Selected
                </h3>
                <p className="text-muted">
                  Select an account from the list to view details
                </p>
              </div>
            ) : (
              <div className="p-6">
                {(() => {
                  const data = isEditing
                    ? editForm
                    : bankAccounts[selectedAccount];
                  if (!data) return null;

                  return (
                    <div className="grid grid-cols-2 gap-6">
                      <Detail
                        label="Bank Name"
                        name="bankName"
                        value={data.bankName}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <Detail
                        label="Account Holder"
                        name="accountHolderName"
                        value={data.accountHolderName}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <Detail
                        label="Account Number"
                        name="accountNo"
                        value={data.accountNo}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                        canToggle={true}
                        reveal={showAccountNumber[selectedAccount]}
                        onToggle={() =>
                          toggleAccountVisibility(selectedAccount)
                        }
                      />
                      <Detail
                        label="Swift/BIC Code"
                        name="swiftCode"
                        value={data.swiftCode}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <Detail
                        label="Sort Code"
                        name="sortCode"
                        value={data.sortCode}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <Detail
                        label="Currency"
                        name="currency"
                        value={data.currency}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <Detail
                        label="Opening Balance"
                        name="openingBalance"
                        value={data.openingBalance}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <Detail
                        label="Date Added"
                        name="dateAdded"
                        value={data.dateAdded}
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <div className="col-span-2">
                        <Detail
                          label="Branch Address"
                          name="branchAddress"
                          value={data.branchAddress}
                          isEditing={isEditing}
                          onChange={handleInputChange}
                        />
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

const FaCheck = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export default BankDetails;
