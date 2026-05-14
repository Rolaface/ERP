import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import Table from "../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";
import { openExpenseModal } from "../../store/modalStore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const EXPENSE_MODULE = "Expense History";

interface ExpenseSummary {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
}

const statusOptions = [
  { label: "Draft",     value: "Draft" },
  { label: "Approved",  value: "Approved" },
  { label: "Paid",      value: "Paid" },
  { label: "Cancelled", value: "Cancelled" },
];
const formatDate = (date: string) => {
  if (!date) return "";
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const [year, month, day] = date.split("T")[0].split("-").map(Number);
  return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
};

const ExpenseHistory: React.FC = () => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  const [expenses,      setExpenses]      = useState<ExpenseSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching,    setIsFetching]    = useState(false);

  const [filters, setFilters] = useState<{
    status?:    string;
    category?:  string;
    from_date?: string;
    to_date?:   string;
  }>({});

  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy,     setSortBy]     = useState("date");
  const [sortOrder,  setSortOrder]  = useState<"asc" | "desc">("desc");

  useEffect(() => { setPage(1); }, [searchTerm, filters]);

const fetchExpenses = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);
    try {
      
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
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);

  useEffect(() => {
    mountedRef.current = true;
    fetchExpenses();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchExpenses();
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);


  const handleOpenAdd = () => {
    openExpenseModal(null, false, {
      onSuccess: async () => {
        showSuccess("Expense submitted successfully");
        fetchExpenses();
      },
    });
  };

  const handleOpenEdit = (exp: ExpenseSummary) => {
    const formData = {
      claim_title:    exp.id,
      category:       exp.category,
      date_incurred:  exp.date.split("T")[0],
      payment_method: "",
      amount:         exp.amount,
      currency:       exp.currency,
      receipt:        null,
      notes:          exp.description ?? "",
      acknowledged:   true,
    };
    openExpenseModal(formData, true, {
      onSuccess: async () => {
        showSuccess("Expense updated successfully");
        fetchExpenses();
      },
    });
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await fireManagedSwal({
      icon:               "warning",
      title:              "Are you sure?",
      text:               `Delete expense ${id}?`,
      showCancelButton:   true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  "Yes, delete",
      reverseButtons:     true,
    });
    if (!result.isConfirmed) return;
    try {
      showLoading("Deleting expense...");
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
      showLoading("Exporting expenses...");
      if (!expenses.length) {
        closeSwal();
        showApiError("No expenses to export");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(
        expenses.map((exp) => ({
          "Expense ID": exp.id,
          "Date":       formatDate(exp.date),
          "Category":   exp.category,
          "Amount":     exp.amount,
          "Currency":   exp.currency,
          "Status":     exp.status,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Expense History");
      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Expense_History.xlsx"
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
        key:      "id",
        header:   "Expense ID",
        align:    "left",
        sortable: true,
        render:   (exp) => (
          <div className="py-1.5">
            <span className="block font-medium">{exp.id}</span>
          </div>
        ),
        tooltip: (exp) => `Expense ID: ${exp.id}`,
      },
      {
        key:      "date",
        header:   "Date",
        align:    "center",
        sortable: true,
        render:   (exp) => (
          <div className="py-1.5">
            <span className="block">{formatDate(exp.date)}</span>
          </div>
        ),
      },
      {
        key:      "category",
        header:   "Category",
        align:    "left",
        sortable: true,
        render:   (exp) => (
          <div className="py-1.5">
            <span className="block">{exp.category}</span>
          </div>
        ),
        tooltip: (exp) => `Category: ${exp.category}`,
      },
      {
        key:      "amount",
        header:   "Amount",
        align:    "center",
        sortable: true,
        render:   (exp) => (
          <div className="py-1.5">
            <span className="block whitespace-nowrap">
              {exp.amount.toLocaleString()} {exp.currency}
            </span>
          </div>
        ),
        tooltip: (exp) => `Amount: ${exp.amount.toLocaleString()} ${exp.currency}`,
      },
      {
        key:    "status",
        header: "Status",
        align:  "center",
        render: (exp) => (
          <div className="py-1.5">
            <StatusBadge status={exp.status} />
          </div>
        ),
      },
      {
        key:    "actions",
        header: "Actions",
        align:  "center",
        render: (exp) => (
          <div className="flex items-center justify-center gap-2">
            <ActionButton
              type="view"
              onClick={(e) => { e.stopPropagation(); }}
              iconOnly
            />
            <PermissionGate module={EXPENSE_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(exp); }}
                iconOnly
                disabled={exp.status !== "Draft"}
                title={exp.status !== "Draft" ? "Only Draft expenses can be edited" : "Edit Expense"}
              />
            </PermissionGate>
            <ActionMenu
              {...(can(EXPENSE_MODULE, "delete")
                ? { onDelete: (e) => handleDelete(exp.id, e) }
                : {})}
            />
          </div>
        ),
      },
    ],
    [handleDelete, handleOpenEdit, can]
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
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
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
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
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
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value || undefined }))}
            />
            <DateRangeFilter
              from={filters.from_date}
              to={filters.to_date}
              onChange={(range) => setFilters((prev) => ({ ...prev, ...range }))}
            />
          </>
        }
      />
    </div>
  );
};

export default ExpenseHistory;