import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaTachometerAlt ,
  FaMoneyBillWave,
  FaMoneyBill,
  FaUsers,
  FaShoppingBag,
  FaBoxes,
  FaBriefcase,
  FaUserTie,
  FaBuilding,
  FaCog,
  FaBars,
  FaChevronDown,
  FaChevronUp,
  FaExchangeAlt,
  FaReceipt,
  FaUsersCog,
  FaSignOutAlt,
  FaUniversity
} from "react-icons/fa";
import { getCompanyById } from "../api/companySetupApi";
import { ERP_BASE } from "../config/api";
import { useAuth } from "../context/AuthContext";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { useCompanyStore } from "../store/companyStore";
import { MODAL_LAYER } from "./common/ModalManagerContext";

/* ── Menu config ── */

const menuItems = [
  { name: "Dashboard",      to: "/dashboard",   icon: <FaTachometerAlt  /> },
  { name: "Sales",          to: "/sales",       icon: <FaMoneyBillWave /> },
  { name: "Customer",       to: "/crm",         icon: <FaUsers /> },
  { name: "Procurement",    to: "/procurement", icon: <FaShoppingBag /> },
  { name: "Inventory",      to: "/inventory",   icon: <FaBoxes /> },
  { name: "Accounting",     to: "/accounting",  icon: <FaBriefcase /> },
  { name: "Human Resource", to: "/hr",          icon: <FaUserTie /> },
];

const settingsItems = [
  { to: "/companySetup",          label: "Company Setup",       icon: <FaBuilding /> },
  { to: "/userManagement",        label: "User Management",     icon: <FaUsers /> },
  { to: "/bank-account-setup",    label: "Bank Account",        icon: <FaUniversity /> },
  { to: "/mode-of-payment-setup", label: "Mode of Payment",     icon: <FaMoneyBill /> },
  { to: "/payment-entry",         label: "Payment Entry",       icon: <FaReceipt /> },
  { to: "/currency-conversion",   label: "Currency Exchange",   icon: <FaExchangeAlt /> },
  { to: "/customer-group",        label: "Customer Group",      icon: <FaUsersCog /> },
  { to: "/settings",              label: "General Settings",    icon: <FaCog /> },
];

/* ── Tooltip ── */

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

/* ── Props ── */

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setCompanyInfo = useCompanyStore((s) => s.setCompanyInfo);
  const location = useLocation();
  const [company, setCompany] = useState<{ name: string; logo?: string } | null>(null);
  const { logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  /* derive user initials */
  const username = localStorage.getItem("username") || "Admin User";
  const userInitials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* company initials fallback */
  const companyInitials = company?.name
    ? company.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "CO";

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
        setCompanyInfo(
          data?.companyName ?? "",
          data?.financialConfig?.baseCurrency ?? ""
        );
      } catch (err) {
        console.error("Failed to load company:", err);
      }
    };
    loadCompany();
  }, []);

  const isSettingsRoute = ["/settings", "/companySetup", "/userManagement"].some((p) =>
    location.pathname.startsWith(p)
  );

  /* close settings submenu when sidebar collapses */
  useEffect(() => {
    if (!open) setSettingsOpen(false);
  }, [open]);

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 flex flex-col
          border-r border-[var(--border)] bg-sidebar
          transition-[width] duration-300 ease-out overflow-hidden
          ${open ? "w-[var(--app-sidebar-width)]" : "w-[var(--app-sidebar-width-collapsed)]"}
        `}
        style={{ zIndex: MODAL_LAYER.sidebar }}
      >

        {/* ── Top bar ── */}
        <div className="flex h-[var(--app-topbar-height)] shrink-0 items-center justify-between border-b border-[var(--border)] px-3">
          {/* Logo / brand */}
          <div
            className={`
              flex items-center gap-2 overflow-hidden
              transition-all duration-300
              ${open ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"}
            `}
          >
            <span className="text-xl font-black tracking-tight text-primary select-none">ERP</span>
          </div>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-row-hover hover:text-primary transition"
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FaBars className="text-base" />
          </button>
        </div>

        {/* ── Company badge ── */}
        <div className={`shrink-0 border-b border-[var(--border)] transition-all duration-300 ${open ? "px-4 py-4" : "px-2 py-3"}`}>
          <div className={`flex items-center gap-3 ${open ? "" : "justify-center"}`}>
            {/* Logo box — always visible, size changes */}
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

            {/* Company name — only when expanded */}
            <div
              className={`
                flex flex-col min-w-0
                transition-all duration-200
                ${open ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden pointer-events-none"}
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

          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex h-10 w-full items-center rounded-lg transition-all duration-150
                ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted hover:bg-row-hover hover:text-main"}`
              }
            >
              {/* Icon — always centred in a fixed-width cell */}
              <span className={`flex h-10 shrink-0 items-center justify-center text-[17px] transition-all duration-300 ${open ? "w-10" : "w-full"}`}>
                {item.icon}
              </span>

              {/* Label */}
              <span
                className={`
                  truncate text-[14px] font-semibold tracking-tight transition-all duration-200 pr-3
                  ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                `}
              >
                {item.name}
              </span>

              {/* Tooltip when collapsed */}
              {!open && <Tooltip label={item.name} />}
            </NavLink>
          ))}

          {/* ── Settings group ── */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => open && setSettingsOpen((v) => !v)}
              title={!open ? "Settings" : undefined}
              className={`
                group relative flex h-10 w-full items-center rounded-lg transition-all duration-150
                ${settingsOpen || isSettingsRoute ? "bg-primary/10 text-primary font-semibold" : "text-muted hover:bg-row-hover hover:text-main"}
              `}
            >
              <span className={`flex h-10 shrink-0 items-center justify-center text-[17px] transition-all duration-300 ${open ? "w-10" : "w-full"}`}>
                <FaCog />
              </span>

              <span
                className={`
                  flex-1 truncate text-left text-[14px] font-semibold tracking-tight transition-all duration-200
                  ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                `}
              >
                Settings
              </span>

              {open && (
                <span className="mr-2 shrink-0 opacity-50 text-xs">
                  {settingsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              )}

              {!open && <Tooltip label="Settings" />}
            </button>

            {/* Submenu — only when expanded */}
            {open && settingsOpen && (
              <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-[var(--border)] pl-3">
                {settingsItems.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all
                      ${isActive ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-row-hover hover:text-primary"}`
                    }
                  >
                    <span className="shrink-0 text-sm">{sub.icon}</span>
                    <span className="truncate">{sub.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* ── User footer ── */}
        <div className="shrink-0 border-t border-[var(--border)] px-2 py-3">
          <div className={`flex items-center gap-2 ${open ? "" : "flex-col"}`}>

            {/* Avatar */}
            <div className="relative group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-black shadow-sm select-none">
                {userInitials}
              </div>
              {!open && <Tooltip label={username} />}
            </div>

            {/* Name + role — expanded only */}
            <div
              className={`
                flex min-w-0 flex-1 flex-col leading-tight
                transition-all duration-200
                ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden pointer-events-none"}
              `}
            >
              <span className="truncate text-sm font-bold text-main">{username}</span>
              <span className="text-[10px] font-black uppercase tracking-tight text-muted">
                Administrator
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => setLogoutOpen(true)}
              className={`
                flex shrink-0 items-center justify-center rounded-lg p-2
                text-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition
                ${!open ? "w-9 h-9" : ""}
              `}
              title="Logout"
            >
              <FaSignOutAlt className="text-sm" />
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