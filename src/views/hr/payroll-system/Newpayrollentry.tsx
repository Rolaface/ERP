import React, { useEffect, useState } from "react";
import { FileText, Users } from "lucide-react";
import { FaMoneyCheckAlt } from "react-icons/fa";
import type { PayrollEntry } from "../../../types/Payroll/payrolltypes";
import {
  DEFAULT_COMPANY,
  DEFAULT_PAYROLL_PAYABLE_ACCOUNT,
  DEFAULT_PAYMENT_ACCOUNT,
  DEFAULT_BANK_ACCOUNT,
  DEFAULT_CURRENCY,
  DEFAULT_EXCHANGE_RATE,
} from "../../../utils/payroll_Utils/constants";
import { OverviewTab } from "./EntryFormTabs";
import { EmployeesTab } from "./EmployeesTab";
import { getAllEmployees } from "../../../api/employeeapi";
import { getCompanyDefaults, getCompanyAccounts } from "../../../api/companySetupApi";
import ModalFooter from "../../../components/common/ModalFooter";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { useUnsavedChangesGuard } from "../../../hooks/useUnsavedChangesGuard";

interface Props {
  modalId: string;
  isOpen: boolean;
  onBack: () => void;
  onSuccess: (empIds: string[], formData: PayrollEntry, docName?: string) => Promise<void>;
  initialData?: PayrollEntry | null;
  isEdit?: boolean;
}

const TABS: { label: string; icon: React.ReactNode }[] = [
  { label: "Overview", icon: <FileText className="w-3.5 h-3.5" /> },
  { label: "Employees", icon: <Users className="w-3.5 h-3.5" /> },
];

const EMPTY_FORM: PayrollEntry = {
  payrollName: "",
  postingDate: new Date().toISOString().slice(0, 10),
  currency: DEFAULT_CURRENCY,
  payrollMonth: "",
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  company: DEFAULT_COMPANY,
  payrollPayableAccount: DEFAULT_PAYROLL_PAYABLE_ACCOUNT,
  payrollPayableAccountLabel: "",
  status: "Draft",
  salarySlipTimesheet: false,
  deductTaxForProof: false,
  payrollFrequency: "Monthly",
  startDate: "",
  endDate: "",
  paymentAccount: DEFAULT_PAYMENT_ACCOUNT,
  paymentAccountLabel: "",
  bankAccount: DEFAULT_BANK_ACCOUNT,
  costCenter: "",
  project: "",
  letterHead: "",
  selectedEmployees: [],
};

const NewPayrollEntry: React.FC<Props> = ({
  modalId, isOpen, onBack, onSuccess, initialData, isEdit,
}) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PayrollEntry>({
    ...EMPTY_FORM,
    ...initialData,
    selectedEmployees: initialData?.selectedEmployees || [],
    employeeStubs: initialData?.employeeStubs || [],
  });
  const [employees, setEmployees] = useState<any[]>([]);

  const { resetDirty, handleCloseWithConfirm, containerRef, markDirty, activate, deactivate } =
    useUnsavedChangesGuard();

  const isLastStep = step === TABS.length - 1;

  const handleClose = () => {
    if (submitting) return;
    handleCloseWithConfirm(onBack, modalId);
  };

  useEffect(() => {
    if (!isOpen) { deactivate(); resetDirty(); }
    else return activate();
  }, [isOpen]);

  const update = (field: string, value: unknown) => {
    markDirty();
    setFormData((p) => ({ ...p, [field]: value }));
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (submitting || !formData.selectedEmployees.length) return false;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSuccess(formData.selectedEmployees, formData);
      resetDirty();
      return true;
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create payroll entry.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [empResp, defaultsResp, accountsResp] = await Promise.all([
          getAllEmployees(),
          getCompanyDefaults().catch(() => null),
          getCompanyAccounts().catch(() => null),
        ]);

        const raw = empResp?.message?.data || empResp?.data || [];
        setEmployees(
          raw.map((emp: any) => ({
            id: emp.name,
            name: emp.employee_name,
            department: emp.department || "-",
            designation: emp.designation || "-",
            basicSalary: Number(emp.basic_salary || 0),
            hra: Number(emp.hra || 0),
            allowances: Number(emp.allowances || 0),
            isActive: emp.status === "Active",
          })),
        );

        if (!isEdit && defaultsResp) {
          const defaultsData = defaultsResp?.message?.data || defaultsResp?.data;
          let accountsData: any[] = [];
          if (Array.isArray(accountsResp)) accountsData = accountsResp;
          else if (Array.isArray(accountsResp?.data)) accountsData = accountsResp.data;
          else if (Array.isArray(accountsResp?.message?.data)) accountsData = accountsResp.message.data;
          else if (Array.isArray(accountsResp?.message)) accountsData = accountsResp.message;

          if (defaultsData?.default_payroll_payable_account) {
            const defaultId = defaultsData.default_payroll_payable_account;
            let finalValue = defaultId;
            let finalLabel = defaultId;
            const matched = accountsData.find(
              (acc: any) => acc.name === defaultId || acc.value === defaultId || acc.id === defaultId,
            );
            if (matched) {
              finalValue = matched.value || matched.name || matched.id || defaultId;
              finalLabel = matched.label || matched.account_name || matched.name || defaultId;
            } else if (defaultId.includes(" - ")) {
              finalLabel = defaultId.split(" - ")[0].trim();
            }

            setFormData((prev) => {
              const shouldOverride =
                !prev.payrollPayableAccount ||
                prev.payrollPayableAccount === DEFAULT_PAYROLL_PAYABLE_ACCOUNT;
              return shouldOverride
                ? { ...prev, payrollPayableAccount: finalValue, payrollPayableAccountLabel: finalLabel }
                : prev;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    })();
  }, [isEdit]);

  const footer = (
    <ModalFooter
      onCancel={handleClose}
      onNext={!isLastStep ? () => setStep((p) => Math.min(TABS.length - 1, p + 1)) : undefined}
      onSubmit={isLastStep ? handleSubmit : undefined}
      currentTab={step}
      totalTabs={TABS.length}
      isSubmitting={submitting}
      nextLabel="Next"
      submitLabel={isEdit ? "Update Payroll" : `Submit (${formData.selectedEmployees.length})`}
      submitDisabled={!formData.selectedEmployees.length}
    />
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      icon={FaMoneyCheckAlt}
      title={isEdit ? "Edit Payroll Entry" : "Add Payroll Entry"}
      subtitle="Add payroll entries"
      maxWidth="6xl"
      height="90vh"
      footer={footer}
      formContainerRef={containerRef}
    >
  

      {/* Tab bar — fixed height, never scrolls */}
      <div className="bg-app border-b border-theme px-4 sm:px-8 shrink-0">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-none">
          {TABS.map((t, i) => {
            const isActive = i === step;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setStep(i)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-2
                  ${isActive
                    ? "text-primary border-b-[3px] border-primary"
                    : "text-muted border-b-[3px] border-transparent hover:text-main"
                  }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab panels — fill all remaining modal height, no outer scroll */}
      <div className="flex-1 min-h-0 bg-app">

        {/* Overview — short form, needs its own scroll for small viewports */}
        <div
          className="h-full overflow-y-auto p-4 sm:p-5"
          style={{ display: step === 0 ? "block" : "none" }}
        >
          <OverviewTab data={formData} onChange={update} isEditMode={!!isEdit} />
        </div>

     
        <div
          className="h-full flex flex-col p-4 sm:p-5"
          style={{ display: step === 1 ? "flex" : "none" }}
        >
          <EmployeesTab
            data={formData}
            onChange={update}
            isEditMode={!!isEdit}
          />
        </div>

      </div>
    </MinimizableModal>
  );
};

export default NewPayrollEntry;