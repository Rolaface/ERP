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
  <AppTabs tabs={tabs} activeTab={activeTab} onChange={onChange} />
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
  className?: string;
};

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export const HR_CONTENT_FRAME_CLASS = "flex min-h-0 flex-1 flex-col gap-3";
export const HR_TABLE_FRAME_CLASS = "min-w-0 min-h-0 flex-1";

type HrFrameProps = {
  children: React.ReactNode;
  className?: string;
};

export const HrContentFrame: React.FC<HrFrameProps> = ({
  children,
  className,
}) => (
  <div className={joinClasses(HR_CONTENT_FRAME_CLASS, className)}>
    {children}
  </div>
);

export const HrTableFrame: React.FC<HrFrameProps> = ({
  children,
  className,
}) => (
  <div className={joinClasses(HR_TABLE_FRAME_CLASS, className)}>
    {children}
  </div>
);

export const HrSectionFrame: React.FC<HrSectionFrameProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}) => (
  <section className={joinClasses(HR_CONTENT_FRAME_CLASS, className)}>
    {tabs && activeTab && onTabChange ? (
      <HrSecondaryTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
    ) : null}

    <HrTableFrame>{children}</HrTableFrame>
  </section>
);
