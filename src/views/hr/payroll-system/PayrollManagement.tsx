import { useState, useMemo, useEffect } from "react";
import {
  createPayrollEntry,
  getAllPayrollEntries,
  runPayrollEntry,
  getPayrollEntryDetail,
  updatePayrollEntry,
  deletePayrollEntry,
  getPayrollVerificationDetail,cancelPayrollEntry
} from "../../../api/payroll/payrollEntryApi";
import { fireManagedSwal } from "../../../utils/swalManager";
import type { CreatePayrollEntryPayload } from "../../../api/payroll/payrollEntryApi";

import { openPayrollModal, openPayrollPreviewModal } from "../../../store/modalStore";
import { showSuccess, showApiError, showLoading, closeSwal } from "../../../utils/alert";
import type { PayrollRecord, PayrollEntry } from "../../../types/payrolltypes";
import { runPayrollValidation }   from "./utils";
import { PayrollDashboard }       from "./Payrolldashboard ";
import { EmployeeDetailPage }     from "./Employeedetailpage";
import { PayslipModal }           from "./PayslipModal";
import { QuickCreateModal }       from "../../../components/Hr/payrollmodal/QuickCreatePayrollModal";
import { PayrollValidationModal } from "../../../components/Hr/payrollmodal/payrollvalidationmodal";
import { usePermission }          from "../../../hooks/permission/usePermission";
import { HrTableFrame }           from "../components/HrTabLayout";

// ─── Month helper ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
] as const;

const monthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return "";
  const monthIndex = parseInt(dateStr.split("-")[1], 10) - 1;
  return MONTH_NAMES[monthIndex] ?? "";
};

// ─── Payload builder ──────────────────────────────────────────────────────────

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
  bank_account:
    typeof formData.bankAccount === "object" && formData.bankAccount !== null
      ? (formData.bankAccount as any).value
      : (formData.bankAccount ?? ""),
  employees: empIds.map((id) => ({ employee: id, is_salary_withheld: 0 })),
  ...(formData.costCenter ? { cost_center: formData.costCenter } : {}),
  ...(formData.project    ? { project:     formData.project    } : {}),
  ...(formData.currency   ? { currency:    formData.currency   } : {}),
  deduct_tax_for_unsubmitted_tax_exemption_proof: formData.deductTaxForProof   ? 1 : 0,
  salary_slip_based_on_timesheet:                 formData.salarySlipTimesheet ? 1 : 0,
  validate_attendance: 0,
  validate_holidays:   0,
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function PayrollManagement() {
  const { can } = usePermission();
  const canCreate = can("Payroll Entry", "create");
  const canWrite  = can("Payroll Entry", "write");

  const [page,             setPage]             = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [payrollRecords,   setPayrollRecords]   = useState<PayrollRecord[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [showValidation,   setShowValidation]   = useState(false);
  const [selectedRecord,   setSelectedRecord]   = useState<PayrollRecord | null>(null);
  const [detailRecord,     setDetailRecord]     = useState<PayrollRecord | null>(null);
  const [selectedEmpIds,   setSelectedEmpIds]   = useState<string[]>([]);
  const [searchTerm,       setSearchTerm]       = useState("");
  const [validationResult, setValidationResult] = useState<ReturnType<typeof runPayrollValidation> | null>(null);
  const [isProcessing,     setIsProcessing]     = useState(false);

  const availableEmployees = useMemo(() => [], []);
  const pendingRecords     = payrollRecords.filter((r) => r.status === "Pending");

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadPayrollEntries = async () => {
    try {
      setLoading(true);
      const resp = await getAllPayrollEntries(page, 10);
      setPayrollRecords(resp?.data                || []);
      setTotalPages(resp?.pagination?.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayrollEntries(); }, [page, searchTerm]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreatePayroll = async (empIds: string[], formData?: PayrollEntry) => {
    if (!empIds.length) return;
    try {
      showLoading("Creating Payroll");
      if (formData) {
        const created = await createPayrollEntry(buildPayload(formData, empIds));
        if (!created) throw new Error("Payroll creation failed");
      }
      await loadPayrollEntries();
      setSelectedEmpIds([]);
      setShowCreateModal(false);
      closeSwal();
      showSuccess(`Payroll created for ${empIds.length} employee${empIds.length > 1 ? "s" : ""}`);
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    }
  };

  const handleRunPayroll = async (id: string) => {
    try {
      showLoading("Running Payroll");
      await runPayrollEntry(id);
      closeSwal();
      showSuccess("Payroll executed successfully");
      await loadPayrollEntries();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };
const handleCancelPayroll = async (record: PayrollRecord) => {
  const confirm = await fireManagedSwal({
    icon: "warning",
    title: "Revert Payroll?",
    text: `Are you sure you want to revert payroll ${(record as any).name}?`,
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Revert",
  });

  if (!confirm.isConfirmed) {
    return;
  }

  try {
    showLoading("Reverting Payroll");

    await cancelPayrollEntry((record as any).name);

    closeSwal();

    showSuccess("Payroll reverted successfully");

    await loadPayrollEntries();
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
};
const handleDeletePayroll = async (id: string) => {
  const confirm = await fireManagedSwal({
    icon: "warning",
    title: "Delete Payroll?",
    text: `Are you sure you want to delete payroll ${id}?`,
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Delete",
  });

  if (!confirm.isConfirmed) {
    return;
  }

  try {
    showLoading("Deleting Payroll");

    await deletePayrollEntry(id);

    closeSwal();

    showSuccess("Payroll deleted successfully");

    await loadPayrollEntries();
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
};
  const handleEditPayroll = async (r: PayrollRecord) => {
    try {
      showLoading("Loading Payroll");
      const payroll = await getPayrollEntryDetail((r as any).name);
      closeSwal();
      openPayrollModal(
        {
          payrollName:           payroll.name,
          postingDate:           payroll.posting_date,
          payrollMonth:          monthFromDateStr(payroll.start_date),
          startDate:             payroll.start_date,
          endDate:               payroll.end_date,
          currency:              payroll.currency,
          exchangeRate:          payroll.exchange_rate,
          company:               payroll.company,
          payrollPayableAccount: payroll.payroll_payable_account,
          status:                payroll.status,
          salarySlipTimesheet:   payroll.salary_slip_based_on_timesheet === 1,
          deductTaxForProof:     payroll.deduct_tax_for_unsubmitted_tax_exemption_proof === 1,
          payrollFrequency:      payroll.payroll_frequency,
          paymentAccount:        payroll.payment_account || "",
          bankAccount:           payroll.bank_account    || "",
          project:               payroll.project         || "",
          costCenter:            payroll.cost_center     || "",
          selectedEmployees:     payroll.employees?.map((e: any) => e.employee) || [],
        },
        true,
        {
          onSubmit: async ({ formData }: any) => {
            try {
              showLoading("Updating Payroll");
              await updatePayrollEntry(
                payroll.name,
                buildPayload(formData, formData.selectedEmployees || []),
              );
              closeSwal();
              await loadPayrollEntries();
              showSuccess("Payroll updated successfully");
            } catch (error) {
              closeSwal();
              showApiError(error);
              throw error;
            }
          },
        },
      );
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleVerify = async (record: PayrollRecord) => {
    const payrollId = (record as any).name || (record as any).id;
    if (!payrollId) return;
    try {
      showLoading("Loading payroll data…");
      const rawData = await getPayrollVerificationDetail(payrollId);
      closeSwal();
      openPayrollPreviewModal(rawData);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleConfirmPayroll = () => {
    setIsProcessing(true);
    const ids = pendingRecords.map((r) => r.id);
    setPayrollRecords((p) =>
      p.map((r) => ids.includes(r.id) ? { ...r, status: "Processing" as const } : r),
    );
    setTimeout(() => {
      setPayrollRecords((p) =>
        p.map((r) =>
          ids.includes(r.id)
            ? { ...r, status: "Paid" as const, paymentDate: new Date().toLocaleDateString("en-IN") }
            : r,
        ),
      );
      setIsProcessing(false);
      setShowValidation(false);
      setValidationResult(null);
      showSuccess(`Payroll processed for ${ids.length} employee${ids.length > 1 ? "s" : ""}.`);
    }, 2500);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (detailRecord)
    return (
      <EmployeeDetailPage
        records={payrollRecords}
        initialRecord={detailRecord}
        onBack={() => setDetailRecord(null)}
        onViewPayslip={(r) => setSelectedRecord(r)}
      />
    );

  return (
    <HrTableFrame>
      <PayrollDashboard
        records={payrollRecords}
        loading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onQuickCreate={() => setShowCreateModal(true)}
        canCreate={canCreate}
        canWrite={canWrite}
        onNewPayroll={() =>
          openPayrollModal(null, false, {
            onSubmit: async ({ empIds, formData }: any) => {
              await handleCreatePayroll(empIds, formData);
            },
          })
        }
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onRunPayroll={handleRunPayroll}
        onViewPayslip={(r) => setSelectedRecord(r)}
        onDeleteRecord={(r) => handleDeletePayroll((r as any).name)}
        onEditRecord={handleEditPayroll}
        onVerify={handleVerify}
        onCancelPayroll={handleCancelPayroll}
        onViewDetails={(r) => setDetailRecord(r)}
      />

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

      <PayrollValidationModal
        show={showValidation}
        result={validationResult}
        isRunning={isProcessing}
        onClose={() => { setShowValidation(false); setValidationResult(null); }}
        onProceed={handleConfirmPayroll}
        onRevalidate={() => setValidationResult(runPayrollValidation(pendingRecords))}
      />

      <PayslipModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onDownload={() => showSuccess(`Payslip downloaded for ${selectedRecord?.employeeName}`)}
        onEmail={() =>    showSuccess(`Payslip emailed to ${selectedRecord?.email}`)}
      />
    </HrTableFrame>
  );
}