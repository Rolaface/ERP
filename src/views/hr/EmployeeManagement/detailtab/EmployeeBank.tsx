import React, { useEffect, useState, useCallback } from "react";
import type { BankAccount } from "../../../../types/BankAccount/bank";
import { openBankAccountModal } from "../../../../store/modalStore";
import ModalTable from "../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../components/ui/Table/type";
import { getAllBankAccounts } from "../../../../api/BankAccountApi";
import { showApiError } from "../../../../utils/alert";
import { useMaskedRows } from "../../../../utils/Usemaskedrows";
import { useBankAccountActions } from "../../../../utils/useBankAccountActions";
import { DefaultBadge, StatusBadge } from "../../../../components/UI_Utils/BankAccountBadges";

interface Props {
  employeename?: string;
  emp?: any;
  onAdd?: (refresh: () => void) => void;
  onEdit?: (row: BankAccount) => void;
}

const EmployeeBankDetails: React.FC<Props> = ({
  employeename,
  emp,
  onAdd,
  onEdit,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalItems, setTotalItems]     = useState(0);

  const { isVisible, toggle, reveal } = useMaskedRows();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    if (!employeename) return;
    try {
      setLoading(true);
      const res = await getAllBankAccounts({
        party_type: "Employee",
        party: employeename,
        page,
        page_size: pageSize,
      });
      setBankAccounts(res.data || []);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, [employeename, page, pageSize]);

  const refresh = useCallback(() => fetchAccounts(), [fetchAccounts]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { if (onAdd) onAdd(refresh); }, [onAdd, refresh]);

  // ── Actions hook ──────────────────────────────────────────────────────────
  const { getMenuActions } = useBankAccountActions(fetchAccounts);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const empFullName = emp
    ? [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(" ")
    : employeename;

  const employeeInitial = {
    accountFor: "Employee" as const,
    partyId: employeename,
    partyName: empFullName,
    currency: emp?.salary_currency || emp?.default_currency || "",
  };

  const handleAdd = () => {
    openBankAccountModal(
      employeeInitial,
      false,
      { onSuccess: () => fetchAccounts() },
    );
  };

  const handleEdit = (row: BankAccount) => {
    if (onEdit) { onEdit(row); return; }
    const { accountFor: _discard, ...rowRest } = row as any;
    openBankAccountModal(
      { ...employeeInitial, ...rowRest },
      true,
      { onSuccess: () => fetchAccounts() },
    );
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<BankAccount>[] = [
    {
      key: "dateAdded",
      header: "Date",
      render: (row) =>
        row.dateAdded ? new Date(row.dateAdded).toLocaleDateString("en-GB") : "—",
    },
    {
      key: "bankName",
      header: "Bank",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.bankName || "—"}</span>
          <DefaultBadge isDefault={row.isDefault} />
        </div>
      ),
    },
    {
      key: "accountNo",
      header: "Acc No",
      render: (row) => reveal(row.id, row.accountNo),
    },
    {
      key: "accountHolderName",
      header: "Acc Holder",
      render: (row) => <span>{row.accountHolderName || "—"}</span>,
    },
    {
      key: "sortCode",
      header: "IFSC/Sort",
      render: (row) => reveal(row.id, row.sortCode),
    },
    {
      key: "isDisabled",
      header: "Status",
      render: (row) => <StatusBadge isDisabled={row.isDisabled} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          
          <ActionButton
            type="view"
            iconOnly
            title={isVisible(row.id) ? "Hide Details" : "Show Details"}
            onClick={() => toggle(row.id)}
          />
          <ActionMenu customActions={getMenuActions(row)} />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <ModalTable
          columns={columns}
          data={bankAccounts}
          loading={loading}
          rowKey={(row) => String(row.id)}
          showToolbar
          searchValue={search}
          onSearch={setSearch}
          enableAdd
          addLabel="Add Bank Account"
          onAdd={handleAdd}
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          emptyMessage="No bank accounts found"
        />
      </div>
    </div>
  );
};

export default EmployeeBankDetails;