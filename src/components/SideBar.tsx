import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Users,
  ShoppingCart,
  Boxes,
  Briefcase,
  UserRound,
  Building2,
  Settings,
  Menu,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { getCompanyById } from "../api/companySetupApi";
import { ERP_BASE } from "../config/api";
import { useAuth } from "../context/AuthContext";
import LogoutConfirmModal from "./LogoutConfirmModal";

const menuItems = [
  {
    name: "Dashboard",
    to: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: "Sales",
    to: "/sales",
    icon: <Receipt className="w-5 h-5" />,
  },
  { name: "Customer", to: "/crm", icon: <Users className="w-5 h-5" /> },
  {
    name: "Procurement",
    to: "/procurement",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  { name: "Inventory", to: "/inventory", icon: <Boxes className="w-5 h-5" /> },
  {
    name: "Accounting",
    to: "/accounting",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    name: "Human Resource",
    to: "/hr",
    icon: <UserRound className="w-5 h-5" />,
  },
  // { name: "Fixed Assets", to: "/fasset", icon: <FaWarehouse /> },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
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
        style={{ backgroundColor: "#ffffff", backgroundImage: "none" }}
        className={`flex flex-col h-screen fixed z-50 shadow-2xl transition-all duration-300 border-r border-[var(--border)] overflow-hidden ${
          open ? "w-64" : "w-20"
        }`}
      >
        {/* 1. HEADER */}
        <div
          style={{ backgroundColor: "#ffffff", backgroundImage: "none" }}
          className="flex items-center justify-between p-4 h-16 shrink-0 border-b border-[var(--border)]"
        >
          <div className="flex items-center overflow-hidden">
            {open && (
              <h2 className="text-2xl font-bold text-primary truncate">ERP</h2>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-2xl text-muted hover:text-primary transition shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {company && (
          <div
            style={{ backgroundColor: "#ffffff", backgroundImage: "none" }}
            className="px-4 py-3 border-b border-[var(--border)]"
          >
            <div
              className={`flex items-center gap-3 ${
                open ? "justify-start" : "justify-center"
              }`}
            >
              {/* Logo */}
              <div className="w-15 h-15 rounded-full border border-[var(--border)] flex items-center justify-center overflow-hidden">
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

              {/* Name */}
              {open && (
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-bold text-primary whitespace-normal break-words">
                    {company.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. MIDDLE - SCROLLABLE AREA */}
        <nav
          style={{ backgroundColor: "#ffffff", backgroundImage: "none" }}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 custom-scrollbar"
        >
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `nav-link group relative flex items-center h-11 rounded-xl transition-all duration-200 shrink-0 ${
                  isActive ? "active shadow-sm" : "hover:bg-row-hover"
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

              {/* Tooltip when collapsed */}
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
              className={`nav-link group relative flex items-center h-11 w-full rounded-xl transition-all shrink-0 ${
                settingsOpen || isSettingsRoute
                  ? "active"
                  : "hover:bg-row-hover"
              }`}
            >
              <div className="flex items-center justify-center min-w-[48px] shrink-0">
                <Settings className="w-5 h-5" />
              </div>

              <span
                className={`font-semibold text-sm nav-text whitespace-nowrap transition-opacity duration-200 flex-1 text-left ${open ? "opacity-100" : "opacity-0 invisible"}`}
              >
                Settings
              </span>

              {open && (
                <span className="mr-2 opacity-50 shrink-0">
                  {settingsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              )}
            </button>

            {open && settingsOpen && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-[var(--border)] pl-2">
                {[
                  {
                    to: "/companySetup",
                    label: "Company Setup",
                    icon: <Building2 className="w-4 h-4" />,
                  },
                  {
                    to: "/userManagement",
                    label: "User Management",
                    icon: <Users className="w-4 h-4" />,
                  },
                  {
                    to: "/settings",
                    label: "General Settings",
                    icon: <Settings className="w-4 h-4" />,
                  },
                ].map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted hover:bg-row-hover hover:text-primary"
                      }`
                    }
                  >
                    <span className="shrink-0">{sub.icon}</span>
                    <span className="whitespace-nowrap">{sub.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* 3. BOTTOM USER SECTION  */}
        <div
          style={{ backgroundColor: "#ffffff", backgroundImage: "none" }}
          className="p-4 border-t border-[var(--border)] shrink-0"
        >
          <div
            className={`flex items-center ${
              open ? "justify-between" : "flex-col gap-4"
            }`}
          >
            {/* LEFT SIDE: Avatar + Name */}
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

            {/* RIGHT SIDE: Logout Menu */}
            <button
              onClick={() => setLogoutOpen(true)}
              className="p-2 rounded-lg text-danger hover:bg-row-hover transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
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
