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
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Sales", icon: ShoppingCart },
  { name: "Customer", icon: Users },
  { name: "Procurement", icon: ShoppingBag },
  { name: "Inventory", icon: Boxes },
  { name: "Accounting", icon: Wallet },
  { name: "Assets", icon: Building2 },
  { name: "Human Resource", icon: UserCog },
  { name: "Expense Management", icon: CreditCard },
  { name: "Settings", icon: Settings },
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
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  border: "1px solid rgba(200,218,240,0.60)",
                  boxShadow: "0 2px 10px rgba(100,140,200,0.06)",
                }}
              >
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