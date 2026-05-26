import React from "react";

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children, sidebar }) => (
  <div className="flex min-h-screen bg-app text-main">
    {sidebar}
    <div className="flex flex-1 min-w-0 overflow-visible">
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  </div>
);

interface AppMainProps {
  sidebarOpen: boolean;
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

export const AppContentContainer: React.FC<{
  children: React.ReactNode;
  viewportLocked?: boolean;
}> = ({
  children,
  viewportLocked = false,
}) => (
  <div
    className={[
      "flex w-full flex-1 flex-col px-3 py-2.5 min-h-0 overflow-visible",
      viewportLocked ? "h-screen" : "",
    ].join(" ")}
  >
    {children}
  </div>
);
