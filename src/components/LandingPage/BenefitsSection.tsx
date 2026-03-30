import React from "react";
import {
  Wallet,
  Clock,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const benefits = [
  {
    title: "Complete financial clarity",
    desc: "Know exactly where your money is going with real-time visibility across every transaction.",
    icon: Wallet,
    span: "md:col-span-7",
    highlight: "Real-time audit trails",
  },
  {
    title: "Save hours every week",
    desc: "Automate repetitive work and eliminate reconciliation headaches.",
    icon: Clock,
    span: "md:col-span-5",
  },
  {
    title: "Reduce costly mistakes",
    desc: "Automation ensures accuracy and removes human error from your workflow.",
    icon: ShieldCheck,
    span: "md:col-span-4",
  },
  {
    title: "Make faster decisions",
    desc: "Use real-time insights instead of outdated reports to move with confidence.",
    icon: BarChart3,
    span: "md:col-span-4",
  },
  {
    title: "Scale without chaos",
    desc: "Grow your business without breaking processes or losing control.",
    icon: TrendingUp,
    span: "md:col-span-4",
  },
];

const BenefitsSection: React.FC = () => {
  return (
    <section className="section section-alt overflow-hidden">

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">

          <h2 className="text-[30px] md:text-[36px] font-semibold leading-snug text-main">
            What you actually{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              gain
            </span>
          </h2>

          <p className="text-body text-muted">
            Real improvements you’ll feel in your business every single day.
          </p>

        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--density-gap)] mt-[calc(var(--density-gap)*4)]">

          {benefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`${item.span} group bg-card border border-theme rounded-[calc(var(--density-radius)*1.5)] p-[calc(var(--density-gap)*2)] transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fade-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >

                {/* ICON */}
                <div className="w-10 h-10 rounded-[var(--density-radius)] bg-[rgba(0,0,0,0.03)] flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary/10">
                  <Icon size={18} className="text-primary" />
                </div>

                {/* CONTENT */}
                <h3 className="text-[18px] font-semibold text-main mb-2">
                  {item.title}
                </h3>

                <p className="text-[14px] text-muted leading-relaxed">
                  {item.desc}
                </p>

                {/* HIGHLIGHT */}
                {item.highlight && (
                  <div className="mt-5 flex items-center gap-2">
                    <CheckCircle size={14} className="text-success" />
                    <span className="text-[13px] font-medium text-main">
                      {item.highlight}
                    </span>
                  </div>
                )}

              </div>
            );
          })}

        </div>

        {/* BOTTOM LINE */}
        <div className="mt-[calc(var(--density-gap)*4)] text-center animate-fade-in">

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-full">

            <Sparkles size={14} className="text-primary" />

            <p className="text-[13px] text-muted">
              This isn’t just software — it’s operational clarity.
            </p>

          </div>

        </div>

      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          .animate-fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeIn 0.6s ease forwards;
          }

          .animate-fade-up {
            opacity: 0;
            transform: translateY(30px);
            animation: fadeUp 0.7s ease forwards;
          }

          @keyframes fadeIn {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </section>
  );
};

export default BenefitsSection;