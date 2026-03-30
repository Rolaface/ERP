import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "How is this different from Tally or traditional software?",
    a: "Tally focuses only on accounting. This system connects your payments, inventory, sales, and accounting in one place — so you don’t have to switch tools or reconcile manually.",
  },
  {
    q: "Will my team be able to use it without training?",
    a: "Yes. It’s built for non-technical teams. Most businesses get comfortable within a day because the interface is simple and intuitive.",
  },
  {
    q: "Can I track both customer and supplier payments?",
    a: "Absolutely. You get full visibility into receivables and payables, with real-time tracking and zero confusion about who paid and who hasn’t.",
  },
  {
    q: "Do you help with setup and data migration?",
    a: "Yes. We assist you with onboarding, data setup, and migration so you can start smoothly without disruption.",
  },
  {
    q: "Is my business data secure?",
    a: "Yes. Your data is encrypted, securely stored, and automatically backed up — ensuring complete safety and reliability.",
  },
];

const FAQ: React.FC = () => {
  const [active, setActive] = useState<number | null>(0);

  return (
    <section className="section section-alt">

      <div className="container-app max-w-3xl">

        {/* HEADER */}
        <div className="text-center stack-md animate-fade-in">

          <h2 className="text-[30px] md:text-[36px] font-semibold text-main leading-snug">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              know before getting started
            </span>
          </h2>

          <p className="text-body text-muted">
            Clear answers to help you make the right decision.
          </p>

        </div>

        {/* FAQ LIST */}
        <div className="mt-[calc(var(--density-gap)*3)] space-y-[var(--density-gap)]">

          {faqs.map((item, i) => {
            const isOpen = active === i;

            return (
              <div
                key={i}
                className="bg-card border border-theme rounded-[calc(var(--density-radius)*1.5)] transition-all duration-300 hover:shadow-sm"
              >

                {/* QUESTION */}
                <button
                  onClick={() => setActive(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-[calc(var(--density-gap)*1.5)] text-left"
                >
                  <h3 className="text-[15px] font-medium text-main pr-4">
                    {item.q}
                  </h3>

                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-[var(--primary)] flex-shrink-0"
                  >
                    <Plus size={18} />
                  </motion.div>
                </button>

                {/* ANSWER */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-[calc(var(--density-gap)*1.5)] pb-[calc(var(--density-gap)*1.5)] text-[14px] text-muted leading-relaxed max-w-[90%]">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}

        </div>

        {/* BOTTOM CONVERSION HINT */}
        <div className="text-center mt-[calc(var(--density-gap)*3)] animate-fade-in">
          <p className="text-[13px] text-muted">
            Still have questions?{" "}
            <span className="text-primary font-medium cursor-pointer">
              Book a free demo
            </span>{" "}
            and we’ll walk you through everything.
          </p>
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

          @keyframes fadeIn {
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

export default FAQ;