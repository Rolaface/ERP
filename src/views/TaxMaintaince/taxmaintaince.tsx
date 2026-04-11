import React, { useState } from "react";
import { FaPercentage } from "react-icons/fa";
import TaxTemplate from "../Inventory/TaxTemplate";
import SalesTax from "./salesTax";
import TaxCategory from "../Inventory/TaxCategory";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { FaTags } from "react-icons/fa";

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
        icon={<FaPercentage />}
      />

      <AppTabs
        tabs={[
          {
            id: "taxTemplate",
            label: "Item Tax Templates",
            icon: <FaFileInvoiceDollar />,
          },
          { id: "salesTax", label: "Sales Tax Templates", icon: <FaTags /> },
          { id: "taxCategory", label: "Tax Category", icon: <FaTags /> },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      <AppPageBody viewportLocked={isDashboardTab}>
        {activeTab === "taxTemplate" && <TaxTemplate />}
        {activeTab === "salesTax" && <SalesTax />}
        {activeTab === "taxCategory" && <TaxCategory />}
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
