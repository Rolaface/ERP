import React, { useState } from "react";
import { FaBoxOpen, FaBoxes } from "react-icons/fa";
import TaxTemplate from "../Inventory/TaxTemplate";

import TaxCategory from "../Inventory/TaxCategory";

import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Tax  Maintenance");
  const isDashboardTab = activeTab === "taxTemplates";

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Tax Maintenance"
        description="-----------------------------------."
        icon={<FaBoxes />}
      />
      <AppTabs
        tabs={[
          { id: "taxTemplates", label: "Tax Templates", icon: <FaBoxOpen /> },

          { id: "taxCategory", label: "Tax Category", icon: <FaBoxOpen /> },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
        }}
      />
      <AppPageBody viewportLocked={isDashboardTab}>
        {activeTab === "TaxTemplate" && <TaxTemplate />}
        {activeTab === "taxCategory" && <TaxCategory />}
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
