import React from "react";
import { useNavigate } from "react-router-dom";

// Tailwind base expectations:
// - Font: Inter (include via index.html or @import)
// - Colors tuned to match screenshot (indigo + cool grays)

const Container: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
    <div className={`max-w-6xl mx-auto px-6 ${className}`}>{children}</div>
);

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full bg-[#F3F4F6] sticky top-0 z-50">
            <Container className="h-16 flex items-center justify-between">
                <div className="text-base font-medium text-gray-800">ERP</div>
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate("/login")} className="text-sm text-gray-600 hover:text-gray-900">
                        Login
                    </button>
                    <button
                        onClick={() => navigate("/signup")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
                    >
                        Create Your Free Account
                    </button>
                </div>
            </Container>
        </div>
    );
};

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="bg-[#F3F4F6] pt-24 pb-16 text-center">
            <Container>
                <h1 className="text-4xl md:text-[44px] leading-tight font-semibold text-gray-900">
                    Manage Your Entire
                    <br />
                    Business in One Simple ERP
                </h1>

                <p className="mt-4 text-[15px] text-gray-600 max-w-2xl mx-auto">
                    Accounting, Sales, HRMS, Suppliers & Customers — all in one place so you can
                    stop switching tools and start focusing on growth.
                </p>

                <div className="mt-6">
                    <button
                        onClick={() => navigate("/signup")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-medium shadow"
                    >
                        Create Your Free Account
                    </button>
                </div>

                <p className="mt-3 text-[11px] tracking-wide text-gray-500 uppercase">
                    No credit card required • Takes less than 60 seconds
                </p>

                <div className="mt-14">
                    <div className="mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                        <img
                            src="https://unsplash.com/photos/turned-on-monitoring-screen-qwtCeJ5cLYs"
                            className="w-full object-cover"
                            alt="dashboard"
                        />
                    </div>
                </div>
            </Container>
        </section>
    );
};

const ProblemSection = () => (
    <section className="bg-[#EDEFF3] py-24">
        <Container className="grid md:grid-cols-2 gap-16 items-center">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">
                    Running a Business Shouldn’t Feel Messy
                </h2>
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                    Traditional software fragments your data. You’re wasting time manually
                    syncing spreadsheets and chasing down updates across teams.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                    {[
                        "Data scattered across multiple platforms",
                        "Zero real-time visibility into cash flow",
                        "Endless manual data entry work",
                        "No single source of truth for the team",
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500">✖</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex justify-center">
                <div className="bg-white p-5 rounded-2xl shadow-md rotate-3">
                    <img
                        src="https://unsplash.com/photos/part-of-workplace-of-modern-fbi-agent-with-documents-evidences-calculator-and-telephone-on-desk-lit-by-lamp-in-small-office-Yga3Fvcsf5I"
                        alt="messy docs"
                    />
                </div>
            </div>
        </Container>
    </section>
);

const features = [
    {
        title: "Accounting",
        desc: "Track income, expenses, and real-time cash flow with automated reconciliation.",
    },
    {
        title: "Sales & Customers",
        desc: "Manage leads to payments effortlessly. Keep customer history, invoices, and follow-ups in one timeline.",
    },
    {
        title: "Suppliers",
        desc: "Manage vendors, purchase orders, and inventory levels. Know exactly what’s in stock and what’s on order.",
    },
    {
        title: "HRMS",
        desc: "Streamline employees data, payroll processing, and attendance tracking without the administrative headache.",
    },
];

const Features = () => (
    <section className="py-24 bg-[#F7F7F9]">
        <Container className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 mb-3" />
                    <h3 className="font-medium text-gray-900">{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
            ))}
        </Container>
    </section>
);

const Steps = () => (
    <section className="bg-[#F3F4F6] py-20">
        <Container className="grid md:grid-cols-3 gap-10">
            {[
                { t: "Create Account", d: "Sign up with your email in less than 60 seconds." },
                { t: "Log In Instantly", d: "Access your secure, private workspace from any browser." },
                { t: "Start Managing", d: "Import your data and take control of your operations." },
            ].map((s, i) => (
                <div key={i} className="relative">
                    <div className="text-[64px] font-semibold text-indigo-100 absolute -top-6">
                        0{i + 1}
                    </div>
                    <div className="relative">
                        <h4 className="font-medium text-gray-900">{s.t}</h4>
                        <p className="text-sm text-gray-600 mt-1">{s.d}</p>
                    </div>
                </div>
            ))}
        </Container>
    </section>
);

const Differentiation = () => (
    <section className="py-20 bg-white">
        <Container>
            <div className="bg-[#F7F7F9] p-8 rounded-2xl">
                <h3 className="text-lg font-semibold text-gray-900">
                    Built for Real Business Operations
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                    We stripped away the enterprise bloat. No hidden menus, no complex scripting, just the tools you need to run your business daily.
                </p>
            </div>
        </Container>
    </section>
);

const Metrics = () => (
    <section className="py-12 text-center bg-white">
        <Container className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            {[
                ["0.5d", "Faster onboarding"],
                ["Easy", "Simple to use"],
                ["-80%", "Less training required"],
                ["100%", "Better visibility"],
            ].map(([v, l], i) => (
                <div key={i}>
                    <div className="text-indigo-600 font-semibold">{v}</div>
                    <div className="text-gray-600">{l}</div>
                </div>
            ))}
        </Container>
    </section>
);

const CTA = () => {
    const navigate = useNavigate();

    return (
        <section className="bg-[#F3F4F6] py-20 text-center">
            <Container>
                <h2 className="text-xl font-semibold text-gray-900">
                    Start Running Your Business Smarter Today
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

const Footer = () => (
    <footer className="bg-[#F3F4F6] py-10 text-xs text-gray-500">
        <Container className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>ERP </div>
            <div>© 2026 ERP All rights reserved.
            </div>
            <div className="flex gap-6">
                {["Privacy Policy", "Terms of Service", "Security", "Status"].map((l, i) => (
                    <span key={i}>{l}</span>
                ))}
            </div>

        </Container>

    </footer>
);

export default function LandingPage() {
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
}