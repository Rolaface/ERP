import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Ban, CheckCircle2, XCircle } from "lucide-react";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { showApiError, showSuccess, closeSwal, showLoading } from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";
import { openExpenseModal, openPaymentEntryModal } from "../../store/modalStore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  getExpenseClaims,
  getExpenseClaimById,
  deleteExpenseClaim,
  approveExpenseClaim,
} from "../../api/expenseClaimApi";
import ExpenseClaimDetailView from "../../views/ExpenseManagement/expenseClaimDetailView";
import { useAuth } from "../../context/AuthContext";
import { useHRView } from "../../hooks/permission/useHRView";

const EXPENSE_MODULE = "Expense Claim";
const PAYMENT_MODULE = "Payment Entry";  // ++

interface ExpenseSummary {
  id: string;
  approver: string;
  date: string;
  category: string;
  amount: number;
  grandTotal?: number;
  currency: string;
  approvalStatus: string;
  description?: string;
  name: string;
  employeeId?: string;
}

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Approved", value: "Approved" },
  { label: "Paid", value: "Paid" },
  { label: "Cancelled", value: "Cancelled" },
];

const formatDate = (date: string) => {
  if (!date) return "";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [year, month, day] = date.split("T")[0].split("-").map(Number);
  return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
};

const ExpenseHistory: React.FC = () => {
  const mountedRef = useRef(true);
  const { can } = usePermission();
  const { user } = useAuth();
  const { viewMode } = useHRView();
  const isEmployeeView = viewMode === "employee";

  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [detailClaim, setDetailClaim] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [filters, setFilters] = useState<{
    status?: string;
    category?: string;
    from_date?: string;
    to_date?: string;
  }>({});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  const fetchExpenses = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);
    try {
      const res = await getExpenseClaims(
        searchTerm,
        page,
        pageSize,
        isEmployeeView ? (user?.employeeId ?? undefined) : undefined,
      );
      if (!mountedRef.current) return;
      setExpenses(
        res.data.map((claim: any) => ({
          id: claim.name,
          approver: claim.expense_approver_name ?? "",
          name: claim.employee_name,
          employeeId: claim.employee ?? "",
          date: claim.posting_date,
          category: claim.expense_type ?? "",
          amount: claim.total_claimed_amount ?? 0,
          grandTotal: claim.grand_total ?? 0,
          currency: claim.currency ?? "",
          approvalStatus: claim.approval_status ?? "",
        })),
      );
      setTotalPages(res.pagination.total_pages);
      setTotalItems(res.pagination.total);
    } catch (err) {
      showApiError(err);
      setExpenses([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters, isEmployeeView, user?.employeeId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchExpenses();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchExpenses();
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters, isEmployeeView, user?.employeeId]);
  const handleMakePayment = useCallback(
    async (exp: ExpenseSummary) => {
      try {
        showLoading("Opening payment...");
        const claim = await getExpenseClaimById(exp.id);
        closeSwal();

        openPaymentEntryModal(
          {
            paymentType: "Pay",
            partyType: "Employee",
            partyName: claim.employee_name,
            partyId: claim.employee ?? exp.id,
            amount: claim.grand_total,
            referenceName: claim.name,
            referenceType: "Expense Claim",
          },
          false,
          {
            onSuccess: (result) => {
              fetchExpenses();
              const paymentId =
                typeof result === "string"
                  ? result
                  : ((result as any)?.paymentId ?? (result as any)?.id ?? "");
              showSuccess(
                paymentId
                  ? `Payment ${paymentId} created`
                  : "Payment created successfully",
              );
            },
          },
        );
      } catch (err) {
        closeSwal();
        showApiError(err);
      }
    },
    [fetchExpenses],
  );
 

  const handleOpenAdd = () => {
    const seedData =
      isEmployeeView && user?.employeeId
        ? {
          employee: user.employeeId,
          employee_name:
            user.fullName ??
            user.username ??
            "",
        }
        : null;

    openExpenseModal(seedData, false, {
      onSuccess: async () => {
        showSuccess("Expense submitted successfully");
        fetchExpenses();
      },
    });
  };

  const handleOpenEdit = async (exp: ExpenseSummary) => {
    try {
      const claim = await getExpenseClaimById(exp.id);
      closeSwal();
      const formData = {
        id: claim.name,
        claim_title: claim.expenses?.[0]?.description ?? "",
        category: claim.expenses?.[0]?.expense_type ?? "",
        date_incurred: claim.expenses?.[0]?.expense_date ?? claim.posting_date,
        amount: claim.total_claimed_amount,
        currency: claim.currency,
        employee_name: claim.employee_name,
        employee: claim.employee,
        expense_approver: claim.expense_approver,
        receipts: [],
        existingAttachments: claim.attachments ?? [],
        remarks: claim.remark ?? "",
        advances: claim.advances ?? [],
      };
      openExpenseModal(formData, true, {
        onSuccess: async () => {
          showSuccess("Expense updated successfully");
          fetchExpenses();
        },
      });
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleApprove = async (id: string) => {
    const result = await fireManagedSwal({
      icon: "question",
      title: "Approve Expense?",
      text: `Approve expense ${id}?`,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, approve",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await approveExpenseClaim(id, "Approved");
      showSuccess("Expense approved successfully");
      fetchExpenses();
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleCancel = async (id: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Cancel Expense?",
      text: `Cancel expense ${id}?`,
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await approveExpenseClaim(id, "Cancelled");
      showSuccess("Expense cancelled successfully");
      fetchExpenses();
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleReject = async (id: string) => {
    const result = await fireManagedSwal({
      icon: "error",
      title: "Reject Expense?",
      text: `Reject expense ${id}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reject",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await approveExpenseClaim(id, "Rejected");
      showSuccess("Expense rejected successfully");
      fetchExpenses();
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleViewDetail = async (exp: ExpenseSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDetailLoading(true);
    setDetailClaim({});
    try {
      const res = await getExpenseClaimById(exp.id);
      setDetailClaim(res);
    } catch (err) {
      showApiError(err);
      setDetailClaim(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete expense ${id}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteExpenseClaim(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      closeSwal();
      showSuccess("Expense deleted successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      if (!expenses.length) {
        closeSwal();
        showApiError("No expenses to export");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(
        expenses.map((exp) => ({
          Approver: exp.approver,
          Date: formatDate(exp.date),
          Category: exp.category,
          Amount: exp.amount,
          Currency: exp.currency,
          Status: exp.approvalStatus,
        })),
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Expense History");
      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Expense_History.xlsx",
      );
      closeSwal();
      showSuccess("Expenses exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const columns: Column<ExpenseSummary>[] = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        align: "center",
        render: (exp) => (
          <div className="py-1.5">
            <span className="block">{formatDate(exp.date)}</span>
          </div>
        ),
      },
      {
        key: "approver",
        header: "Approver",
        align: "left",
        render: (exp) => (
          <div className="py-1.5">
            <span className="block font-medium">{exp.approver}</span>
          </div>
        ),
        tooltip: (exp) => `Expense Approver: ${exp.approver}`,
      },
      {
        key: "name",
        header: "EMP Name",
        align: "left",
        render: (exp) => (
          <div className="py-1.5">
            <span className="block font-medium">{exp.name}</span>
          </div>
        ),
        tooltip: (exp) => `Employee Name: ${exp.name}`,
      },
      
      {
        key: "category",
        header: "Category",
        align: "left",
        render: (exp) => (
          <div className="py-1.5">
            <span className="block">{exp.category}</span>
          </div>
        ),
        tooltip: (exp) => `Category: ${exp.category}`,
      },
      {
        key: "amount",
        header: "Amount",
        align: "right",
        render: (exp) => (
          <div className="py-1.5">
            <span className="block">{exp.amount}</span>
          </div>
        ),
        tooltip: (exp) => `Amount: ${exp.amount}`,
      },
      
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (exp) => (
          <div className="py-1.5">
            <StatusBadge
              status={
                exp.approvalStatus === "Draft"
                  ? "Pending for Approval"
                  : exp.approvalStatus
              }
            />
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (exp) => (
          <div className="flex items-center justify-center gap-2">
            <ActionButton
              type="view"
              onClick={(e) => handleViewDetail(exp, e)}
              iconOnly
            />
            <PermissionGate module={EXPENSE_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={() => handleOpenEdit(exp)}
                iconOnly
                disabled={exp.approvalStatus !== "Draft"}
                title={
                  exp.approvalStatus !== "Draft"
                    ? "Only Draft expenses can be edited"
                    : "Edit Expense"
                }
              />
            </PermissionGate>

            <ActionMenu
              customActions={
                ["Paid", "Cancelled", "Rejected","Approved"].includes(exp.approvalStatus)
                  ? []
                  : [
                    ...(!isEmployeeView && exp.approvalStatus === "Draft"
                      ? [
                        {
                          label: "Approve",
                          onClick: () => handleApprove(exp.id),
                        },
                        {
                          label: "Reject",
                          onClick: () => handleReject(exp.id),
                        },
                      ]
                      : []),

                    ...(exp.approvalStatus === "Draft"
                      ? [
                        {
                          label: "Delete",
                          onClick: () => handleDelete(exp.id),
                        },
                      ]
                      : []),
                    ...(exp.approvalStatus === "Draft"
                      ? [
                        {
                          label: "Cancel",
                          onClick: () => handleCancel(exp.id),
                        },
                      ]
                      : []),


                    ...(!isEmployeeView &&
                      can(PAYMENT_MODULE, "create") &&
                      exp.approvalStatus === "Unpaid"
                      ? [
                        {
                          label: "Make Payment",
                          onClick: () => handleMakePayment(exp),
                        },
                      ]
                      : []),
                  ]
              }
            />
          </div>
        ),
      },
    ],
    [handleDelete, handleOpenEdit, handleMakePayment, isEmployeeView, can],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={expenses}
        rowKey={(row) => row.id}
        tableId="expense-history"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(EXPENSE_MODULE, "create")}
        addLabel="Add Expense"
        onAdd={handleOpenAdd}
        enableColumnSelector
        enableExport={can(EXPENSE_MODULE, "export")}
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={({ sortBy: col, sortOrder: ord }) => {
          setSortBy(col);
          setSortOrder(ord);
          setPage(1);
        }}
        extraFilters={
          <>
            <FilterSelect
              value={filters.status ?? ""}
              options={statusOptions}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value || undefined,
                }))
              }
            />
            <DateRangeFilter
              from={filters.from_date}
              to={filters.to_date}
              onChange={(range) =>
                setFilters((prev) => ({ ...prev, ...range }))
              }
            />
          </>
        }
      />
      {detailClaim !== null && (
        <ExpenseClaimDetailView
          open={true}
          expenseData={detailClaim}
          loading={isDetailLoading}
          onClose={() => setDetailClaim(null)}
          onBack={() => setDetailClaim(null)}
        />
      )}
    </div>
  );
};

export default ExpenseHistory;