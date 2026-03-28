import React from "react";

const problems = [
  {
    title: "Payments scattered across Excel, WhatsApp, and Tally",
    desc: "Data spread across tools leads to confusion, delays, and operational risk.",
  },
  {
    title: "No clarity on who paid, who didn’t",
    desc: "You’re constantly guessing instead of knowing your cash flow.",
  },
  {
    title: "Manual entries causing costly mistakes",
    desc: "Small errors compound into major financial discrepancies.",
  },
  {
    title: "Inventory, sales, and accounting not connected",
    desc: "Disconnected systems force you to rely on outdated information.",
  },
  {
    title: "End-of-month reconciliation headaches",
    desc: "Hours wasted fixing mismatches instead of growing your business.",
  },
];

const ProblemSection: React.FC = () => {
  return (
    <section className="w-full bg-[#f8f6f3] py-24">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="max-w-3xl mx-auto text-center mb-20 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Running your business shouldn’t feel this chaotic
          </h2>

          <div className="w-20 h-[2px] bg-[#c58b45]/30 mx-auto mt-6 rounded-full" />
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT: CHAOS VISUAL */}
          <div className="relative h-[480px] flex items-center justify-center">
            
            {/* Background blur */}
            <div className="absolute w-[420px] h-[420px] bg-[#e9e3da] blur-3xl rounded-full opacity-50" />

            {/* Floating UI cards */}
            <div className="relative w-full h-full">

              <div className="absolute top-0 left-4 w-60 h-40 bg-white/70 backdrop-blur-md rounded-xl shadow-md rotate-[-6deg] opacity-70" />

              <div className="absolute bottom-10 left-0 w-52 h-28 bg-white/70 backdrop-blur-md rounded-xl shadow-md rotate-[8deg] opacity-70" />

              <div className="absolute top-16 right-0 w-64 h-36 bg-white/70 backdrop-blur-md rounded-xl shadow-md rotate-[10deg] opacity-60" />

              <div className="absolute bottom-0 right-10 w-44 h-24 bg-white/70 backdrop-blur-md rounded-xl shadow-md rotate-[-4deg] opacity-60" />

              {/* Center card (focus) */}
              <div className="absolute inset-0 m-auto w-72 h-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col justify-center items-center">
                <span className="text-red-500 text-sm font-medium">
                  ⚠ Data mismatch detected
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: PROBLEMS */}
          <div className="flex flex-col gap-6">
            {problems.map((item, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl border border-gray-200/60 hover:bg-white hover:shadow-md transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex gap-4">
                  
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-lg">
                    !
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM EMOTIONAL LINE */}
        <div className="mt-24 text-center animate-fade-in delay-200">
          <p className="text-lg md:text-xl text-gray-600 italic max-w-2xl mx-auto leading-relaxed">
            “You’re working hard — but your systems are working against you.”
          </p>
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          .animate-fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.6s ease forwards;
          }

          .delay-200 {
            animation-delay: 0.2s;
          }

          @keyframes fadeInUp {
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

export default ProblemSection;