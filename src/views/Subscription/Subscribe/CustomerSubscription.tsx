import React, { useMemo, useState } from "react";
import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionGroup } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { FilterSelect } from "../../../components/ui/modal/modalComponent";
import SubscriptionModal from "../../../components/Subscription/Subscribe/CustomerSubscriptionModal";
import { PlanProductBadge } from "../../../components/Subscription/Plan/PlanShared";
import { usePermission } from "../../../hooks/permission/usePermission";
import { formatMoney } from "../../../hooks/Subscription/Plan/useplan";
import {
  computePricing,
  formatDate,
  nextSubscriptionNumber,
} from "../../../hooks/Subscription//Subscribe/useCustomerSubscription";
import { showSuccess, showValidationError } from "../../../utils/alert";
import { SEED_PLANS } from "../Plan/Plan";
import type {
  CustomerOption,
  SubscriptionDetail,
  SubscriptionPayload,
  SubscriptionStatus,
} from "../../../types/Subscription/Subscribe/CustomerSubscription";

/** Permission module name used by usePermission for this screen. */
const SUBSCRIPTION_MODULE = "Subscription";

/* ─── Dummy data (no API yet) ─────────────────────────────────────────────── */

const CUSTOMERS: CustomerOption[] = [
  { id: "CUST-001", name: "Mr. ABCD", company: "ABCD Corp" },
  { id: "CUST-002", name: "Apex Global Logistics", company: "Apex Global" },
  { id: "CUST-003", name: "Nexus FinTech Ltd", company: "Nexus FinTech" },
  { id: "CUST-004", name: "Northridge Systems", company: "Northridge" },
  { id: "CUST-005", name: "Summit Lending Corp", company: "Summit Lending" },
];

const PLANS = SEED_PLANS;
const PLAN_BY_ID = new Map(PLANS.map((p) => [p.id, p]));

const sub = (
  s: Pick<SubscriptionDetail, "id" | "customerId" | "planId" | "startDate" | "expiryDate" | "status"> &
    Partial<SubscriptionDetail>,
): SubscriptionDetail => {
  const customer = CUSTOMERS.find((c) => c.id === s.customerId);
  const plan = PLAN_BY_ID.get(s.planId);
  return {
    customerName: customer?.name ?? "",
    customerCompany: customer?.company ?? "",
    planName: plan?.name ?? "",
    discount: 0,
    notes: "",
    ...s,
  };
};

const SEED_SUBSCRIPTIONS: SubscriptionDetail[] = [
  sub({ id: "SUB-2026-0001", customerId: "CUST-002", planId: "ERP-LMS-2025", startDate: "2026-07-01", expiryDate: "2026-10-01", status: "Active" }),
  sub({ id: "SUB-2026-0002", customerId: "CUST-003", planId: "LMS-CORE-V2", startDate: "2026-08-15", expiryDate: "2026-09-15", status: "Trial", discount: 100 }),
  sub({ id: "SUB-2026-0003", customerId: "CUST-004", planId: "ERP-STD-2025", startDate: "2026-05-01", expiryDate: "2026-06-01", status: "Expired" }),
  sub({ id: "SUB-2026-0004", customerId: "CUST-005", planId: "LOS-ACCEL-01", startDate: "2026-06-10", expiryDate: "2026-07-10", status: "Cancelled" }),
  sub({ id: "SUB-2026-0005", customerId: "CUST-001", planId: "LMS-SVC-PRO", startDate: "2026-09-01", expiryDate: "2026-12-01", status: "Active", notes: "Annual review in November." }),
];

/* ─── Filters / helpers ───────────────────────────────────────────────────── */

const STATUS_FILTER_OPTIONS: { label: string; value: SubscriptionStatus }[] = [
  { label: "Active", value: "Active" },
  { label: "Trial", value: "Trial" },
  { label: "Expired", value: "Expired" },
  { label: "Cancelled", value: "Cancelled" },
];

const STATUS_CLASS: Record<SubscriptionStatus, string> = {
  Active: "bg-success",
  Trial: "bg-info",
  Expired: "bg-warning",
  Cancelled: "bg-danger",
};

const SubscriptionStatusBadge: React.FC<{ status: SubscriptionStatus }> = ({ status }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CLASS[status]}`}>
    {status}
  </span>
);

// Quotes every cell and neutralises spreadsheet formula injection (= + - @).
const csvCell = (value: unknown): string => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

interface ModalState {
  open: boolean;
  subscription: SubscriptionDetail | null;
  modalId: string;
  number: string;
}
const CLOSED: ModalState = { open: false, subscription: null, modalId: "", number: "" };

/* ═════════════════════════════════════════════════════════════════════════════
   CustomerSubscription — table logic + UI
   ═════════════════════════════════════════════════════════════════════════════ */

const CustomerSubscription: React.FC = () => {
  const { can } = usePermission();

  const [subscriptions, setSubscriptions] = useState<SubscriptionDetail[]>(SEED_SUBSCRIPTIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modal, setModal] = useState<ModalState>(CLOSED);

  const canCreate = can(SUBSCRIPTION_MODULE, "create");
  const canEdit = can(SUBSCRIPTION_MODULE, "write");

  const getTotal = (s: SubscriptionDetail) => {
    const plan = PLAN_BY_ID.get(s.planId) ?? null;
    return { plan, total: computePricing(plan, s.discount).total };
  };

  // ── Filter + paginate (client side) ────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return subscriptions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return [s.id, s.customerName, s.customerCompany, s.planName].join(" ").toLowerCase().includes(q);
    });
  }, [subscriptions, searchTerm, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearch = (q: string) => { setSearchTerm(q); setPage(1); };
  const handleStatusFilter = (v: SubscriptionStatus | "") => { setStatusFilter(v); setPage(1); };
  const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(1); };

  const isEditable = (s: SubscriptionDetail) => s.status !== "Cancelled";

  const handleExport = () => {
    const headers = ["Subscription No.", "Customer", "Company", "Plan", "Start Date", "Expiry Date", "Discount", "Total (incl. GST)", "Status"];
    const lines = filtered.map((s) =>
      [s.id, s.customerName, s.customerCompany, s.planName, s.startDate, s.expiryDate, s.discount, getTotal(s).total, s.status]
        .map(csvCell)
        .join(","),
    );
    // BOM so Excel reads UTF-8 correctly
    const blob = new Blob(["\uFEFF" + [headers.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Subscriptions exported successfully");
  };

  // ── Modal open / save ──────────────────────────────────────────────────────
  const openCreate = () =>
    setModal({
      open: true,
      subscription: null,
      modalId: `subscription-create-${Date.now()}`,
      number: nextSubscriptionNumber(subscriptions),
    });
  const openEdit = (s: SubscriptionDetail) =>
    setModal({ open: true, subscription: s, modalId: `subscription-edit-${s.id}-${Date.now()}`, number: s.id });
  const closeModal = () => setModal(CLOSED);

  /** Called by the modal on Create / Update. Returning false keeps the modal open. */
  const handleSave = async (data: unknown): Promise<boolean> => {
    const payload = data as SubscriptionPayload;

    if (!modal.subscription) {
      if (subscriptions.some((s) => s.id === payload.id)) {
        showValidationError(`Subscription ${payload.id} already exists`);
        return false;
      }
      setSubscriptions((prev) => [payload, ...prev]);
      showSuccess(`Subscription created successfully.\nSubscription No: ${payload.id}`);
    } else {
      const originalId = modal.subscription.id; // subscription number is immutable
      setSubscriptions((prev) => prev.map((s) => (s.id === originalId ? { ...payload, id: originalId } : s)));
      showSuccess("Subscription updated successfully!");
    }
    return true;
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: Column<SubscriptionDetail>[] = [
    {
      key: "id",
      header: "Subscription",
      align: "left",
      width: "150px",
      render: (s) => <span className="font-mono text-xs font-medium">{s.id}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      align: "left",
      width: "220px",
      render: (s) => (
        <div className="py-1.5">
          <span className="block font-medium">{s.customerName}</span>
          <span className="text-[11px] text-muted">{s.customerCompany}</span>
        </div>
      ),
      tooltip: (s) => s.customerName,
    },
    {
      key: "plan",
      header: "Plan",
      align: "left",
      width: "240px",
      render: (s) => {
        const plan = PLAN_BY_ID.get(s.planId);
        return (
          <div className="py-1.5">
            <span className="block font-medium">{s.planName}</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {plan?.products.map((code) => <PlanProductBadge key={code} code={code} />)}
            </div>
          </div>
        );
      },
    },
    {
      key: "period",
      header: "Contract Period",
      align: "left",
      width: "190px",
      render: (s) => (
        <div className="whitespace-nowrap py-1.5 text-xs">
          <span className="block font-medium">{formatDate(s.startDate)}</span>
          <span className="text-muted">to {formatDate(s.expiryDate)}</span>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total (incl. GST)",
      align: "left",
      width: "160px",
      render: (s) => {
        const { plan, total } = getTotal(s);
        return (
          <span className="whitespace-nowrap font-semibold tabular-nums">
            {plan ? formatMoney(total, plan.currency) : "—"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "110px",
      render: (s) => (
        <div className="py-1.5">
          <SubscriptionStatusBadge status={s.status} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "90px",
      render: (s) => (
        <ActionGroup>
          {canEdit && isEditable(s) && (
            <ActionButton type="edit" iconOnly title="Edit Subscription" onClick={() => openEdit(s)} />
          )}
        </ActionGroup>
      ),
    },
  ];

  const filters = (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted">Status:</span>
      <FilterSelect
        aria-label="Filter by status"
        value={statusFilter}
        options={STATUS_FILTER_OPTIONS}
        onChange={(e) => handleStatusFilter(e.target.value as SubscriptionStatus | "")}
      />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Table
          columns={columns}
          data={rows}
          tableId="customer-subscription"
          rowKey={(s) => s.id}
          showToolbar
          emptyMessage="No subscriptions found."
          toolbarPlaceholder="Search by subscription no., customer, or plan..."
          searchValue={searchTerm}
          onSearch={handleSearch}
          extraFilters={filters}
          enableAdd={canCreate}
          addLabel="Add Subscription"
          onAdd={openCreate}
          enableColumnSelector
          enableExport={can(SUBSCRIPTION_MODULE, "export")}
          onExport={handleExport}
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[20, 50, 100, 200]}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onRowDoubleClick={(s) => {
            if (canEdit && isEditable(s)) openEdit(s);
          }}
        />
      </div>

      <SubscriptionModal
        isOpen={modal.open}
        onClose={closeModal}
        onSubmit={handleSave}
        initialData={modal.subscription}
        isEditMode={!!modal.subscription}
        modalId={modal.modalId || undefined}
        customers={CUSTOMERS}
        plans={PLANS}
        suggestedNumber={modal.number}
      />
    </div>
  );
};

export default CustomerSubscription;