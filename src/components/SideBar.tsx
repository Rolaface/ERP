import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  ShoppingBag,
  Boxes,
  Wallet,
  Building2,
  UserCog,
  Settings,
  Menu,
  ChevronDown,
  ChevronUp,
  Repeat,
  Receipt,
  Users2,
  LogOut,
  Landmark,
  Calculator,
  Calendar,
  Clock,
  FileText,
  BarChart2,
  ShieldCheck,
  Star,
  Mail,
  User,
  CreditCard,
} from "lucide-react";
import { getCompanyById } from "../api/companySetupApi";
import { ERP_BASE } from "../config/api";
import { useAuth } from "../context/AuthContext";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { useCompanyStore } from "../store/companyStore";
import { MODAL_LAYER } from "../store/modalStore";
import { usePermission } from "../hooks/permission/usePermission";
import { useHRView } from "../hooks/permission/useHRView";

const iconProps = { size: 18, strokeWidth: 1.75 };

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  /** Empty array = always visible */
  modules?: string[];
  /** If true, hidden when user is in employee view */
  hideInEmployeeView?: boolean;
}

interface SettingsItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  modules?: string[];
  /** If true, hidden when user is in employee view */
  hideInEmployeeView?: boolean;
}

// ─── Employee HR sub-tabs ─────────────────────────────────────────────────────
// Must stay in sync with EMPLOYEE_TAB_IDS in HrPayrollModule.tsx

interface EmployeeTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const EMPLOYEE_HR_TABS: EmployeeTabItem[] = [
  {
    id: "emp-dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-profile",
    label: "My Profile",
    icon: <User size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-leave",
    label: "Leave",
    icon: <Calendar size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-timesheet",
    label: "Timesheet & Attendance",
    icon: <Clock size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-financials",
    label: "Financials",
    icon: <Wallet size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-compliance",
    label: "Compliance",

    icon: <ShieldCheck size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-expenses",
    label: "Expense Claim",
    icon: <CreditCard size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-appraisals",
    label: "Appraisals",
    icon: <Star size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-documents",
    label: "Documents",
    icon: <FileText size={16} strokeWidth={1.75} />,
  },
  {
    id: "emp-reports",
    label: "Reports",
    icon: <BarChart2 size={16} strokeWidth={1.75} />,
  },
];

// ─── Main menu items ──────────────────────────────────────────────────────────

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    to: "/dashboard",
    icon: <LayoutDashboard {...iconProps} />,
    modules: [],
    hideInEmployeeView: true, // ← hidden in employee view
  },
  {
    name: "Sales",
    to: "/sales",
    icon: <ShoppingCart {...iconProps} />,
    modules: ["Sales Invoice"],
    hideInEmployeeView: true,
  },
  {
    name: "Customer",
    to: "/crm",
    icon: <Users {...iconProps} />,
    modules: ["Customer", "Payment Entry","Customer Group"],
    hideInEmployeeView: true,
  },
  {
    name: "Procurement",
    to: "/procurement",
    icon: <ShoppingBag {...iconProps} />,
    modules: [
      "Supplier",
      "Payment Entry",
      "Request For Quotation",
      "Purchase Order",
      "Purchase Invoice",
    ],
    hideInEmployeeView: true,
  },
  {
    name: "Inventory",
    to: "/inventory",
    icon: <Boxes {...iconProps} />,
    modules: ["Item", "Item Group", "Warehouse", "Stock Entry"],
    hideInEmployeeView: true,
  },
  {
    name: "Accounting",
    to: "/accounting",
    icon: <Wallet {...iconProps} />,
    modules: ["GL Entry", "Journal Entry"],
    hideInEmployeeView: true,
  },
  {
    name: "Assets",
    to: "/fasset",
    icon: <Building2 {...iconProps} />,
    modules: ["Asset Category", "Asset", "Asset Movement"],
    hideInEmployeeView: true,
  },
  // {
  //   name: "Performance",
  //   to: "/performance",
  //   icon: <BarChart2 {...iconProps} />,
  //   modules: ["Performance"],
  //   hideInEmployeeView: false, 
  // },
];

const settingsItems: SettingsItem[] = [
  {
    to: "/companySetup",
    label: "Company Setup",
    icon: <Building2 {...iconProps} />,
    modules: ["Company"],
    hideInEmployeeView: true,
  },
  {
    to: "/userManagement",
    label: "User and Roles",
    icon: <Users2 {...iconProps} />,
    modules: ["User"],
    hideInEmployeeView: true,
  },
  {
    to: "/bank-management",
    label: "Bank Management",
    icon: <Landmark {...iconProps} />,
    modules: ["Bank", "Bank Account" , "Mode of Payment","Currency Exchange"],
    hideInEmployeeView: true,
  },
  // {
  //   to: "/mode-of-payment-setup",
  //   label: "Mode of Payment",
  //   icon: <Wallet {...iconProps} />,
  //   modules: ["Mode of Payment"],
  //   hideInEmployeeView: true,
  // },
  // {
  //   to: "/payment-entry",
  //   label: "Payment Entry",
  //   icon: <Receipt {...iconProps} />,
  //   modules: ["Payment Entry"],
  //   hideInEmployeeView: true,
  // },
  // {
  //   to: "/currency-conversion",
  //   label: "Currency Exchange",
  //   icon: <Repeat {...iconProps} />,
  //   modules: ["Currency Exchange"],
  //   hideInEmployeeView: true,
  // },
  // {
  //   to: "/customer-group",
  //   label: "Customer Group",
  //   icon: <Users {...iconProps} />,
  //   modules: ["Customer Group"],
  //   hideInEmployeeView: true,
  // },
  {
    to: "/Tax-Maintenance",
    label: "Tax Maintenance",
    icon: <Calculator {...iconProps} />,
    modules: [
      "Item Tax Template",
      "Tax Category",
      "Sales Taxes and Charges Template",
    ],
    hideInEmployeeView: true,
  },
  {
    to: "/Expense-Management",
    label: "Expense Management",
    icon: <CreditCard {...iconProps} />,
    modules: ["Expense Claim", "Expense Claim Type","Employee Advance"],
    hideInEmployeeView: true,
  },
  {
    to: "/Email-Template",
    label: "Email Template",
    icon: <Mail {...iconProps} />,
    modules: ["Email Template"],
    hideInEmployeeView: true,
  },
  {
    to: "/settings",
    label: "User Preferences",
    icon: <UserCog {...iconProps} />,
    modules: [],
    hideInEmployeeView: true, // ← hidden in employee view
  },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className="
        pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2
        whitespace-nowrap rounded-lg border border-[var(--border)] bg-card
        px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-main
        opacity-0 shadow-xl transition-all duration-150
        group-hover:opacity-100
      "
      style={{ zIndex: 9999 }}
    >
      {label}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setCompanyInfo = useCompanyStore((s) => s.setCompanyInfo);
  const location = useLocation();
  const navigate = useNavigate();

  const [company, setCompany] = useState<{
    name: string;
    logo?: string;
  } | null>(null);
  const { logout, user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { canAccessAnyOf, isLoading: permissionsLoading } = usePermission();

  // ── HR view mode ──────────────────────────────────────────────────────────
  const { viewMode } = useHRView();
  const isEmployeeView = viewMode === "employee";

  const isHrRoute = location.pathname.startsWith("/hr");

  const activeEmpTabId = useMemo(() => {
    if (!isHrRoute) return EMPLOYEE_HR_TABS[0].id;
    const segment = location.pathname.replace(/^\/hr\/?/, "").split("?")[0];
    const found = EMPLOYEE_HR_TABS.find((t) => t.id === segment);
    return found ? found.id : EMPLOYEE_HR_TABS[0].id;
  }, [location.pathname, isHrRoute]);

  // Navigate to an employee tab
  const handleEmpTabClick = (tabId: string) => {
    navigate(`/hr/${tabId}`);
  };

  // ── Permission-filtered items ─────────────────────────────────────────────

  const visibleMenuItems = useMemo(
    () =>
      menuItems.filter((item) => {
        if (isEmployeeView && item.hideInEmployeeView) return false;
        if (!item.modules || item.modules.length === 0) return true;
        return canAccessAnyOf(item.modules);
      }),
    [canAccessAnyOf, permissionsLoading, isEmployeeView],
  );

  const visibleSettingsItems = useMemo(
    () =>
      settingsItems.filter((item) => {
        if (isEmployeeView && item.hideInEmployeeView) return false;
        if (!item.modules || item.modules.length === 0) return true;
        return canAccessAnyOf(item.modules);
      }),
    [canAccessAnyOf, permissionsLoading, isEmployeeView],
  );

  const canSeeHr = canAccessAnyOf(["Employee", "Payroll Entry"]);
  const showSettingsSection = visibleSettingsItems.length > 0;

  // ── User display ──────────────────────────────────────────────────────────
  const username = user?.fullName || user?.username || "User";
  const userInitials = username
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const companyInitials = company?.name
    ? company.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CO";

  // ── Load company ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;
        if (!COMPANY_ID) return;
        const res = await getCompanyById(COMPANY_ID);
        const data = res?.data;
        setCompany({
          name: data?.companyName || "Company",
          logo: data?.documents?.companyLogoUrl
            ? `${ERP_BASE}${data.documents.companyLogoUrl}`
            : undefined,
        });
        setCompanyInfo({
          companyName: data?.companyName,
          baseCurrency: data?.financialConfig?.baseCurrency,
        });
      } catch (err) {
        console.error("Failed to load company:", err);
      }
    };
    loadCompany();
  }, []);

  const isSettingsRoute = [
    "/settings",
    "/companySetup",
    "/userManagement",
    "/bank-management",
    "/mode-of-payment-setup",
    "/payment-entry",
    "/currency-conversion",
    "/customer-group",
    "/Tax-Maintenance",
    "/Expense-Management",
    "/Email-Template",
  ].some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (!open) setSettingsOpen(false);
  }, [open]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 flex flex-col
          border-r border-[var(--border)] bg-sidebar
          transition-[width] duration-300 ease-out overflow-hidden
          ${
            open
              ? "w-[var(--app-sidebar-width)]"
              : "w-[var(--app-sidebar-width-collapsed)]"
          }
        `}
        style={{ zIndex: MODAL_LAYER.sidebar }}
      >
        {/* ── Top bar ── */}
        <div className="flex h-[var(--app-topbar-height)] shrink-0 items-center justify-between border-b border-[var(--border)] px-3">
          <div
            className={`
              flex items-center gap-2 overflow-hidden transition-all duration-300
              ${open ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"}
            `}
          >
            <span className="text-xl font-black tracking-tight text-primary select-none">
              ERP
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-row-hover hover:text-primary transition"
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* ── Company badge ── */}
        <div
          className={`
            shrink-0 border-b border-[var(--border)] transition-all duration-300
            ${open ? "px-4 py-4" : "px-2 py-3"}
          `}
        >
          <div
            className={`flex items-center gap-3 ${open ? "" : "justify-center"}`}
          >
            <div
              className={`
                flex shrink-0 items-center justify-center overflow-hidden
                rounded-xl border border-[var(--border)] bg-card font-bold text-primary
                transition-all duration-300
                ${open ? "h-11 w-11 text-sm" : "h-10 w-10 text-sm"}
              `}
            >
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt="Company Logo"
                  className="h-full w-full object-contain p-0.5"
                />
              ) : (
                <span>{companyInitials}</span>
              )}
            </div>
            <div
              className={`
                flex flex-col min-w-0 transition-all duration-200
                ${
                  open
                    ? "opacity-100 w-auto"
                    : "opacity-0 w-0 overflow-hidden pointer-events-none"
                }
              `}
            >
              <span className="truncate text-sm font-bold text-main leading-tight">
                {company?.name ?? "Loading…"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
          {/* ── Regular menu items ── */}
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex h-10 w-full items-center rounded-lg transition-all duration-150
                ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted hover:bg-row-hover hover:text-main"
                }`
              }
            >
              <span
                className={`
                  flex h-10 shrink-0 items-center justify-center text-[17px]
                  transition-all duration-300 ${open ? "w-10" : "w-full"}
                `}
              >
                {item.icon}
              </span>
              <span
                className={`
                  truncate text-[14px] font-semibold tracking-tight
                  transition-all duration-200 pr-3
                  ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                `}
              >
                {item.name}
              </span>
              {!open && <Tooltip label={item.name} />}
            </NavLink>
          ))}

          {/* ── HR Section ───────────────────────────────────────────────
              Employee view  → flat employee tabs list
              Professional   → single "Human Resource" NavLink
          ────────────────────────────────────────────────────────────── */}
          {canSeeHr &&
            (isEmployeeView ? (
              <div className="pt-1">
                {/* Section label (expanded only) */}
                {/* {open && (
                  <p className="px-3 pb-1 pt-0.5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                    Human Resources
                  </p>
                )} */}
                {!open && <div className="mx-3 mb-1 h-px bg-[var(--border)]" />}

                <div className="space-y-0.5">
                  {EMPLOYEE_HR_TABS.map((t) => {
                    const isActive = isHrRoute && activeEmpTabId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleEmpTabClick(t.id)}
                        title={!open ? t.label : undefined}
                        className={`
                          group relative flex h-10 w-full items-center rounded-lg
                          transition-all duration-150
                          ${
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted hover:bg-row-hover hover:text-main"
                          }
                        `}
                      >
                        {isActive && (
                          <span
                            className="
                              absolute left-0 top-1/2 -translate-y-1/2
                              h-5 w-0.5 rounded-r-full bg-primary
                            "
                          />
                        )}
                        <span
                          className={`
                            flex h-10 shrink-0 items-center justify-center text-[17px]
                            transition-all duration-300 ${open ? "w-10" : "w-full"}
                          `}
                        >
                          {t.icon}
                        </span>
                        <span
                          className={`
                            truncate text-[14px] font-semibold tracking-tight
                            transition-all duration-200 pr-3
                            ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                          `}
                        >
                          {t.label}
                        </span>
                        {!open && <Tooltip label={t.label} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Professional view — original single link
              <NavLink
                to="/hr"
                className={({ isActive }) =>
                  `group relative flex h-10 w-full items-center rounded-lg transition-all duration-150
                  ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted hover:bg-row-hover hover:text-main"
                  }`
                }
              >
                <span
                  className={`
                    flex h-10 shrink-0 items-center justify-center text-[17px]
                    transition-all duration-300 ${open ? "w-10" : "w-full"}
                  `}
                >
                  <UserCog {...iconProps} />
                </span>
                <span
                  className={`
                    truncate text-[14px] font-semibold tracking-tight
                    transition-all duration-200 pr-3
                    ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                  `}
                >
                  Human Resource
                </span>
                {!open && <Tooltip label="Human Resource" />}
              </NavLink>
            ))}

          {/* ── Settings ── */}
          {showSettingsSection && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => open && setSettingsOpen((v) => !v)}
                title={!open ? "Settings" : undefined}
                className={`
                  group relative flex h-10 w-full items-center rounded-lg transition-all duration-150
                  ${
                    settingsOpen || isSettingsRoute
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted hover:bg-row-hover hover:text-main"
                  }
                `}
              >
                <span
                  className={`
                    flex h-10 shrink-0 items-center justify-center text-[17px]
                    transition-all duration-300 ${open ? "w-10" : "w-full"}
                  `}
                >
                  <Settings size={18} />
                </span>
                <span
                  className={`
                    flex-1 truncate text-left text-[14px] font-semibold tracking-tight
                    transition-all duration-200
                    ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                  `}
                >
                  Settings
                </span>
                {open && (
                  <span className="mr-2 shrink-0 opacity-50 text-xs">
                    {settingsOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </span>
                )}
                {!open && <Tooltip label="Settings" />}
              </button>

              {open && settingsOpen && (
                <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-[var(--border)] pl-3">
                  {visibleSettingsItems.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all
                        ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:bg-row-hover hover:text-primary"
                        }`
                      }
                    >
                      <span className="shrink-0 text-sm">{sub.icon}</span>
                      <span className="truncate">{sub.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ── User footer ── */}
        <div className="shrink-0 border-t border-[var(--border)] px-2 py-3">
          <div className={`flex items-center gap-2 ${open ? "" : "flex-col"}`}>
            <div className="relative group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-black shadow-sm select-none">
                {userInitials}
              </div>
              {!open && <Tooltip label={username} />}
            </div>
            <div
              className={`
                flex min-w-0 flex-1 flex-col leading-tight transition-all duration-200
                ${
                  open
                    ? "opacity-100"
                    : "opacity-0 w-0 overflow-hidden pointer-events-none"
                }
              `}
            >
              <span className="truncate text-sm font-bold text-main">
                {username}
              </span>
              <span className="text-[10px] font-black uppercase tracking-tight text-muted">
                {user?.username || "User"}
              </span>
            </div>
            <button
              onClick={() => setLogoutOpen(true)}
              className={`
                flex shrink-0 items-center justify-center rounded-lg p-2
                text-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition
                ${!open ? "w-9 h-9" : ""}
              `}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <LogoutConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await logout();
        }}
      />
    </>
  );
};

export default Sidebar;
