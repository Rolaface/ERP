import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-app text-muted overflow-hidden">

      {/* === BACKGROUND SYSTEM (TOKENIZED) === */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Radial glow (token) */}
        <div className="absolute inset-0 bg-radial-glow opacity-60 blur-3xl" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-grid-subtle" />

      </div>

      <div className="relative z-10 container-app px-6">

        {/* ================= CTA BLOCK ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-28 pb-20 text-center border-b border-theme"
        >
          <div className="relative max-w-3xl mx-auto">

            {/* Glow using token */}
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-3xl opacity-60" />

            <div className="relative">

              <h2 className="text-3xl md:text-4xl font-semibold text-main leading-tight tracking-tight">
                Bring clarity to your{" "}
                <span className="text-gradient">
                  business operations
                </span>
              </h2>

              <p className="mt-5 text-muted max-w-xl mx-auto text-[15px] leading-relaxed">
                Join 500+ businesses simplifying operations, reducing errors, and scaling faster.
              </p>

              {/* CTA */}
              <button className="mt-8 btn btn-primary group relative inline-flex items-center gap-3 px-8 py-4 rounded-full overflow-hidden">

                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                Book Free Demo

                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition" />
              </button>

              <p className="mt-3 text-[12px] text-muted">
                No credit card required • Setup in minutes
              </p>

            </div>
          </div>
        </motion.div>

        {/* ================= MAIN GRID ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-5 gap-14 pt-20 pb-20"
        >

          {/* BRAND */}
          <div className="col-span-2 md:col-span-1">

            <h2 className="text-2xl font-semibold tracking-tight text-gradient">
              Archivist ERP
            </h2>

            <p className="mt-4 text-muted text-sm leading-relaxed max-w-[240px]">
              Built for modern businesses that want clarity, control, and growth.
            </p>

            {/* Badges */}
            <div className="mt-6 flex items-center gap-2 text-[11px] text-muted">
              <span className="px-2 py-1 border border-theme rounded-full bg-card/50">
                Secure
              </span>
              <span className="px-2 py-1 border border-theme rounded-full bg-card/50">
                Reliable
              </span>
            </div>

          </div>

          {/* LINK GROUP */}
          {[
            { title: "Product", items: ["Features", "Pricing", "Book Demo"] },
            { title: "Company", items: ["About", "Contact"] },
            { title: "Legal", items: ["Privacy Policy", "Terms"] },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-main font-semibold mb-5 text-[14px] tracking-wide">
                {group.title}
              </h4>

              <ul className="space-y-3 text-sm">
                {group.items.map((item) => (
                  <li key={item}>
                    <a className="group inline-block relative text-muted hover:text-main transition">
                      {item}
                      <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CONTACT */}
          <div>
            <h4 className="text-main font-semibold mb-5 text-[14px] tracking-wide">
              Contact
            </h4>

            <div className="space-y-4 text-sm">

              <div className="flex items-center gap-3 group cursor-pointer">
                <Mail className="w-4 h-4 text-muted group-hover:text-primary transition" />
                <span className="text-muted group-hover:text-main transition">
                  hello@archivist.com
                </span>
              </div>

              <div className="flex items-center gap-3 group cursor-pointer">
                <Phone className="w-4 h-4 text-muted group-hover:text-primary transition" />
                <span className="text-muted group-hover:text-main transition">
                  +91 98765 43210
                </span>
              </div>

            </div>
          </div>

        </motion.div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="border-t border-theme pt-8 pb-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">

          <p>© 2026 Archivist ERP. All rights reserved.</p>

          <div className="flex items-center gap-6 flex-wrap justify-center">

            <span className="hidden md:block text-muted">
              Secure. Reliable. Built for scale.
            </span>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span>All systems operational</span>
            </div>

            <span className="hidden md:block text-muted">
              99.9% uptime
            </span>

          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;