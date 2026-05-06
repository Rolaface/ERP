import React, { useState } from "react";
import TaxTemplate from "../Inventory/TaxTemplate";
import TaxCategory from "../Inventory/TaxCategory";
import SalesTaxTemplate from "./Salestaxtemplate";
import {
  ReceiptText,
  FileSpreadsheet,
  Tags,
  Calculator,
} from "lucide-react";

import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState("taxTemplate");

  const isDashboardTab = activeTab === "taxTemplate";

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Tax Maintenance"
        description="Manage tax templates and categories"
        icon={<Calculator  />}
      />

      <AppTabs
        tabs={[
          {
            id: "taxTemplate",
            label: "Tax Templates",
             icon: <ReceiptText size={16} strokeWidth={1.75} />,
          },

          {
            id: "salesTaxTemplate",
            label: "Sales Tax Template",
            icon: <FileSpreadsheet size={16} strokeWidth={1.75} />,
          },

          { id: "taxCategory", label: "Tax Category", icon: <Tags size={16} strokeWidth={1.75} /> },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      <AppPageBody viewportLocked={isDashboardTab}>
        {activeTab === "taxTemplate" && <TaxTemplate />}

        {activeTab === "salesTaxTemplate" && <SalesTaxTemplate />}
        {activeTab === "taxCategory" && <TaxCategory />}
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
