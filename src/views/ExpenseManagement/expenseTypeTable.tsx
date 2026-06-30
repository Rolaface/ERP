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
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { openExpenseTypeModal } from "../../store/modalStore";
import { getExpenseClaimTypes,getExpenseClaimTypeById,deleteExpenseClaimType } from "../../api/expenseClaimApi";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
const EXPENSE_TYPE_MODULE = "Expense Claim Type";

interface ExpenseType {
  id: string;
  expense_type: string;
  account: string;
}

const ExpenseTypeTable: React.FC = () => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  const [expenseTypes,  setExpenseTypes]  = useState<ExpenseType[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching,    setIsFetching]    = useState(false);

  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy,     setSortBy]     = useState("expense_type");
  const [sortOrder,  setSortOrder]  = useState<"asc" | "desc">("asc");

  useEffect(() => { setPage(1); }, [searchTerm]);

const fetchExpenseTypes = useCallback(async () => {
  if (!mountedRef.current) return;
  setIsFetching(true);
  try {
    const res = await getExpenseClaimTypes(searchTerm, page, pageSize);
    if (!mountedRef.current) return;
    setExpenseTypes(res.data.map((item) => ({
      id:           item.name,
      expense_type: item.expense_type,
      account:      item.account,
    })));
setTotalPages(res.pagination.total_pages);
setTotalItems(res.pagination.total);
  } catch (err) {
    showApiError(err);
    setExpenseTypes([]);
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
    fetchExpenseTypes();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchExpenseTypes();
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

const handleDelete = async (id: string) => {
  const result = await fireManagedSwal({
    icon:               "warning",
    title:              "Are you sure?",
    text:               "Delete this expense type?",
    showCancelButton:   true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor:  "#6b7280",
    confirmButtonText:  "Yes, delete",
    reverseButtons:     true,
  });
  if (!result.isConfirmed) return;
  try {
    showLoading("Deleting expense type...");
    await deleteExpenseClaimType(id);
    setExpenseTypes((prev) => prev.filter((et) => et.id !== id));
    closeSwal();
    showSuccess("Expense type deleted successfully");
  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};
const handleOpenEdit = async (et: ExpenseType) => {
  try {
    const res = await getExpenseClaimTypeById(et.id);
    const claim = res.data;
    const formData = {
      id:           claim.name,
      expense_type: claim.expense_type,
      account:      claim.accounts?.[0]?.default_account ?? "",
    };
    openExpenseTypeModal(formData, true, {
      onSuccess: async () => {
        showSuccess("Expense type updated successfully");
        fetchExpenseTypes();
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
    if (!expenseTypes.length) {
      closeSwal();
      showApiError("No expense types to export");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(
      expenseTypes.map((et) => ({
        "Expense Type": et.expense_type,
        "GL Account":      getGLNameWithoutAbbreviation(et.account),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Types");
    saveAs(
      new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Expense_Types.xlsx"
    );
   
    await fireManagedSwal({
      icon:               "success",
      title:              "Success",
      text:               "Expense types exported successfully",
      confirmButtonColor: "#22c55e",
    });
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
};
  const columns: Column<ExpenseType>[] = useMemo(
    () => [
      {
        key:      "expense_type",
        header:   "Expense Type",
        align:    "left",
        render:   (et) => (
          <div className="py-1.5">
            <span className="block font-medium">{et.expense_type}</span>
          </div>
        ),
        tooltip: (et) => `Expense Type: ${et.expense_type}`,
      },
      {
        key: "account",
        header: "GL Account",
        align: "left",
        render: (et) => (
          <div className="py-1.5">
            <span className="block">{getGLNameWithoutAbbreviation(et.account)}</span>
          </div>
        ),
        tooltip: (et) => `Account: ${getGLNameWithoutAbbreviation(et.account)}`,
      },
      {
        key:    "actions",
        header: "Actions",
        align:  "center",
        render: (et) => (
          <div className="flex items-center justify-center gap-2">
            <ActionButton
              type="view"
              onClick={(e) => { e?.stopPropagation(); }}
              iconOnly
            />
            <PermissionGate module={EXPENSE_TYPE_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={() => { handleOpenEdit(et); }}
                iconOnly
              />
            </PermissionGate>
            <ActionMenu
              {...(can(EXPENSE_TYPE_MODULE, "delete")
                ? { onDelete: () => handleDelete(et.id) }
                : {})}
            />
          </div>
        ),
      },
    ],
    [handleDelete, can]
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={expenseTypes}
        rowKey={(row) => row.id}
        tableId="expense-type"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableAdd={can(EXPENSE_TYPE_MODULE, "create")}
        addLabel="Add Expense Type"
        onAdd={() =>
  openExpenseTypeModal(null, false, {
    onSuccess: async () => {
      showSuccess("Expense type added successfully");
      fetchExpenseTypes();
    },
  })
}
        enableColumnSelector
        enableExport={can(EXPENSE_TYPE_MODULE, "export")}
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
         pageSizeOptions={[20, 50, 100,200]}
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

export default ExpenseTypeTable;