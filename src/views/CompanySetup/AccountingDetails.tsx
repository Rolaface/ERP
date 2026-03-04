import React, { useEffect, useState } from "react";
import {
  FaDollarSign,
  FaChartArea,
  FaSyncAlt,
  FaBullseye,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCoins,
  FaSave,
  FaUndo,
} from "react-icons/fa";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import Swal from "sweetalert2";

import type { AccountingSetup, FinancialConfig } from "../../types/company";
import { updateCompanyById } from "../../api/companySetupApi";

const defaultForm = {
  accountingSetup: {
    chartOfAccounts: "",
    defaultExpenseGL: "",
    fxGainLossAccount: "",
    revaluationFrequency: "Monthly",
    roundOffAccount: "",
    roundOffCostCenter: "",
    depreciationAccount: "",
    appreciationAccount: "",
  },
  financialConfig: {
    baseCurrency: "INR",
    financialYearStart: "April",
  },
};
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const VITE_COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  icon: Icon,
  required = false,
  placeholder = "",
  value,
  onChange,
}) => (
  <div className="relative">
    <label className="block text-sm font-medium text-muted mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>

    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4 z-10" />
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full border bg-theme rounded-lg ${
          Icon ? "pl-10" : "pl-3.5"
        } pr-3.5 py-2.5 text-sm`}
      />
    </div>
  </div>
);

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: SelectOption[];
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  icon: Icon,
  required = false,
  value,
  onChange,
}) => (
  <div>
    <label className="block text-sm font-medium text-muted mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>

    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
      )}

      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full border bg-theme rounded-lg ${
          Icon ? "pl-10" : "pl-3.5"
        } pr-10 py-2.5 text-sm`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

interface AccountingDetailsProps {
  financialConfig?: FinancialConfig | null;
  accountingSetup?: AccountingSetup | null;
}

const AccountingDetails: React.FC<AccountingDetailsProps> = ({
  financialConfig,
  accountingSetup,
}) => {
  const [activeTab, setActiveTab] = useState("financial");

  const [form, setForm] = useState(() => ({
    accountingSetup: {
      ...defaultForm.accountingSetup,
      ...(accountingSetup || {}),
    },
    financialConfig: {
      ...defaultForm.financialConfig,
      ...(financialConfig || {}),
    },
  }));

  useEffect(() => {
    if (accountingSetup || financialConfig) {
      setForm((prev) => ({
        accountingSetup: {
          ...prev.accountingSetup,
          ...(accountingSetup || {}),
        },
        financialConfig: {
          ...prev.financialConfig,
          ...(financialConfig || {}),
        },
      }));
    }
  }, [accountingSetup, financialConfig]);

  const handleChange = (
    section: "accountingSetup" | "financialConfig",
    key: string,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };
  const handleSubmit = async () => {
    const payload = {
      id: VITE_COMPANY_ID,
      accountingSetup: form.accountingSetup,
      financialConfig: form.financialConfig,
    };

    try {
      showLoading("Saving Accounting Settings...");

      await updateCompanyById(payload);

      closeSwal();
      showSuccess("Accounting settings updated successfully.");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Reset All Fields?",
      text: "This will clear all entered accounting settings.",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reset",
    });

    if (!result.isConfirmed) return;

    setForm(defaultForm);
    showSuccess("Form reset successfully.");
  };

  const renderInput = (
    label: string,
    name: string,
    section: "accountingSetup" | "financialConfig",
    options: Partial<InputFieldProps> = {},
  ) => {
    return (
      <InputField
        key={name}
        label={label}
        name={name}
        value={(form[section] as any)[name] || ""}
        onChange={(e) => handleChange(section, name, e.target.value)}
        {...options}
      />
    );
  };

  const renderSelect = (
    label: string,
    name: string,
    section: "accountingSetup" | "financialConfig",
    optionsList: SelectOption[],
    options: Partial<SelectFieldProps> = {},
  ) => {
    return (
      <SelectField
        key={name}
        label={label}
        name={name}
        options={optionsList}
        value={(form[section] as any)[name] || ""}
        onChange={(e) => handleChange(section, name, e.target.value)}
        {...options}
      />
    );
  };

  return (
    <div className="w-full">
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {/* TABS */}
        <div className="bg-app border-b flex">
          {[
            { id: "financial", label: "Financial Config", icon: FaCoins },
            { id: "accounts", label: "Account Setup", icon: FaDollarSign },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === t.id
                  ? "table-head text-table-head-text"
                  : "text-main"
              }`}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="p-8">
          {activeTab === "financial" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderSelect(
                "Base Currency",
                "baseCurrency",
                "financialConfig",
                [
                  { value: "INR", label: "INR - Indian Rupee" },
                  { value: "USD", label: "USD - US Dollar" },
                  { value: "EUR", label: "EUR - Euro" },
                ],
                { icon: FaDollarSign, required: true },
              )}

              {renderSelect(
                "Financial Year",
                "financialYearStart",
                "financialConfig",
                [
                  { value: "January", label: "January" },
                  { value: "April", label: "April" },
                  { value: "July", label: "July" },
                  { value: "October", label: "October" },
                ],
                { icon: FaCalendarAlt, required: true },
              )}
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <FaDollarSign className="text-primary" />
                  General Accounts
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput(
                    "Chart of Accounts",
                    "chartOfAccounts",
                    "accountingSetup",
                    { icon: FaMoneyBillWave, required: true },
                  )}
                  {renderInput(
                    "Default Expense GL",
                    "defaultExpenseGL",
                    "accountingSetup",
                    { icon: FaMoneyBillWave },
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <FaSyncAlt className="text-primary" />
                  Foreign Exchange
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput(
                    "FX Gain/Loss Account",
                    "fxGainLossAccount",
                    "accountingSetup",
                    { icon: FaDollarSign },
                  )}

                  {renderSelect(
                    "Revaluation Frequency",
                    "revaluationFrequency",
                    "accountingSetup",
                    [
                      { value: "Daily", label: "Daily" },
                      { value: "Weekly", label: "Weekly" },
                      { value: "Monthly", label: "Monthly" },
                      { value: "Quarterly", label: "Quarterly" },
                    ],
                    { icon: FaCalendarAlt },
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <FaBullseye className="text-primary" />
                  Rounding
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput(
                    "Round-Off Account",
                    "roundOffAccount",
                    "accountingSetup",
                    { icon: FaBullseye },
                  )}
                  {renderInput(
                    "Round-Off Cost Center",
                    "roundOffCostCenter",
                    "accountingSetup",
                    { icon: FaBullseye },
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <FaChartArea className="text-primary" />
                  Asset Valuation
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput(
                    "Depreciation Account",
                    "depreciationAccount",
                    "accountingSetup",
                    { icon: FaChartArea },
                  )}
                  {renderInput(
                    "Appreciation Account",
                    "appreciationAccount",
                    "accountingSetup",
                    { icon: FaChartArea },
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-app px-8 py-4 border-t flex justify-between">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-lg border flex items-center gap-2"
          >
            <FaUndo />
            Reset All
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-primary text-white flex items-center gap-2"
          >
            <FaSave />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountingDetails;
