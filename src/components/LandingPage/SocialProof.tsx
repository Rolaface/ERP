import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  ShoppingBag,
  Boxes,
  Wallet,
  Building2,
  UserCog,
  CreditCard,
  Settings,
} from "lucide-react";

const MODULES = [
  { name: "Dashboard", desc: "Real-time overview of sales, stock and cash flow", icon: LayoutDashboard },
  { name: "Sales", desc: "Create quotations, invoices and track orders end-to-end", icon: ShoppingCart },
  { name: "Customer", desc: "Manage customer details, history and outstanding dues", icon: Users },
  { name: "Procurement", desc: "Raise purchase orders and manage your suppliers", icon: ShoppingBag },
  { name: "Inventory", desc: "Track stock levels across multiple warehouses", icon: Boxes },
  { name: "Accounting", desc: "Automated ledgers, reconciliation and audit-ready books", icon: Wallet },
  { name: "Assets", desc: "Track company assets through their full lifecycle", icon: Building2 },
  { name: "Human Resource", desc: "Manage employees, payroll and attendance records", icon: UserCog },
  { name: "Expense Management", desc: "Track, approve and reconcile business expenses", icon: CreditCard },
  { name: "Settings", desc: "Configure roles, permissions and workspace preferences", icon: Settings },
];

const SocialProof: React.FC = () => {
  return (
    <section
      id="modules"
      className="section relative overflow-hidden border-y"
      style={{ borderColor: "rgba(200,218,240,0.50)" }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none"></div>

      <div className="container-app text-center stack-lg">

        {/* TOP TEXT */}
        <div className="max-w-2xl mx-auto stack-sm">
          <p
            className="text-[12px] font-semibold tracking-wide uppercase"
            style={{ color: "#2563eb" }}
          >
            One platform, every module
          </p>

          <h2
            className="text-[30px] md:text-[36px] font-semibold leading-snug"
            style={{ color: "#0f1f3d" }}
          >
            Everything your business runs on,
            <br className="hidden md:block" />
            connected in one place
          </h2>
        </div>

        {/* MODULE GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div
                key={i}
                className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  border: "1px solid rgba(200,218,240,0.60)",
                  boxShadow: "0 2px 10px rgba(100,140,200,0.06)",
                }}
              >
                {/* Tooltip — floats above the card, doesn't affect card height */}
                <div
                  className="pointer-events-none absolute left-1/2 bottom-full mb-3 -translate-x-1/2 translate-y-1 opacity-0 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 z-20"
                  role="tooltip"
                >
                  <div
                    className="w-44 rounded-lg px-3 py-2 text-[11px] font-medium leading-snug text-center shadow-lg"
                    style={{ background: "#0f1f3d", color: "#fff" }}
                  >
                    {mod.desc}
                  </div>
                  {/* Arrow */}
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 rotate-45"
                    style={{ background: "#0f1f3d" }}
                  />
                </div>

                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                  }}
                >
                  <Icon size={18} className="text-white" />
                </div>

                <span
                  className="text-[13px] font-medium leading-tight text-center"
                  style={{ color: "#0f1f3d" }}
                >
                  {mod.name}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default SocialProof;