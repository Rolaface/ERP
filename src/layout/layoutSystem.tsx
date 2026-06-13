import React from "react";

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children, sidebar }) => (
  <div className="flex h-screen bg-app text-main overflow-hidden">
    {sidebar}
    <div className="flex flex-1 min-w-0 overflow-hidden">
      <div className="flex flex-1 min-w-0 overflow-hidden">
  {children}
</div>
    </div>
  </div>
);

interface AppMainProps {
  sidebarOpen: boolean;
  children: React.ReactNode;
}

export const AppMain: React.FC<AppMainProps> = ({ sidebarOpen, children }) => (
  <main
    className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-out"
    style={
      {
        paddingLeft: sidebarOpen
          ? "var(--app-sidebar-width)"
          : "var(--app-sidebar-width-collapsed)",
      } as React.CSSProperties
    }
  >
    {children}
  </main>
);

export const AppContentContainer: React.FC<{
  children: React.ReactNode;
  viewportLocked?: boolean;
}> = ({ children, viewportLocked = false }) => (
  <div
    className={[
      "flex w-full flex-1 flex-col min-h-0",
      viewportLocked
        ? "overflow-hidden h-full"
        : "overflow-y-auto overscroll-contain px-3 py-2.5 sm:px-4 sm:py-3",
    ].join(" ")}
  >
    {children}
  </div>
);
