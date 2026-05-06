import React, {
  useState,
  useMemo,
  useEffect,
} from "react";
import { Plus, Zap, BarChart3, FileText, Layers } from "lucide-react";
import {
  createPayrollEntry,
  getAllPayrollEntries,
  runPayrollEntry,
} from "../../../api/payroll/payrollEntryApi";
import type { CreatePayrollEntryPayload } from "../../../api/payroll/payrollEntryApi";
import {
  showSuccess,
  showApiError,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import type { PayrollRecord, PayrollEntry } from "../../../types/payrolltypes";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import {
  generatePayrollRecord,
  recalculatePayroll,
  runPayrollValidation,
} from "./utils";

// ── Sub-views ─────────────────────────────────────────────────────────────────
import { PayrollDashboard }  from "./Payrolldashboard ";
import { NewPayrollEntry }   from "./Newpayrollentry";
import { EmployeeDetailPage } from "./Employeedetailpage";

// ── Modals ────────────────────────────────────────────────────────────────────
import { PayslipModal }           from "./PayslipModal";
import EditEmployeePayrollModal   from "./EditEmployeePayrollModal";
import { QuickCreateModal }       from "../../../components/Hr/payrollmodal/QuickCreatePayrollModal";
import { PayrollValidationModal } from "../../../components/Hr/payrollmodal/payrollvalidationmodal";

import { Btn } from "./Ui";

// ─────────────────────────────────────────────────────────────────────────────
// PAYLOAD BUILDER
// ─────────────────────────────────────────────────────────────────────────────
const buildPayload = (
  formData: PayrollEntry,
  empIds: string[],
): CreatePayrollEntryPayload => ({
  payroll_frequency:       formData.payrollFrequency || "Monthly",
  posting_date:            formData.postingDate,
  start_date:              formData.startDate,
  end_date:                formData.endDate,
  exchange_rate:           formData.exchangeRate ?? 1,
  payroll_payable_account: formData.payrollPayableAccount,
  payment_account:         formData.paymentAccount,
  bank_account:            formData.bankAccount ?? "",
  employees:               empIds.map((id) => ({ employee: id, is_salary_withheld: 0 })),
  ...(formData.costCenter ? { cost_center: formData.costCenter } : {}),
  ...(formData.project    ? { project: formData.project }        : {}),
  ...(formData.currency   ? { currency: formData.currency }      : {}),
  deduct_tax_for_unsubmitted_tax_exemption_proof: formData.deductTaxForProof    ? 1 : 0,
  salary_slip_based_on_timesheet:                 formData.salarySlipTimesheet  ? 1 : 0,
  validate_attendance: 0,
  validate_holidays:   0,
});

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAV
// ─────────────────────────────────────────────────────────────────────────────
type View = "dashboard" | "newEntry" | "reports";

const TopBar: React.FC<{
  view:          View;
  setView:       (v: View) => void;
  onQuickCreate: () => void;
  onNewPayroll:  () => void;
}> = ({ view, setView, onQuickCreate, onNewPayroll }) => {
  const nav: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: "reports",   label: "Reports",   icon: <FileText  className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-12 shrink-0 bg-card border-b border-theme px-5 flex items-center justify-between z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-extrabold text-main">Payroll</span>
        </div>
        <span className="text-muted opacity-30 select-none">|</span>
        <nav className="flex items-center gap-0.5">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === item.id
                  ? "bg-app text-primary border border-theme"
                  : "text-muted hover:text-main hover:bg-app"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Btn
          variant="outline"
          size="sm"
          icon={<Zap className="w-3.5 h-3.5" />}
          onClick={onQuickCreate}
        >
          Quick Create
        </Btn>
        <Btn
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={onNewPayroll}
        >
          New Payroll
        </Btn>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function PayrollManagement() {
  const [view,            setView]           = useState<View>("dashboard");
  const [payrollRecords,  setPayrollRecords]  = useState<PayrollRecord[]>([]);
  const [loading,         setLoading]         = useState(false);

  // Modal state
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showValidation,   setShowValidation]   = useState(false);
  const [selectedRecord,   setSelectedRecord]   = useState<PayrollRecord | null>(null);
  const [editingRecord,    setEditingRecord]     = useState<PayrollRecord | null>(null);
  const [detailRecord,     setDetailRecord]      = useState<PayrollRecord | null>(null);
  const [selectedEmpIds,   setSelectedEmpIds]    = useState<string[]>([]);
  const [validationResult, setValidationResult]  = useState<ReturnType<typeof runPayrollValidation> | null>(null);
  const [isProcessing,     setIsProcessing]      = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadPayrollEntries = async () => {
    try {
      setLoading(true);
      const resp = await getAllPayrollEntries();
      setPayrollRecords(resp?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollEntries();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreatePayroll = async (
    empIds: string[],
    formData?: PayrollEntry,
  ) => {
    if (!empIds.length) return;
    try {
      showLoading("Creating Payroll");
      if (formData) {
        const payload = buildPayload(formData, empIds);
        const created = await createPayrollEntry(payload);
        if (!created) throw new Error("Payroll creation failed");
      }
      await loadPayrollEntries();
      setSelectedEmpIds([]);
      setShowCreateModal(false);
      closeSwal();
      showSuccess(
        `Payroll created for ${empIds.length} employee${empIds.length > 1 ? "s" : ""}`,
      );
    } catch (error) {
      closeSwal();
      console.error(error);
      showApiError(error);
    }
  };

  const pendingRecords = payrollRecords.filter((r) => r.status === "Pending");

  const handleRunPayroll = async (id: string) => {
    try {
      showLoading("Running Payroll");
      await runPayrollEntry(id);
      closeSwal();
      showSuccess("Payroll executed successfully");
      await loadPayrollEntries();
    } catch (error) {
      closeSwal();
      console.error(error);
      showApiError(error);
    }
  };

  const handleConfirmPayroll = () => {
    setIsProcessing(true);
    const ids = pendingRecords.map((r) => r.id);
    setPayrollRecords((p) =>
      p.map((r) =>
        ids.includes(r.id) ? { ...r, status: "Processing" as const } : r,
      ),
    );
    setTimeout(() => {
      setPayrollRecords((p) =>
        p.map((r) =>
          ids.includes(r.id)
            ? {
                ...r,
                status:      "Paid" as const,
                paymentDate: new Date().toLocaleDateString("en-IN"),
              }
            : r,
        ),
      );
      setIsProcessing(false);
      setShowValidation(false);
      setValidationResult(null);
      showSuccess(
        `Payroll processed for ${ids.length} employee${ids.length > 1 ? "s" : ""}.`,
      );
    }, 2500);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    const updated = recalculatePayroll(editingRecord);
    setPayrollRecords((p) => p.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRecord(null);
    showSuccess("Salary updated and recalculated");
  };

  const availableEmployees = useMemo(() => [], []);

  const topBarProps = {
    view,
    setView,
    onQuickCreate: () => setShowCreateModal(true),
    onNewPayroll:  () => setShowPayrollModal(true),
  };

  // ── Alternate views ────────────────────────────────────────────────────────
  if (view === "reports")
    return (
      <div className="h-screen flex flex-col bg-app overflow-hidden">
        <TopBar {...topBarProps} />
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* <PayrollReports records={payrollRecords} /> */}
        </div>
      </div>
    );

  if (detailRecord)
    return (
      <EmployeeDetailPage
        records={payrollRecords}
        initialRecord={detailRecord}
        onBack={() => setDetailRecord(null)}
        onViewPayslip={(r) => setSelectedRecord(r)}
      />
    );

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-app overflow-hidden">
      <TopBar {...topBarProps} />

      <PayrollDashboard
        records={payrollRecords}
        onRunPayroll={handleRunPayroll}
        onViewPayslip={(r) => setSelectedRecord(r)}
        onEditRecord={(r) => setEditingRecord({ ...r })}
        onViewDetails={(r) => setDetailRecord(r)}
      />

    
      <MinimizableModal
        modalId="new-payroll-modal"
        isOpen={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        title="New Payroll Entry"
        subtitle="Create payroll entries"
        maxWidth="6xl"
        height="90vh"
      >
        <NewPayrollEntry
          onBack={() => setShowPayrollModal(false)}
          onSuccess={async (empIds, formData, docName) => {
            await handleCreatePayroll(empIds, formData);
            await loadPayrollEntries();
            setShowPayrollModal(false);
            if (docName) showSuccess(`Created: ${docName}`);
          }}
        />
      </MinimizableModal>

      {/* ── Quick Create Modal ───────────────────────────────────────────── */}
      <QuickCreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        employees={availableEmployees}
        selectedEmployees={selectedEmpIds}
        onToggleEmployee={(id) =>
          setSelectedEmpIds((p) =>
            p.includes(id) ? p.filter((i) => i !== id) : [...p, id],
          )
        }
        onSelectAll={() => {
          const all = availableEmployees
            .filter((e: { isActive: boolean }) => e.isActive)
            .map((e: { id: string }) => e.id);
          setSelectedEmpIds(selectedEmpIds.length === all.length ? [] : all);
        }}
        onCreate={() => handleCreatePayroll(selectedEmpIds)}
      />

      {/* ── Edit Employee Payroll Modal ──────────────────────────────────── */}
      <EditEmployeePayrollModal
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
        onChange={(field, val) =>
          setEditingRecord((p) => (p ? { ...p, [field]: val } : null))
        }
      />

      {/* ── Validation Modal ─────────────────────────────────────────────── */}
      <PayrollValidationModal
        show={showValidation}
        result={validationResult}
        isRunning={isProcessing}
        onClose={() => {
          setShowValidation(false);
          setValidationResult(null);
        }}
        onProceed={handleConfirmPayroll}
        onRevalidate={() =>
          setValidationResult(runPayrollValidation(pendingRecords))
        }
      />

      {/* ── Payslip Modal ────────────────────────────────────────────────── */}
      <PayslipModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onDownload={() =>
          showSuccess(`Payslip downloaded for ${selectedRecord?.employeeName}`)
        }
        onEmail={() =>
          showSuccess(`Payslip emailed to ${selectedRecord?.email}`)
        }
      />
    </div>
  );
}