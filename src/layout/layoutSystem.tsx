import React from "react";

type DockWidth = "80" | "90" | "100";

const dockWidthClasses: Record<DockWidth, string> = {
  "80": "sm:w-[80%]",
  "90": "sm:w-[90%]",
  "100": "sm:w-full",
};

export const getDockWidthClasses = (width: DockWidth = "90") =>
  dockWidthClasses[width];

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children, sidebar, rightPanel }) => (
  <div className="flex min-h-screen bg-app text-main">
    {sidebar}
    <div className="flex flex-1 min-w-0 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>
      {rightPanel && (
        <div className="flex-shrink-0 h-full">
          {rightPanel}
        </div>
      )}
    </div>
  </div>
);

interface AppMainProps {
  sidebarOpen: boolean;
  rightPanelOpen?: boolean;
  children: React.ReactNode;
}

export const AppMain: React.FC<AppMainProps> = ({
  sidebarOpen,
  children,
}) => (
  <main
    className="flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-out"
    style={{
      paddingLeft: sidebarOpen ? 'var(--app-sidebar-width)' : 'var(--app-sidebar-width-collapsed)',
    } as React.CSSProperties}
  >
    {children}
  </main>
);

interface RightPanelProps {
  children?: React.ReactNode;
}

export const RightPanel: React.FC<RightPanelProps> = ({ children }) => {
  return (
    <aside
      className="flex flex-col w-14 min-w-14 shrink-0"
    >
      {children}
    </aside>
  );
};

export const AppContentContainer: React.FC<{
  children: React.ReactNode;
  viewportLocked?: boolean;
}> = ({
  children,
  viewportLocked = false,
}) => (
  <div
    className={[
      "mx-auto flex w-full max-w-[1400px] flex-col px-4 py-4",
      viewportLocked ? "h-screen overflow-hidden" : "overflow-visible",
    ].join(" ")}
  >
    {children}
  </div>
);
