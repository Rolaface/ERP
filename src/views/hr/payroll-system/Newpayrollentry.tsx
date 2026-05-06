// NewPayrollEntry.tsx — 3-step payroll creation wizard.
// Extracted from PayrollManagement to keep the root thin.
import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Save,
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
import { Btn } from "./Ui";
import { OverviewTab } from "./EntryFormTabs";
import { EmployeesTab } from "./EmployeesTab";
import { AccountingTab } from "./Accountingtab";
import { getAllEmployees } from "../../../api/employeeapi";

interface Props {
  onBack: () => void;
  onSuccess: (
    empIds: string[],
    formData: PayrollEntry,
    docName?: string,
  ) => Promise<void>;
}

const TABS = [
  { label: "Overview", icon: <FileText className="w-3.5 h-3.5" /> },
  { label: "Employees", icon: <Users className="w-3.5 h-3.5" /> },
  { label: "Accounting", icon: <Settings className="w-3.5 h-3.5" /> },
];

const EMPTY_FORM: PayrollEntry = {
  payrollName: "",
  postingDate: new Date().toISOString().slice(0, 10),
  currency: DEFAULT_CURRENCY,
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  company: DEFAULT_COMPANY,
  payrollPayableAccount: DEFAULT_PAYROLL_PAYABLE_ACCOUNT,
  status: "Draft",
  salarySlipTimesheet: false,
  deductTaxForProof: false,
  payrollFrequency: "Monthly",
  startDate: "",
  endDate: "",
  paymentAccount: DEFAULT_PAYMENT_ACCOUNT,
  bankAccount: DEFAULT_BANK_ACCOUNT,
  costCenter: "",
  project: "",
  letterHead: "",
  selectedEmployees: [],
};

export const NewPayrollEntry: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PayrollEntry>(EMPTY_FORM);

  const update = (field: string, value: unknown) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setSaved(false);
    setSubmitError(null);
  };

  const handleSaveDraft = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSubmit = async () => {
    if (!formData.selectedEmployees.length) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // API call is delegated to parent via onSuccess; parent builds + posts payload
      await onSuccess(formData.selectedEmployees, formData);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create payroll entry.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Employees list for EmployeesTab — in production pass from parent/API
  const [employees, setEmployees] = useState<any[]>([]);
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const resp = await getAllEmployees();

        const raw = resp?.message?.data || resp?.data || [];

        const mapped = raw.map((emp: any) => ({
          id: emp.name,
          name: emp.employee_name,
          department: emp.department || "-",
          designation: emp.designation || "-",
          basicSalary: Number(emp.basic_salary || 0),
          hra: Number(emp.hra || 0),
          allowances: Number(emp.allowances || 0),
          isActive: emp.status === "Active",
        }));

        setEmployees(mapped);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-app overflow-hidden">
      <header className="h-12 shrink-0 bg-card border-b border-theme px-5 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-app text-muted hover:text-main transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-theme opacity-40" />
          <span className="text-sm font-extrabold text-main">
            New Payroll Entry
          </span>
          <span className="text-xs text-muted opacity-60">
            · Fill all details to create a payroll run
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved ? (
            <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Saved
            </span>
          ) : (
            <span className="text-xs text-muted bg-app border border-theme px-2.5 py-1 rounded-full">
              Unsaved
            </span>
          )}
          <Btn
            variant="outline"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSaveDraft}
          >
            Save Draft
          </Btn>
        </div>
      </header>

      <div className="flex-1 min-h-0 px-6 py-4 flex flex-col">
        <div className="flex-1 min-h-0 bg-card border border-theme rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Step tabs */}
          <div className="shrink-0 flex items-center border-b border-theme px-6">
            {TABS.map((t, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 -mb-px transition-all ${
                    i === step
                      ? "text-primary border-primary"
                      : i < step
                        ? "text-success border-transparent hover:border-theme"
                        : "text-muted border-transparent hover:text-main"
                  }`}
                >
                  {i < step ? (
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                        i === step
                          ? "bg-primary text-white"
                          : "bg-app border border-theme text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                  {t.label}
                </button>
                {i < TABS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 opacity-30 max-w-[60px] ${i < step ? "bg-success" : "bg-theme"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {step === 0 && <OverviewTab data={formData} onChange={update} />}
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

          {submitError && (
            <div className="shrink-0 mx-6 mb-3 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger font-semibold">
              ⚠ {submitError}
            </div>
          )}

          {/* Footer navigation */}
          <div className="shrink-0 border-t border-theme px-6 py-3 bg-app flex items-center justify-between">
            <Btn
              variant="outline"
              size="sm"
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
              onClick={() => setStep((p) => Math.max(0, p - 1))}
              disabled={step === 0 || submitting}
            >
              Previous
            </Btn>

            <div className="flex items-center gap-1.5">
              {TABS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === step
                      ? "w-5 h-2 bg-primary"
                      : i < step
                        ? "w-2 h-2 bg-success"
                        : "w-2 h-2 bg-theme"
                  }`}
                />
              ))}
            </div>

            {step === TABS.length - 1 ? (
              <Btn
                variant="success"
                size="sm"
                icon={
                  submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )
                }
                onClick={handleSubmit}
                disabled={!formData.selectedEmployees.length || submitting}
              >
                {submitting
                  ? "Creating…"
                  : `Create Payroll (${formData.selectedEmployees.length})`}
              </Btn>
            ) : (
              <Btn
                size="sm"
                onClick={() => setStep((p) => Math.min(TABS.length - 1, p + 1))}
                disabled={submitting}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
