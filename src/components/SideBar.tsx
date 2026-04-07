import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaChartBar,
  FaMoneyBillWave,
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
     FaUsersCog 
} from "react-icons/fa";
import { getCompanyById } from "../api/companySetupApi";
import { ERP_BASE } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { useCompanyStore } from "../store/companyStore";
import { MODAL_LAYER } from "./common/ModalManagerContext";


const menuItems = [
  { name: "Dashboard", to: "/dashboard", icon: <FaChartBar /> },
  { name: "Sales", to: "/sales", icon: <FaMoneyBillWave /> },
  { name: "Customer", to: "/crm", icon: <FaUsers /> },
  { name: "Procurement", to: "/procurement", icon: <FaShoppingBag /> },
  { name: "Inventory", to: "/inventory", icon: <FaBoxes /> },
  { name: "Accounting", to: "/accounting", icon: <FaBriefcase /> },
  { name: "Human Resource", to: "/hr", icon: <FaUserTie /> },
  // { name: "Fixed Assets", to: "/fasset", icon: <FaWarehouse /> },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setCompanyInfo = useCompanyStore((s) => s.setCompanyInfo); 
  const location = useLocation();
  const [company, setCompany] = useState<{
    name: string;
    logo?: string;
  } | null>(null);

  const { logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);


  useEffect(() => {
    const loadCompany = async () => {
      try {
        const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;
        if (!COMPANY_ID) {
          console.warn("No COMPANY_ID in env");
          return;
        }
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

  // const handleLogout = () => {
  //   localStorage.removeItem("authToken");
  //   navigate("/login");
  // };

  const settingsRoutes = ["/settings", "/companySetup", "/userManagement"];
  const isSettingsRoute = settingsRoutes.some((p) =>
    location.pathname.startsWith(p),
  );

  return (
    <>
      <div
        className={`app-sidebar fixed inset-y-0 left-0 flex shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-sidebar transition-[width] duration-300 ease-out ${
          open ? "w-[var(--app-sidebar-width)]" : "w-[var(--app-sidebar-width-collapsed)]"
        }`}
        style={{ zIndex: MODAL_LAYER.sidebar }}
      >
        <div className="flex h-[var(--app-topbar-height)] items-center justify-between border-b border-[var(--border)] px-4 shrink-0">
          <div className="flex items-center overflow-hidden">
            {open && (
              <h2 className="truncate text-xl font-bold text-primary">ERP</h2>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-2xl text-muted hover:text-primary transition shrink-0"
          >
            <FaBars />
          </button>
        </div>

        {company && (
          <div className="border-b border-[var(--border)] px-4 py-4">
            <div
              className={`flex items-center gap-3 ${open ? "justify-start" : "justify-center"}`}
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {company.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                )}
              </div>

              {open && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-bold text-main">
                    {company.name}
                  </span>
                  <span className="text-[11px] font-medium text-muted">
                    Workspace
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `nav-link group relative flex items-center h-11 rounded-xl transition-all duration-200 shrink-0 ${isActive ? "active shadow-sm" : "hover:bg-row-hover"
                }`
              }
            >
              {/* Center Icon */}
              <div className="flex items-center justify-center min-w-[48px] shrink-0">
                <span className="text-xl nav-icon">{item.icon}</span>
              </div>

              {/* Text hidden when collapsed, no wrap */}
              <span
                className={`font-semibold text-sm nav-text whitespace-nowrap transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 invisible"}`}
              >
                  {item.name}
              </span>

              {!open && (
                <span className="absolute left-16 bg-card text-main border border-[var(--border)] text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 whitespace-nowrap shadow-xl translate-x-2 group-hover:translate-x-0">
                  {item.name}
                </span>
              )}
            </NavLink>
          ))}

          {/* Settings Group */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`nav-link group relative flex items-center h-11 w-full rounded-xl transition-all shrink-0 ${settingsOpen || isSettingsRoute ? "active" : "hover:bg-row-hover"
                }`}
            >
              <div className="flex items-center justify-center min-w-[48px] shrink-0">
                <FaCog className="text-xl nav-icon" />
              </div>

              <span
                className={`font-semibold text-sm nav-text whitespace-nowrap transition-opacity duration-200 flex-1 text-left ${open ? "opacity-100" : "opacity-0 invisible"}`}
              >
                Settings
              </span>

              {open && (
                <span className="mr-2 opacity-50 shrink-0">
                  {settingsOpen ? (
                    <FaChevronUp className="text-xs" />
                  ) : (
                    <FaChevronDown className="text-xs" />
                  )}
                </span>
              )}
            </button>

            {open && settingsOpen && (
              <div className="mt-2 space-y-1 border-l-2 border-[var(--border)] pl-4">
                {[
                  {
                    to: "/companySetup",
                    label: "Company Setup",
                    icon: <FaBuilding />,
                  },
                  {
                    to: "/userManagement",
                    label: "User Management",
                    icon: <FaUsers />,
                  },
                  {
  to: "/bank-account-setup",
  label: "Bank Account Setup",
  icon: <FaBars />
},
{
  to: "/mode-of-payment-setup",
  label: "Mode of Payment Setup",
  icon: <FaMoneyBillWave />
},
{
  to: "/payment-entry",
  label: "Payment Entry",
  icon: < FaReceipt />
},
{
  to: "/currency-conversion",
  label: "Currency Exchange",
  icon: <FaExchangeAlt />
},
{
  to: "/customer-group",
  label: "Customer Group",
  icon: <FaUsersCog/>
},
                  { to: "/settings", label: "General Settings", icon: <FaCog /> },
                ].map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-bold transition-all ${isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:bg-row-hover hover:text-primary"
                      }`
                    }
                  >
                    <span className="text-base shrink-0">{sub.icon}</span>
                    <span className="whitespace-nowrap">{sub.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] bg-sidebar px-4 py-4">
          <div className={`flex items-center ${open ? "justify-between" : "flex-col gap-4"}`}>
            <div className="flex items-center gap-3 relative group">
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-sm">
                {(() => {
                  const name = localStorage.getItem("username") || "User";
                  return name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                })()}
              </div>

              {open && (
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="font-bold text-main text-sm truncate">
                    {localStorage.getItem("username") || "Admin User"}
                  </span>
                  <span className="text-muted text-[10px] uppercase font-black tracking-tighter">
                    Administrator
                  </span>
                </div>
              )}

              {!open && (
                <span className="absolute left-12 bg-card text-main text-xs px-3 py-1 rounded shadow-xl border border-[var(--border)] opacity-0 group-hover:opacity-100 whitespace-nowrap transition z-50">
                  {localStorage.getItem("username") || "User"}
                </span>
              )}
            </div>

            <button
              onClick={() => setLogoutOpen(true)}
              className="p-2 rounded-lg text-danger hover:bg-row-hover transition"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </div>

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
