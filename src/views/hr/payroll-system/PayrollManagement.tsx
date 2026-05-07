import { useState, useMemo, useEffect } from "react";

import {
  createPayrollEntry,
  getAllPayrollEntries,
  runPayrollEntry,
} from "../../../api/payroll/payrollEntryApi";
import type { CreatePayrollEntryPayload } from "../../../api/payroll/payrollEntryApi";
import { openPayrollModal } from "../../../store/modalStore";
import {
  showSuccess,
  showApiError,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import type { PayrollRecord, PayrollEntry } from "../../../types/payrolltypes";
import { runPayrollValidation } from "./utils";

// ── Sub-views ─────────────────────────────────────────────────────────────────
import { PayrollDashboard } from "./Payrolldashboard ";

import { EmployeeDetailPage } from "./Employeedetailpage";

// ── Modals ────────────────────────────────────────────────────────────────────
import { PayslipModal } from "./PayslipModal";

import { QuickCreateModal } from "../../../components/Hr/payrollmodal/QuickCreatePayrollModal";
import { PayrollValidationModal } from "../../../components/Hr/payrollmodal/payrollvalidationmodal";

// ─────────────────────────────────────────────────────────────────────────────
// PAYLOAD BUILDER
// ─────────────────────────────────────────────────────────────────────────────
const buildPayload = (
  formData: PayrollEntry,
  empIds: string[],
): CreatePayrollEntryPayload => ({
  payroll_frequency: formData.payrollFrequency || "Monthly",
  posting_date: formData.postingDate,
  start_date: formData.startDate,
  end_date: formData.endDate,
  exchange_rate: formData.exchangeRate ?? 1,
  payroll_payable_account: formData.payrollPayableAccount,
  payment_account: formData.paymentAccount,
  bank_account: formData.bankAccount ?? "",
  employees: empIds.map((id) => ({ employee: id, is_salary_withheld: 0 })),
  ...(formData.costCenter ? { cost_center: formData.costCenter } : {}),
  ...(formData.project ? { project: formData.project } : {}),
  ...(formData.currency ? { currency: formData.currency } : {}),
  deduct_tax_for_unsubmitted_tax_exemption_proof: formData.deductTaxForProof
    ? 1
    : 0,
  salary_slip_based_on_timesheet: formData.salarySlipTimesheet ? 1 : 0,
  validate_attendance: 0,
  validate_holidays: 0,
});

export default function PayrollManagement() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showValidation, setShowValidation] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(
    null,
  );

  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ReturnType<
    typeof runPayrollValidation
  > | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
                status: "Paid" as const,
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

  const availableEmployees = useMemo(() => [], []);

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
    <PayrollDashboard
  records={payrollRecords}
  loading={loading}
  onQuickCreate={() => setShowCreateModal(true)}
  onNewPayroll={() =>
    openPayrollModal(null, false, {
      onSubmit: async ({ empIds, formData }: any) => {
        await handleCreatePayroll(empIds, formData);
        await loadPayrollEntries();
      },
    })
  }
  onRunPayroll={handleRunPayroll}
        onViewPayslip={(r) => setSelectedRecord(r)}
        onEditRecord={(r) => {
          openPayrollModal(r, true, {
            onSubmit: async ({ formData }: any) => {
              console.log("Update Payroll", formData);

              await loadPayrollEntries();

              showSuccess("Payroll updated successfully");
            },
          });
        }}
        onViewDetails={(r) => setDetailRecord(r)}
      />

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
