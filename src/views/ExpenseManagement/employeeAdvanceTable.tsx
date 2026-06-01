import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Table from "../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { openPaymentEntryModal } from "../../store/modalStore";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { openEmployeeAdvanceModal } from "../../store/modalStore";  
import {getAllAdvances,getAdvanceById,deleteEmployeeAdvance, updateAdvanceStatus} from "../../api/expenseClaimApi";
import { Check } from "lucide-react";

const EMPLOYEE_ADVANCE_MODULE = "Employee Advance";

interface EmployeeAdvance {
  id: string;
  posting_date: string;
  employee_name: string;
  purpose: string;
  amount: number;
  status: string;
}

const EmployeeAdvanceTable: React.FC = () => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [isInitialLoad,    setIsInitialLoad]    = useState(true);
  const [isFetching,       setIsFetching]       = useState(false);

  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy,     setSortBy]     = useState("posting_date");
  const [sortOrder,  setSortOrder]  = useState<"asc" | "desc">("desc");

  useEffect(() => { setPage(1); }, [searchTerm]);

const fetchEmployeeAdvances = useCallback(async () => {
  if (!mountedRef.current) return;
  setIsFetching(true);
  try {
    const res = await getAllAdvances(searchTerm, page, pageSize);
    if (!mountedRef.current) return;
    setEmployeeAdvances(
      res.data.map((item) => ({
        id:            item.name,
        posting_date:  item.posting_date,
        employee_name: item.employee_name,
        purpose:       item.purpose,
        amount:        item.advance_amount, 
        status:        item.status,
      }))
    );
    setTotalPages(res.pagination.total_pages);
    setTotalItems(res.pagination.total);
  } catch (err) {
    showApiError(err);
    setEmployeeAdvances([]);
    setTotalPages(1);
    setTotalItems(0);
  } finally {
    if (mountedRef.current) {
      setIsFetching(false);
      setIsInitialLoad(false);
    }
  }
}, [page, pageSize, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    mountedRef.current = true;
    fetchEmployeeAdvances();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchEmployeeAdvances();
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

  const handleDelete = async (id: string) => {
    const result = await fireManagedSwal({
      icon:               "warning",
      title:              "Are you sure?",
      text:               "Delete this employee advance?",
      showCancelButton:   true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  "Yes, delete",
      reverseButtons:     true,
    });
    if (!result.isConfirmed) return;
    try {
      showLoading("Deleting employee advance...");
      await deleteEmployeeAdvance(id);
      setEmployeeAdvances((prev) => prev.filter((ea) => ea.id !== id));
      closeSwal();
      showSuccess("Employee advance deleted successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };
 const handleStatusChange = async (id: string, action: "submit" | "cancel") => {
  const result = await fireManagedSwal({
    icon: "warning",
    title: "Are you sure?",
    text: `${action === "submit" ? "Approve" : "Cancel"} this employee advance?`,
    showCancelButton: true,
    confirmButtonColor: action === "submit" ? "#22c55e" : "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: `Yes, ${action === "submit" ? "approve" : "cancel"}`,
    reverseButtons: true,
  });
  if (!result.isConfirmed) return;
  try {
    showLoading(`${action === "submit" ? "Approving" : "Cancelling"} advance...`);
    await updateAdvanceStatus(id, action);
    closeSwal();
    showSuccess(`Employee advance ${action === "submit" ? "approved" : "cancelled"} successfully`);
    fetchEmployeeAdvances();
  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};
const handleMakePayment = useCallback(
  async (ea: EmployeeAdvance) => {
    try {
      showLoading("Opening payment...");
      const advance = await getAdvanceById(ea.id);
      closeSwal();

      if (!advance) {
        showApiError("Advance record not found");
        return;
      }

      openPaymentEntryModal(
        {
          paymentType: "Pay",
          partyType: "Employee",
          partyName: advance.employee_name,
          partyId: advance.employee,
          amount: advance.advance_amount,
          referenceName: advance.name,
          referenceType: "Employee Advance",
        },
        false,
        {
          onSuccess: (result) => {
            fetchEmployeeAdvances();
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
  [fetchEmployeeAdvances],
);

const handleOpenEdit = async (ea: EmployeeAdvance) => {
  try {
    showLoading("Loading advance details...");
    const advance = await getAdvanceById(ea.id); 

    if (!advance) {
      closeSwal();
      showApiError("Advance record not found");
      return;
    }

    const formData = {
      id:                          advance.name,
      posting_date:                advance.posting_date,
      employee:                    advance.employee,
      employee_name:               advance.employee_name,
      purpose:                     advance.purpose,
      amount:                      advance.advance_amount,
      advance_account:             advance.advance_account,
      payment_mode:                advance.mode_of_payment,
      repay_unclaimed_from_salary: advance.repay_unclaimed_amount_from_salary === 1,
    };

    openEmployeeAdvanceModal(formData, true, {
      onSuccess: async () => {
        showSuccess("Employee advance updated successfully");
        fetchEmployeeAdvances();
      },
    });
    closeSwal();
  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};


  const handleExportExcel = async () => {
    try {
      if (!employeeAdvances.length) {
        closeSwal();
        showApiError("No employee advances to export");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(
        employeeAdvances.map((ea) => ({
          "Posting Date":  ea.posting_date,
          "Employee Name": ea.employee_name,
          "Purpose":       ea.purpose,
          "Amount":        ea.amount,
          "Status":        ea.status,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Advances");
      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Employee_Advances.xlsx"
      );

      await fireManagedSwal({
        icon:               "success",
        title:              "Success",
        text:               "Employee advances exported successfully",
        confirmButtonColor: "#22c55e",
      });
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":   return "bg-green-100 text-green-700";
      case "pending":    return "bg-yellow-100 text-yellow-700";
      case "rejected":   return "bg-red-100 text-red-700";
      case "paid":       return "bg-blue-100 text-blue-700";
      case "cancelled":  return "bg-gray-100 text-gray-600";
      default:           return "bg-gray-100 text-gray-600";
    }
  };

  const columns: Column<EmployeeAdvance>[] = useMemo(
    () => [
      {
        key:    "posting_date",
        header: "Posting Date",
        align:  "left",
        render: (ea) => (
          <div className="py-1.5">
            <span className="block font-medium">{ea.posting_date}</span>
          </div>
        ),
        tooltip: (ea) => `Posting Date: ${ea.posting_date}`,
      },
      {
        key:    "employee_name",
        header: "Employee Name",
        align:  "left",
        render: (ea) => (
          <div className="py-1.5">
            <span className="block font-medium">{ea.employee_name}</span>
          </div>
        ),
        tooltip: (ea) => `Employee: ${ea.employee_name}`,
      },
      {
        key:    "purpose",
        header: "Purpose",
        align:  "left",
        render: (ea) => (
          <div className="py-1.5">
            <span className="block">{ea.purpose}</span>
          </div>
        ),
        tooltip: (ea) => `Purpose: ${ea.purpose}`,
      },
      {
        key:    "amount",
        header: "Amount",
        align:  "right",
        render: (ea) => (
          <div className="py-1.5">
            <span className="block font-medium">
              {ea.amount?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ),
        tooltip: (ea) => `Amount: ${ea.amount}`,
      },
      {
        key:    "status",
        header: "Status",
        align:  "center",
        render: (ea) => (
          <div className="py-1.5 flex justify-center">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadgeClass(
                ea.status
              )}`}
            >
              {ea.status}
            </span>
          </div>
        ),
        tooltip: (ea) => `Status: ${ea.status}`,
      },
{
  key: "actions",
  header: "Actions",
  align: "center",
  render: (ea) => {
    const status      = ea.status?.toLowerCase();
    const isDraft     = status === "draft";
    const isUnpaid    = status === "unpaid";
    const isCancelled = status === "cancelled";

    return (
      <div className="flex items-center justify-center gap-2">
        <ActionButton
          type="view"
          onClick={(e) => { e.stopPropagation(); }}
          iconOnly
        />
        <ActionButton
          type="edit"
          onClick={() => { handleOpenEdit(ea); }}
          iconOnly
          disabled={!isDraft}
        />

        <ActionMenu
  {...((isDraft || isCancelled) && { onDelete: () => handleDelete(ea.id) })}
  customActions={[
    {
      label: "Approve",
      onClick: () => handleStatusChange(ea.id, "submit"),
     
    },
    {
  label: "Make Payment",
  onClick: () => handleMakePayment(ea),
  disabled: !isUnpaid,
},
    {
      label: "Cancel",
      onClick: () => handleStatusChange(ea.id, "cancel"),
      danger: true,
      disabled: !isUnpaid,
    },
  ]}
/>
      </div>
    );
  },
},
    ],
    [handleDelete, can]
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={employeeAdvances}
        rowKey={(row) => row.id}
        tableId="employee-advance"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableAdd={can(EMPLOYEE_ADVANCE_MODULE, "create")}
        addLabel="Add Employee Advance"
        onAdd={() =>
          openEmployeeAdvanceModal(null, false, {
            onSuccess: async () => {
              showSuccess("Employee advance added successfully");
              fetchEmployeeAdvances();
            },
          })
        }
        enableColumnSelector
        enableExport={can(EMPLOYEE_ADVANCE_MODULE, "export")}
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={({ sortBy: col, sortOrder: ord }) => {
          setSortBy(col);
          setSortOrder(ord);
          setPage(1);
        }}
      />
    </div>
  );
};

export default EmployeeAdvanceTable;