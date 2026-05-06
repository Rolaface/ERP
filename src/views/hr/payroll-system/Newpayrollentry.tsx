// NewPayrollEntry.tsx — 3-step payroll creation wizard.
// Designed to live INSIDE MinimizableModal (which already provides the shell).
// Pattern mirrors AddEmployeeModal: tab bar + scrollable content + footer nav.

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Users,
  Settings,
} from "lucide-react";
import type { PayrollEntry } from "../../../types/payrolltypes";
import {
  DEFAULT_COMPANY,
  DEFAULT_PAYROLL_PAYABLE_ACCOUNT,
  DEFAULT_PAYMENT_ACCOUNT,
  DEFAULT_BANK_ACCOUNT,
  DEFAULT_CURRENCY,
  DEFAULT_EXCHANGE_RATE,
} from "./constants";
import { OverviewTab } from "./EntryFormTabs";
import { EmployeesTab } from "./EmployeesTab";
import { AccountingTab } from "./Accountingtab";
import { getAllEmployees } from "../../../api/employeeapi";
import ModalFooter from "../../../components/common/ModalFooter";

interface Props {
  onBack: () => void;
  onSuccess: (
    empIds: string[],
    formData: PayrollEntry,
    docName?: string,
  ) => Promise<void>;
}

const TABS: { label: string; icon: React.ReactNode }[] = [
  { label: "Overview",   icon: <FileText  className="w-3.5 h-3.5" /> },
  { label: "Employees",  icon: <Users     className="w-3.5 h-3.5" /> },
  { label: "Accounting", icon: <Settings  className="w-3.5 h-3.5" /> },
];

const EMPTY_FORM: PayrollEntry = {
  payrollName:             "",
  postingDate:             new Date().toISOString().slice(0, 10),
  currency:                DEFAULT_CURRENCY,
  exchangeRate:            DEFAULT_EXCHANGE_RATE,
  company:                 DEFAULT_COMPANY,
  payrollPayableAccount:   DEFAULT_PAYROLL_PAYABLE_ACCOUNT,
  status:                  "Draft",
  salarySlipTimesheet:     false,
  deductTaxForProof:       false,
  payrollFrequency:        "Monthly",
  startDate:               "",
  endDate:                 "",
  paymentAccount:          DEFAULT_PAYMENT_ACCOUNT,
  bankAccount:             DEFAULT_BANK_ACCOUNT,
  costCenter:              "",
  project:                 "",
  letterHead:              "",
  selectedEmployees:       [],
};

export const NewPayrollEntry: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [step,        setStep]        = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData,    setFormData]    = useState<PayrollEntry>(EMPTY_FORM);
  const [employees,   setEmployees]   = useState<any[]>([]);

  const isLastStep = step === TABS.length - 1;

  const update = (field: string, value: unknown) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!formData.selectedEmployees.length) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSuccess(formData.selectedEmployees, formData);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create payroll entry.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await getAllEmployees();
        const raw  = resp?.message?.data || resp?.data || [];
        setEmployees(
          raw.map((emp: any) => ({
            id:          emp.name,
            name:        emp.employee_name,
            department:  emp.department   || "-",
            designation: emp.designation  || "-",
            basicSalary: Number(emp.basic_salary || 0),
            hra:         Number(emp.hra          || 0),
            allowances:  Number(emp.allowances   || 0),
            isActive:    emp.status === "Active",
          })),
        );
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    })();
  }, []);

  
  return (
    <div className="flex flex-col h-full -mx-4 -my-3 overflow-hidden">

      {/* ── Step tab bar (matches AddEmployeeModal's tab bar style) ── */}
      <div className="flex border-b border-theme bg-card px-1.5 overflow-x-auto flex-shrink-0">
        {TABS.map((t, i) => {
          const isDone   = i < step;
          const isActive = i === step;
          return (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-semibold whitespace-nowrap transition flex-shrink-0 border-b-2 ${
                isActive
                  ? "text-primary border-primary"
                  : isDone
                    ? "text-success border-transparent hover:border-theme"
                    : "text-muted border-transparent hover:text-main"
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-app border border-theme text-muted"
                  }`}
                >
                  {i + 1}
                </span>
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Scrollable tab content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-app p-5">
        {step === 0 && <OverviewTab   data={formData} onChange={update} />}
        {step === 1 && (
          <EmployeesTab
            data={formData}
            onChange={update}
            employees={employees}
          />
        )}
        {step === 2 && (
          <AccountingTab
            data={formData}
            onChange={update}
            employees={employees}
          />
        )}
      </div>

      {/* ── Error banner ── */}
      {submitError && (
        <div className="shrink-0 mx-5 mb-0 px-4 py-2.5 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger font-semibold">
          ⚠ {submitError}
        </div>
      )}

    <div className="shrink-0 border-t border-theme bg-app px-5 py-3">
  <ModalFooter
    onCancel={onBack}
    onNext={
      !isLastStep
        ? () =>
            setStep((p) =>
              Math.min(
                TABS.length - 1,
                p + 1,
              ),
            )
        : undefined
    }
    onSubmit={
      isLastStep
        ? handleSubmit
        : undefined
    }
    currentTab={step}
    totalTabs={TABS.length}
    isSubmitting={submitting}
    nextLabel="Next"
    submitLabel={`Create Payroll (${formData.selectedEmployees.length})`}
    submitDisabled={
      !formData.selectedEmployees.length
    }
  />
</div>
    </div>
  );
};