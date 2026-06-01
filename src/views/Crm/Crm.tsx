import React, { Suspense, lazy, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import { usePermission } from "../../hooks/permission/usePermission";
import { useUrlTab } from "../../hooks/useUrlTab";

const CustomerManagement = lazy(() => import("./CustomerManagement"));
const CRMDashboard = lazy(() => import("./CRMDashboard"));
const CRMReports = lazy(() => import("./Reports"));
const Leads = lazy(() => import("./Leads"));
const SupportTickets = lazy(() => import("./Support-tickets"));
const Payments = lazy(() => import("../PaymentEntry/PaymentEntry"));
const CustomerGroup = lazy(() => import("../Customergroup/CustomerGroup"))

type OutletContextType = {
  openInvoiceCreate: () => void;
  openInvoiceEdit: (invoiceNumber: string, data: any) => void;
  openProformaCreate: () => void;
  openProformaEdit: (proformaId: string, data: any) => void;
  openQuotationCreate: () => void;
  openQuotationEdit: (quotationId: string, data: any) => void;
  openCustomerCreate: () => void;
  openCustomerEdit: (id: string, data: any) => void;
  openSupplierCreate: () => void;
  openSupplierEdit: (id: string, data: any) => void;
  openPOCreate: () => void;
  openPOEdit: (poId: string | number) => void;
};

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const ALL_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard {...iconProps} />,
    module: null,           // always visible
  },
  {
    id: "customer-managment",
    label: "Customer Management",
    icon: <Users {...iconProps} />,
    module: "Customer",
    action: "read" as const,
  },
  {
    id: "payments",
    label: "Payment Entry",
    icon: <CreditCard {...iconProps} />,
    module: "Payment Entry",
    action: "read" as const,
  },
  {
    id: "CustomerGroup",
    label: "Customer Group",
    icon: <Users {...iconProps} />,
    module: "Customer Group",
    action: "read" as const,
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3 {...iconProps} />,
    module: "Customer",
    action: "report" as const,
  },
];


const DEFAULT_TAB = "dashboard";

const CRM: React.FC = () => {
  const { can } = usePermission();

  // Filter tabs based on permissions
  const crmTabs = useMemo(
    () => ALL_TABS.filter((t) => !t.module || can(t.module, t.action)),
    [can]
  );

  const fallbackTab = crmTabs[0]?.id ?? DEFAULT_TAB;
  const [resolvedTab, handleTabChange] = useUrlTab({
    tabs: crmTabs,
    defaultTab: fallbackTab,
    basePath: "/crm",
  });

  const { openCustomerCreate } = useOutletContext<OutletContextType>();
  const handleAddCustomer = useCallback(() => openCustomerCreate(), [openCustomerCreate]);

  const tabComponents = useMemo(() => ({
    dashboard: <CRMDashboard />,
    "customer-managment": <CustomerManagement onAdd={handleAddCustomer} />,
    payments: <Payments defaultPartyType="Customer" />,
    CustomerGroup: <CustomerGroup />,
    reports: <CRMReports />,
  }), [handleAddCustomer]);

  const currentTabComponent =
    tabComponents[resolvedTab as keyof typeof tabComponents] ?? <CRMDashboard />;

  const isDashboardTab = resolvedTab === "dashboard";

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Customers"
        description="End-to-end customer management—from onboarding to payments."
        icon={<Users size={20} strokeWidth={1.75} />}
      />
      <AppTabs tabs={crmTabs} activeTab={resolvedTab} onChange={handleTabChange} />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={null}>
          {currentTabComponent}
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default CRM;
