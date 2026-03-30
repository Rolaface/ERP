import React from "react";
import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

const CTA: React.FC = () => {
  return (
    <section className="section bg-[#0b1220] text-white relative overflow-hidden">

      {/* Background Gradient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(96,165,250,0.15),transparent_70%)] blur-[120px]" />
      </div>

      <div className="container-app text-center relative z-10">

        {/* HEADLINE */}
        <div className="max-w-3xl mx-auto stack-md animate-fade-in">

          <h2 className="text-[32px] md:text-[42px] font-semibold leading-tight">
            Stop managing your business in{" "}
            <span className="text-red-400">chaos</span>. <br />
            Start running it with{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              clarity & control
            </span>
          </h2>

          <p className="text-[15px] text-gray-300 max-w-xl mx-auto">
            One system for payments, inventory, and accounting — built for speed, accuracy, and complete visibility.
          </p>

        </div>

        {/* CTA BUTTONS */}
        <div className="mt-[calc(var(--density-gap)*3)] flex flex-col items-center gap-4 animate-fade-up">

          {/* Primary CTA */}
          <button className="btn btn-primary text-[15px] px-[calc(var(--density-padding-lg)*1.5)] py-[var(--density-padding-md)] flex items-center gap-2 shadow-lg hover:shadow-xl">
            Book Your Free Demo
            <ArrowRight size={16} />
          </button>

          {/* Secondary CTA */}
          <button className="btn btn-ghost text-[13px] text-gray-300 hover:text-white">
            See how it works →
          </button>

        </div>

        {/* TRUST SIGNALS */}
        <div className="mt-[calc(var(--density-gap)*2)] flex flex-wrap justify-center gap-6 text-[12px] text-gray-400 animate-fade-in">

          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[var(--primary)]" />
            No credit card required
          </div>

          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[var(--primary)]" />
            Setup in minutes
          </div>

          <div className="flex items-center gap-2">
            <Users size={14} className="text-[var(--primary)]" />
            Trusted by 500+ businesses
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

export default CTA;