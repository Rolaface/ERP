import React, { useState, useMemo } from "react";
import TaxTemplate from "../Inventory/TaxTemplate";
import TaxCategory from "../Inventory/TaxCategory";
import SalesTaxTemplate from "./Salestaxtemplate";
import {
  ReceiptText,
  FileSpreadsheet,
  Tags,
  Calculator,
} from "lucide-react";
import { usePermission } from "../../hooks/permission/usePermission";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";

const ALL_TAX_TABS = [
  {
    id: "taxTemplate",
    label: "Tax Templates",
    icon: <ReceiptText size={16} strokeWidth={1.75} />,
    module: "Item Tax Template",
    action: "read" as const,
  },

  {
    id: "salesTaxTemplate",
    label: "Sales Tax Template",
    icon: <FileSpreadsheet size={16} strokeWidth={1.75} />,
    module: "Sales Taxes and Charges Template",
    action: "read" as const,
  },

  {
    id: "taxCategory",
    label: "Tax Category",
    icon: <Tags size={16} strokeWidth={1.75} />,
    module: "Tax Category",
    action: "read" as const,
  },
];

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState("taxTemplate");

  const { can } = usePermission();

  const taxTabs = useMemo(
    () =>
      ALL_TAX_TABS.filter(
        (t) => !t.module || can(t.module, t.action)
      ),
    [can]
  );

  const resolvedTab =
    taxTabs.find((t) => t.id === activeTab)?.id ??
    taxTabs[0]?.id ??
    "taxTemplate";
  const isDashboardTab = resolvedTab === "taxTemplate";



  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Tax Maintenance"
        description="Manage tax templates and categories"
        icon={<Calculator />}
      />

      <AppTabs
        tabs={taxTabs}
        activeTab={resolvedTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />


      <AppPageBody viewportLocked={isDashboardTab}>
        {resolvedTab === "taxTemplate" && <TaxTemplate />}

        {resolvedTab === "salesTaxTemplate" && <SalesTaxTemplate />}
        {resolvedTab === "taxCategory" && <TaxCategory />}
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
