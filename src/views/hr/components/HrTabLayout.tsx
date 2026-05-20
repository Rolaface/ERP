import React from "react";
import { AppSubTabs, AppTabs } from "../../../components/ui/app-shell";

export type HrTabItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

type HrPrimaryTabsProps = {
  tabs: HrTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export const HrPrimaryTabs: React.FC<HrPrimaryTabsProps> = ({
  tabs,
  activeTab,
  onChange,
}) => (
  <div className="pt-3">
    <AppTabs tabs={tabs} activeTab={activeTab} onChange={onChange} />
  </div>
);

type HrSecondaryTabsProps = {
  tabs: HrTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export const HrSecondaryTabs: React.FC<HrSecondaryTabsProps> = ({
  tabs,
  activeTab,
  onChange,
}) => (
  <AppSubTabs tabs={tabs} activeTab={activeTab} onChange={onChange} />
);

type HrSectionFrameProps = {
  tabs?: HrTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
};

export const HrSectionFrame: React.FC<HrSectionFrameProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => (
  <section className="flex min-h-0 flex-1 flex-col gap-4">
    {tabs && activeTab && onTabChange ? (
      <HrSecondaryTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
    ) : null}

    <div className="min-w-0 flex-1">{children}</div>
  </section>
);
