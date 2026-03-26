import React from "react";
import { BarChart3, Users, Truck, UserCog, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ================= TYPES =================
type ContainerProps = {
  className?: string;
  children: React.ReactNode;
};

// ================= CONTAINER =================
const Container: React.FC<ContainerProps> = ({ className = "", children }) => (
  <div className={`max-w-1xl mx-auto px-20 ${className}`}>{children}</div>
);

// ================= NAVBAR =================
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-[#faf9f6] border-b border-[#ede9e0] sticky top-0 z-50">
      <Container className="h-16 flex items-center justify-between">
        <div className="text-lg font-bold text-gray-900 tracking-tight">ERP</div>
        <div className="flex items-center gap-6">
          <button className="text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
          onClick={() => navigate("/login")}>
            Login
          </button>
          <button
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: "#c0843d" }}
            onClick={() => navigate("/signup")}
          >
            Create Free Account
          </button>
        </div>
      </Container>
    </div>
  );
};

// ================= HERO =================
const Hero: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-[#faf9f6] pt-1 pb-0">
      <Container>
        <div className="grid md:grid-cols-2 gap-10 items-center py-8">
          {/* Left */}
          <div>
            <span
              className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5 tracking-wide"
              style={{ backgroundColor: "#f5ebe0", color: "#c0843d" }}
            >
              Simple ERP for Modern Businesses
            </span>
            <h1 className="text-[36px] font-bold leading-tight tracking-tight text-gray-900 mb-4">
              Manage your whole business,{" "}
              <span style={{ color: "#c0843d" }}>simply</span>
            </h1>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-7 max-w-sm">
              One dashboard for accounting, HR, sales and suppliers. No
              complexity, no chaos.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 mb-3">
              <button
                className="text-sm font-semibold text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                style={{ backgroundColor: "#c0843d" }}
                onClick={() => navigate("/signup")}
              >
                Get started free
              </button>
              <button className="text-sm text-gray-600 px-5 py-2.5 rounded-lg border border-[#d0ccc4] hover:bg-[#f5ede2] transition-colors bg-transparent font-medium">
                See demo
              </button>
            </div>
            {/* <p className="text-xs text-gray-400">
              No credit card required · Setup in under 60 seconds
            </p> */}
          </div>

          {/* Right — Dashboard Preview */}
          <div
            className="rounded-2xl overflow-hidden border border-[#e0d6c8] p-0"
            style={{ backgroundColor: "#f5ebe0" }}
          >
            {/* Mock Dashboard UI */}
            <div className="bg-white rounded-xl shadow-sm p-0 space-y-3">
              {/* Top bar */}
              {/* <div className="flex items-center justify-between mb-2">
                <div className="h-2.5 w-20 rounded bg-gray-100" />
                <div className="flex gap-1.5">
                  <div className="h-2 w-8 rounded bg-[#f5ebe0]" />
                  <div className="h-2 w-8 rounded bg-[#f5ebe0]" />
                </div>
              </div> */}
              {/* Stat cards */}
              <div className="grid grid-cols-1 gap-2">
                 <img
                src="/dashboard.png"
                className="w-full h-auto"
                alt="ERP dashboard preview"
              />
              </div>
              {/* Bar chart mock */}
              {/* <div className="flex items-end gap-1.5 h-16 pt-2 px-1">
                {[60, 40, 75, 55, 85, 45, 70, 50, 90, 35, 65, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      backgroundColor: i % 3 === 0 ? "#c0843d" : "#ede9e0",
                    }}
                  />
                ))}
              </div> */}
              {/* Table rows mock */}
              {/* <div className="space-y-1.5 pt-1">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#c0843d" }} />
                    <div className="h-1.5 flex-1 rounded bg-gray-100" />
                    <div className="h-1.5 w-10 rounded bg-gray-100" />
                  </div>
                ))}
              </div> */}
              {/* Label */}
              {/* <p className="text-center text-[10px] text-gray-400 pt-1 font-medium">dashboard.png</p> */}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

// ================= FEATURES =================
type Feature = {
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: "Accounting",
    desc: "Income, expenses and cash flow in real time.",
    icon: <BarChart3 className="w-4 h-4" style={{ color: "#c0843d" }} />,
  },
  {
    title: "Sales & CRM",
    desc: "Leads, customers and payments in one flow.",
    icon: <Users className="w-4 h-4" style={{ color: "#c0843d" }} />,
  },
  {
    title: "Suppliers",
    desc: "Vendors and purchases simplified.",
    icon: <Truck className="w-4 h-4" style={{ color: "#c0843d" }} />,
  },
  {
    title: "HRMS",
    desc: "Payroll, leave and attendance.",
    icon: <UserCog className="w-4 h-4" style={{ color: "#c0843d" }} />,
  },
];

const Features: React.FC = () => (
  <section className="bg-[#faf9f6] border-t border-[#ede9e0] py-5">
    <Container>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#ede9e0] border border-[#ede9e0] rounded-xl overflow-hidden">
        {features.map((f, i) => (
          <div key={i} className="bg-[#faf9f6] p-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: "#f5ebe0" }}
            >
              {f.icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
              {f.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

// ================= STEPS =================
const Steps: React.FC = () => (
  <section className="bg-[#faf9f6] border-t border-[#ede9e0] py-6">
    <Container>
      <div className="grid md:grid-cols-3 gap-px bg-[#ede9e0] border border-[#ede9e0] rounded-xl overflow-hidden">
        {[
          { num: "01", title: "Create account", desc: "Free, no card needed" },
          { num: "02", title: "Log in", desc: "Ready in 60 seconds" },
          { num: "03", title: "Start managing", desc: "Everything in one place" },
        ].map((s, i) => (
          <div key={i} className="bg-[#faf9f6] py-10 text-center px-8">
            <div
              className="text-3xl font-bold mb-3"
              style={{ color: "#c0843d" }}
            >
              {s.num}
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
              {s.title}
            </h4>
            {/* <p className="text-xs text-gray-400">{s.desc}</p> */}
          </div>
        ))}
      </div>
    </Container>
  </section>
);

// ================= CTA =================
const CTA: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-[#1a1a1a] py-16 text-center">
      <Container>
        <h2 className="text-2xl font-bold text-white mb-6">
          Start managing your business smarter today
        </h2>
        <button
          className="text-sm font-semibold text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-md"
          style={{ backgroundColor: "#c0843d" }}
          onClick={() => navigate("/signup")}
        >
          Create Your Free Account
        </button>
        {/* <p className="mt-3 text-xs text-gray-500">
          No credit card required · Setup in under 60 seconds
        </p> */}
      </Container>
    </section>
  );
};

// ================= FOOTER =================
const Footer: React.FC = () => (
  <footer className="bg-[#faf9f6] border-t border-[#ede9e0] py-14 text-sm text-gray-400">
    <Container className="grid md:grid-cols-4 gap-10">
      <div>
        <p className="font-bold text-gray-900 mb-2">ERP</p>
        <p className="text-xs leading-relaxed">
          A modern system to manage your entire business.
        </p>
      </div>
      {["Product", "Company", "Legal", "Support"].map((col, i) => (
        <div key={i}>
          <p className="text-gray-700 font-semibold mb-3">{col}</p>
          <div className="space-y-2 text-xs">
            <p className="hover:text-gray-600 cursor-pointer">Overview</p>
            <p className="hover:text-gray-600 cursor-pointer">Pricing</p>
            <p className="hover:text-gray-600 cursor-pointer">Docs</p>
          </div>
        </div>
      ))}
    </Container>
    <div className="text-center mt-10 text-xs text-gray-300">
      © 2024 ERP. All rights reserved.
    </div>
  </footer>
);

// ================= MAIN =================
const LandingPage: React.FC = () => {
  return (
    <div className="font-sans text-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <Steps />
      <CTA />
      {/* <Footer /> */}
    </div>
  );
};

export default LandingPage;