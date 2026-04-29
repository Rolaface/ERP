import React, { useState, useEffect, useRef } from "react";
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
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(query.toLowerCase()) ||
      item.a.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.6;

      if (isVisible && active === null && filteredFaqs.length > 0) {
        setActive(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [active, filteredFaqs.length]);

  return (
    <section className="section section-alt relative overflow-hidden">

      {/* Background depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 pointer-events-none" />

      <div ref={containerRef} className="container-app max-w-3xl">

        {/* HEADER */}
        <div className="text-center stack-md animate-fade-in">

          <h2 className="text-[32px] md:text-[38px] font-semibold text-main leading-snug tracking-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              know before getting started
            </span>
          </h2>

          <p className="text-body text-muted max-w-lg mx-auto">
            Clear answers so you can make the right decision with confidence.
          </p>

        </div>

        {/* SEARCH */}
        <div className="mt-[calc(var(--density-gap)*3)] animate-fade-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-[var(--density-radius)]" />

            <input
              type="text"
              placeholder="Search your question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="relative w-full px-[calc(var(--density-gap)*1.8)] py-[calc(var(--density-gap)*1.5)] rounded-[calc(var(--density-radius)*1.2)] border border-theme bg-card text-[14px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
        </div>

        {/* FAQ LIST */}
        <div className="mt-[calc(var(--density-gap)*4)] divide-y divide-[rgba(0,0,0,0.06)]">

          {filteredFaqs.map((item, i) => {
            const isOpen = active === i;

            return (
              <div key={i} className="py-[calc(var(--density-gap)*1.8)]">

                {/* QUESTION */}
                <button
                  onClick={() => setActive(isOpen ? null : i)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 pr-4 flex-wrap">

                    <h3 className="text-[15px] font-medium text-main">
                      {item.q}
                    </h3>

                    {i < 2 && (
                      <span className="text-[10px] px-2 py-[2px] rounded-full bg-primary/10 text-primary font-medium">
                        Popular
                      </span>
                    )}

                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-primary flex-shrink-0"
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
                      transition={{
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1], // smoother cubic
                      }}
                      className="overflow-hidden"
                    >

                      {/* subtle divider when open */}
                      <div className="mt-4 border-t border-[rgba(0,0,0,0.06)] pt-4">

                        <p className="text-[14px] text-muted leading-relaxed max-w-[92%]">
                          {item.a}
                        </p>

                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}

          {/* Empty state */}
          {filteredFaqs.length === 0 && (
            <p className="text-center text-[13px] text-muted py-6">
              No results found. Try a different keyword.
            </p>
          )}

        </div>

        {/* BOTTOM */}
        <div className="text-center mt-[calc(var(--density-gap)*4.5)] animate-fade-in">

          <p className="text-[14px] text-muted">
            Still have questions?{" "}
            <span className="text-primary font-medium cursor-pointer hover:underline">
              Book a free demo
            </span>{" "}
            and we’ll guide you step-by-step.
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