import React, { useMemo, useState } from "react";
import { ArchiveRestore } from "lucide-react";
import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionGroup, ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { FilterSelect } from "../../../components/ui/modal/modalComponent";
import PlanModal from "../../../components/Subscription/Plan/PlanModal";
import { PlanProductBadge, PlanStatusBadge } from "../../../components/Subscription/Plan/PlanShared";
import { usePermission } from "../../../hooks/permission/usePermission";
import {
  PLAN_CATALOG,
  PRICING_MODEL_LABEL,
  computeRecurringTotal,
  formatMoney,
  getBillingLabel,
  getBillingSuffix,
  getModuleDef,
} from "../../../hooks/Subscription/Plan/useplan";
import { showSuccess, showValidationError } from "../../../utils/alert";
import type { PlanDetail, PlanPayload, PlanProductCode, PlanStatus } from "../../../types/Subscription/Plan/plan";

const PLAN_MODULE = "Plan";


const seed = (
  p: Partial<PlanDetail> & Pick<PlanDetail, "id" | "name" | "products" | "moduleIds">,
): PlanDetail => ({
  description: "",
  status: "Active",
  billingFrequency: "Monthly",
  customIntervalMonths: null,
  pricingModel: "Flat",
  currency: "USD",
  basePrice: 0,
  setupFee: 0,
  modulePrices: {},
  freeTrial: true,
  trialDays: 14,
  renewalMode: "AutoRenew",
  billingCycles: null,
  userLimit: null,
  ...p,
});

export const SEED_PLANS: PlanDetail[] = [
  seed({ id: "ERP-STD-2025", name: "ERP Standard Business", products: ["ERP"], moduleIds: ["ERP.sales", "ERP.procurement"], basePrice: 299 }),
  seed({
    id: "ERP-LMS-2025",
    name: "Enterprise Core & Lending Bundle",
    description: "Comprehensive institutional plan combining ERP resource tracking with LMS lending servicing.",
    products: ["ERP", "LMS"],
    moduleIds: ["ERP.sales", "ERP.procurement", "LMS.collateral", "LMS.lendingSetup"],
    billingFrequency: "Quarterly",
    basePrice: 3650,
    setupFee: 450,
    renewalMode: "FixedCycles",
    billingCycles: 12,
  }),
  seed({
    id: "LMS-CORE-V2",
    name: "LMS Digital Core",
    products: ["LMS"],
    moduleIds: ["LMS.collateral", "LMS.lendingSetup"],
    pricingModel: "PerModule",
    basePrice: null,
    modulePrices: { "LMS.collateral": 150, "LMS.lendingSetup": 300 },
  }),
  seed({ id: "LMS-SVC-PRO", name: "LMS Complete Servicing", products: ["LMS"], moduleIds: ["LMS.lendingOperations", "LMS.lendingReports"], billingFrequency: "Quarterly", basePrice: 1800, freeTrial: false, trialDays: null }),
  seed({ id: "LOS-ACCEL-01", name: "LOS Origination Accelerator", products: ["LOS"], moduleIds: ["LOS.origination"], basePrice: 599 }),
  seed({ id: "LOS-EXPRESS", name: "LOS Express Rules Only", products: ["LOS"], moduleIds: ["LOS.originationSetup"], basePrice: 249, trialDays: 7 }),
  seed({
    id: "ERP-PROC-ONLY",
    name: "ERP Procurement Starter",
    products: ["ERP"],
    moduleIds: ["ERP.procurement"],
    status: "Draft",
    pricingModel: "PerModule",
    basePrice: null,
    modulePrices: { "ERP.procurement": 180 },
  }),
];


const PRODUCT_FILTER_OPTIONS = PLAN_CATALOG.map((p) => ({ label: p.code, value: p.code }));
const STATUS_FILTER_OPTIONS: { label: string; value: PlanStatus }[] = [
  { label: "Active", value: "Active" },
  { label: "Draft", value: "Draft" },
  { label: "Archived", value: "Archived" },
];

const csvCell = (value: unknown): string => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const ICON = "w-4 h-4";

interface ModalState {
  open: boolean;
  plan: PlanDetail | null;
  modalId: string;
}
const CLOSED: ModalState = { open: false, plan: null, modalId: "" };



const PlanManagement: React.FC = () => {
  const { can } = usePermission();

  const [plans, setPlans] = useState<PlanDetail[]>(SEED_PLANS);
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<PlanProductCode | "">("");
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modal, setModal] = useState<ModalState>(CLOSED);

  const canCreate = can(PLAN_MODULE, "create");
  const canEdit = can(PLAN_MODULE, "write");

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return plans.filter((p) => {
      if (productFilter && !p.products.includes(productFilter)) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [p.name, p.id, ...p.products, ...p.moduleIds.map((id) => getModuleDef(id)?.label ?? "")]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [plans, searchTerm, productFilter, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearch = (q: string) => { setSearchTerm(q); setPage(1); };
  const handleProductFilter = (v: PlanProductCode | "") => { setProductFilter(v); setPage(1); };
  const handleStatusFilter = (v: PlanStatus | "") => { setStatusFilter(v); setPage(1); };
  const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(1); };

  const setStatus = (id: string, status: PlanStatus) =>
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

  const handleRestore = (plan: PlanDetail) => {
    setStatus(plan.id, "Draft");
    showSuccess("Plan restored as Draft.");
  };

  const handleExport = () => {
    const headers = ["Plan Code", "Plan Name", "Products", "Modules Entitled", "Billing", "Pricing Model", "Currency", "Recurring Amount", "Trial Days", "Status"];
    const lines = filtered.map((p) =>
      [
        p.id,
        p.name,
        p.products.join(" / "),
        p.moduleIds.length,
        getBillingLabel(p.billingFrequency, p.customIntervalMonths),
        PRICING_MODEL_LABEL[p.pricingModel],
        p.currency,
        computeRecurringTotal(p),
        p.freeTrial ? (p.trialDays ?? "None") : "None",
        p.status,
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob(["\uFEFF" + [headers.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plans_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Plans exported successfully");
  };

  const openCreate = () => setModal({ open: true, plan: null, modalId: `plan-create-${Date.now()}` });
  const openEdit = (plan: PlanDetail) =>
    setModal({ open: true, plan, modalId: `plan-edit-${plan.id}-${Date.now()}` });
  const closeModal = () => setModal(CLOSED);

  /** Called by the modal on Create / Update. Returning false keeps the modal open. */
  const handleSave = async (data: unknown): Promise<boolean> => {
    const payload = data as PlanPayload;

    if (!modal.plan) {
      if (plans.some((p) => p.id === payload.id)) {
        showValidationError(`Plan code ${payload.id} already exists`);
        return false;
      }
      setPlans((prev) => [payload, ...prev]);
      showSuccess(`Plan created successfully.\nPlan Code: ${payload.id}`);
    } else {
      const originalId = modal.plan.id; // plan code is immutable
      setPlans((prev) => prev.map((p) => (p.id === originalId ? { ...payload, id: originalId } : p)));
      showSuccess("Plan updated successfully!");
    }
    return true;
  };

  const columns: Column<PlanDetail>[] = [
    {
      key: "name",
      header: "Plan Name",
      align: "left",
      width: "240px",
      render: (plan) => (
        <div className="py-1.5">
          <span className="block font-medium">{plan.name}</span>
          <span className="font-mono text-[11px] text-muted">#{plan.id}</span>
        </div>
      ),
      tooltip: (plan) => plan.name,
    },
    {
      key: "products",
      header: "Product",
      align: "left",
      width: "130px",
      render: (plan) => (
        <div className="flex flex-wrap gap-1 py-1.5">
          {plan.products.map((code) => (
            <PlanProductBadge key={code} code={code} />
          ))}
        </div>
      ),
    },
    {
      key: "billing",
      header: "Billing",
      align: "left",
      width: "150px",
      render: (plan) => (
        <div className="py-1.5">
          <span className="block whitespace-nowrap font-medium">
            {getBillingLabel(plan.billingFrequency, plan.customIntervalMonths)}
          </span>
          <span className="text-[11px] text-muted">{PRICING_MODEL_LABEL[plan.pricingModel]}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "left",
      width: "150px",
      render: (plan) => (
        <div className="whitespace-nowrap py-1.5 tabular-nums">
          <span className="font-semibold">{formatMoney(computeRecurringTotal(plan), plan.currency)}</span>
          <span className="ml-1 text-xs text-muted">
            {getBillingSuffix(plan.billingFrequency, plan.customIntervalMonths)}
          </span>
        </div>
      ),
    },
    {
      key: "trial",
      header: "Trial",
      align: "center",
      width: "100px",
      render: (plan) => (
        <div className="py-1.5">
          {plan.freeTrial && plan.trialDays ? (
            <span className="whitespace-nowrap rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {plan.trialDays} Days
            </span>
          ) : (
            <span className="text-muted">None</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "110px",
      render: (plan) => (
        <div className="py-1.5">
          <PlanStatusBadge status={plan.status} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "110px",
      render: (plan) => {
        const isArchived = plan.status === "Archived";
        const menuActions: NonNullable<React.ComponentProps<typeof ActionMenu>["customActions"]> = [
          ...(canEdit && isArchived
            ? [{ label: "Restore", icon: <ArchiveRestore className={ICON} />, onClick: () => handleRestore(plan) }]
            : []),
        ];

        return (
          <ActionGroup>
            {canEdit && !isArchived && (
              <ActionButton type="edit" iconOnly title="Edit Plan" onClick={() => openEdit(plan)} />
            )}
            {menuActions.length > 0 && <ActionMenu customActions={menuActions} />}
          </ActionGroup>
        );
      },
    },
  ];

  const filters = (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted">Product:</span>
      <FilterSelect
        aria-label="Filter by product"
        value={productFilter}
        options={PRODUCT_FILTER_OPTIONS}
        onChange={(e) => handleProductFilter(e.target.value as PlanProductCode | "")}
      />
      <span className="ml-1 text-xs font-medium text-muted">Status:</span>
      <FilterSelect
        aria-label="Filter by status"
        value={statusFilter}
        options={STATUS_FILTER_OPTIONS}
        onChange={(e) => handleStatusFilter(e.target.value as PlanStatus | "")}
      />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Table
          columns={columns}
          data={rows}
          tableId="plan-management"
          rowKey={(plan) => plan.id}
          showToolbar
          emptyMessage="No plans found."
          toolbarPlaceholder="Search by plan name, plan code, or module..."
          searchValue={searchTerm}
          onSearch={handleSearch}
          extraFilters={filters}
          enableAdd={canCreate}
          addLabel="Add Plan"
          onAdd={openCreate}
          enableColumnSelector
          enableExport={can(PLAN_MODULE, "export")}
          onExport={handleExport}
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[20, 50, 100, 200]}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onRowDoubleClick={(plan) => {
            if (canEdit && plan.status !== "Archived") openEdit(plan);
          }}
        />
      </div>

      <PlanModal
        isOpen={modal.open}
        onClose={closeModal}
        onSubmit={handleSave}
        initialData={modal.plan}
        isEditMode={!!modal.plan}
        modalId={modal.modalId || undefined}
      />
    </div>
  );
};

export default PlanManagement;