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
}

export const AppShell: React.FC<AppShellProps> = ({ children, sidebar }) => (
  <div className="flex min-h-screen bg-app text-main">
    {sidebar}
    {children}
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
    className="flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out md:pl-[var(--app-sidebar-offset)]"
    style={
      {
        "--app-sidebar-offset": sidebarOpen
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
