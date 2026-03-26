import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  BarChart3,
  Users,
  Truck,
  UserCog,
  Zap,
  Eye,
  Clock,
} from "lucide-react";

// ================= TYPES =================
type ContainerProps = {
  className?: string;
  children: React.ReactNode;
};

// ================= CONTAINER =================
const Container: React.FC<ContainerProps> = ({
  className = "",
  children,
}) => (
  <div className={`max-w-6xl mx-auto px-6 ${className}`}>{children}</div>
);

// ================= NAVBAR =================
const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <Container className="h-16 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">ERP</div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
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
    <section className="bg-[#F9FAFB] pt-28 pb-24 text-center">
      <Container>
        <p className="text-xs tracking-widest text-indigo-600 font-medium uppercase">
          Simple ERP for Modern Businesses
        </p>

        <h1 className="mt-4 text-4xl md:text-[48px] leading-tight font-semibold text-gray-900 max-w-3xl mx-auto">
          Run Your Entire Business from One Simple Dashboard
        </h1>

        <p className="mt-4 text-[15px] text-gray-600 max-w-xl mx-auto">
          Manage accounting, sales, HR, and operations in one place — without
          juggling multiple tools.
        </p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => navigate("/signup")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-medium shadow"
          >
            Create Your Free Account
          </button>

          <button className="text-sm text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            Watch Demo
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          No credit card required • Setup in under 60 seconds
        </p>

        <div className="mt-16">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl">
            <img
              src="/dashboard.png"
              className="w-full h-auto"
              alt="ERP dashboard preview"
            />
          </div>
        </div>
      </Container>
    </section>
  );
};

// ================= PROBLEM =================
const ProblemSection: React.FC = () => (
  <section className="bg-[#F3F4F6] py-24">
    <Container className="grid md:grid-cols-2 gap-16 items-center">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 leading-snug">
          Running Your Business Shouldn't Feel Chaotic
        </h2>

        <p className="mt-4 text-sm text-gray-600">
          Most growing companies are held back by fragmented tools. When your
          data lives in different places, you lose time, clarity, and control.
        </p>

        <ul className="mt-6 space-y-3 text-sm text-gray-700">
          {[
            "Data scattered across tools",
            "No real-time financial visibility",
            "Manual work and repeated errors",
            "No single source of truth",
          ].map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-red-500 mt-[2px]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-6 justify-center">
        <div className="bg-white rounded-2xl shadow-md p-6 w-32 text-center">
          <p className="text-red-500 text-xl font-bold">60%</p>
          <p className="text-xs text-gray-500 mt-1">Time wasted</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 w-32 text-center">
          <p className="text-indigo-600 text-xl font-bold">0%</p>
          <p className="text-xs text-gray-500 mt-1">Data sync</p>
        </div>
      </div>
    </Container>
  </section>
);

// ================= FEATURES =================
type Feature = {
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: "Accounting",
    desc: "Track income, expenses, and cash flow in real time.",
    icon: <BarChart3 className="w-4 h-4 text-indigo-600" />,
  },
  {
    title: "Sales & CRM",
    desc: "Manage leads, customers, and payments in one flow.",
    icon: <Users className="w-4 h-4 text-indigo-600" />,
  },
  {
    title: "Supplier Management",
    desc: "Handle vendors and purchases efficiently.",
    icon: <Truck className="w-4 h-4 text-indigo-600" />,
  },
  {
    title: "HRMS",
    desc: "Employees, payroll, and attendance in one place.",
    icon: <UserCog className="w-4 h-4 text-indigo-600" />,
  },
];

const Features: React.FC = () => (
  <section className="py-24 bg-white text-center">
    <Container>
      <h2 className="text-2xl font-semibold text-gray-900">
        Everything You Need to Scale
      </h2>
      <p className="text-sm text-gray-500 mt-2">
        One integrated platform to replace five different subscriptions.
      </p>

      <div className="mt-12 grid md:grid-cols-2 gap-6">
        {features.map((f: Feature, i: number) => (
          <div
            key={i}
            className="bg-[#F9FAFB] border border-gray-200 rounded-2xl p-6 text-left hover:shadow-md transition"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-lg mb-3 flex items-center justify-center">
              {f.icon}
            </div>
            <h3 className="font-medium text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

// ================= STEPS =================
type Step = {
  title: string;
};

const steps: Step[] = [
  { title: "Create account" },
  { title: "Log in" },
  { title: "Start managing" },
];

const Steps: React.FC = () => (
  <section className="bg-[#F3F4F6] py-20 text-center">
    <Container className="grid md:grid-cols-3 gap-12">
      {steps.map((s: Step, i: number) => (
        <div key={i}>
          <div className="w-10 h-10 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
            0{i + 1}
          </div>
          <p className="mt-4 text-sm text-gray-700">{s.title}</p>
        </div>
      ))}
    </Container>
  </section>
);

// ================= DIFFERENTIATION =================
const Differentiation: React.FC = () => (
  <section className="py-24 bg-white">
    <Container>
      <div className="bg-[#111827] text-white rounded-2xl p-10 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <h3 className="text-xl font-semibold">
            Built for Real Business Workflows
          </h3>

          <ul className="mt-6 space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              No unnecessary complexity
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              Designed for everyday business use
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              Scalable architecture that grows with you
            </li>
          </ul>
        </div>

        <div className="bg-[#1F2937] rounded-xl p-6 max-w-xs">
          <p className="text-sm text-gray-300">
            “Finally an ERP that doesn't require a PhD to operate. My workflow
            has become smoother and I'm 40% more efficient.”
          </p>

          <div className="mt-4 text-xs text-gray-400">
            — Product Manager
          </div>
        </div>
      </div>
    </Container>
  </section>
);

// ================= METRICS =================
const Metrics: React.FC = () => (
  <section className="py-16 text-center bg-white">
    <Container className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
      {[
        { label: "Faster onboarding", icon: <Zap className="w-4 h-4" /> },
        { label: "Easy to use", icon: <Users className="w-4 h-4" /> },
        { label: "Minimal training", icon: <Clock className="w-4 h-4" /> },
        { label: "Clear visibility", icon: <Eye className="w-4 h-4" /> },
      ].map((item, i: number) => (
        <div key={i}>
          <div className="w-6 h-6 mx-auto bg-indigo-100 rounded flex items-center justify-center mb-2 text-indigo-600">
            {item.icon}
          </div>
          <p className="text-gray-600">{item.label}</p>
        </div>
      ))}
    </Container>
  </section>
);

// ================= CTA =================
const CTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-[#F9FAFB] py-24 text-center">
      <Container>
        <h2 className="text-2xl font-semibold text-gray-900">
          Start Managing Your Business Smarter Today
        </h2>

        <div className="mt-6">
          <button
            onClick={() => navigate("/signup")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-medium shadow"
          >
            Create Your Free Account
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-500">
          It takes less than a minute to get started
        </p>
      </Container>
    </section>
  );
};

// ================= FOOTER =================
const Footer: React.FC = () => (
  <footer className="bg-white py-16 text-sm text-gray-500 border-t">
    <Container className="grid md:grid-cols-4 gap-10">
      <div>
        <p className="font-semibold text-gray-900">ERP</p>
        <p className="mt-2 text-xs">
          A modern system to manage your entire business.
        </p>
      </div>

      {["Product", "Company", "Legal", "Support"].map(
        (col: string, i: number) => (
          <div key={i}>
            <p className="text-gray-900 font-medium mb-2">{col}</p>
            <div className="space-y-1 text-xs">
              <p>Overview</p>
              <p>Pricing</p>
              <p>Docs</p>
            </div>
          </div>
        )
      )}
    </Container>

    <div className="text-center mt-10 text-xs text-gray-400">
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
      <ProblemSection />
      <Features />
      <Steps />
      <Differentiation />
      <Metrics />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;