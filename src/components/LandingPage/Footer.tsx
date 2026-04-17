import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#0b0b0c] text-gray-400 overflow-hidden">

      {/* === BACKGROUND ENHANCED === */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Top glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(circle,rgba(197,139,69,0.18),transparent_70%)] blur-[140px]" />

        {/* Bottom glow */}
        <div className="absolute bottom-[-30%] right-[10%] w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(197,139,69,0.12),transparent_70%)] blur-[120px]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-grid-subtle" />

      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ================= CTA BLOCK ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-28 pb-20 text-center border-b border-white/10"
        >

          {/* Wrapper for depth */}
          <div className="relative max-w-3xl mx-auto">

            {/* Glow */}
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-3xl opacity-60" />

            <div className="relative">

              <h2 className="text-3xl md:text-4xl font-semibold text-white leading-tight tracking-tight">
                Bring clarity to your{" "}
                <span className="bg-gradient-to-r from-[#fbbf24] to-[#c58b45] bg-clip-text text-transparent">
                  business operations
                </span>
              </h2>

              <p className="mt-5 text-gray-400 max-w-xl mx-auto text-[15px] leading-relaxed">
                Join 500+ businesses simplifying operations, reducing errors, and scaling faster.
              </p>

              {/* CTA */}
              <button className="mt-8 group relative inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">

                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                Book Free Demo

                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition" />
              </button>

              <p className="mt-3 text-[12px] text-gray-500">
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

            <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-[#fbbf24] to-[#c58b45] bg-clip-text text-transparent">
              Archivist ERP
            </h2>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed max-w-[240px]">
              Built for modern businesses that want clarity, control, and growth.
            </p>

            {/* Badges */}
            <div className="mt-6 flex items-center gap-2 text-[11px] text-gray-500">
              <span className="px-2 py-1 border border-white/10 rounded-full bg-white/5">
                Secure
              </span>
              <span className="px-2 py-1 border border-white/10 rounded-full bg-white/5">
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
              <h4 className="text-white font-semibold mb-5 text-[14px] tracking-wide">
                {group.title}
              </h4>

              <ul className="space-y-3 text-sm">
                {group.items.map((item) => (
                  <li key={item}>
                    <a className="group inline-block relative text-gray-500 hover:text-white transition">
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
            <h4 className="text-white font-semibold mb-5 text-[14px] tracking-wide">
              Contact
            </h4>

            <div className="space-y-4 text-sm">

              <div className="flex items-center gap-3 group cursor-pointer">
                <Mail className="w-4 h-4 text-gray-500 group-hover:text-primary transition" />
                <span className="text-gray-500 group-hover:text-white transition">
                  hello@archivist.com
                </span>
              </div>

              <div className="flex items-center gap-3 group cursor-pointer">
                <Phone className="w-4 h-4 text-gray-500 group-hover:text-primary transition" />
                <span className="text-gray-500 group-hover:text-white transition">
                  +91 98765 43210
                </span>
              </div>

            </div>
          </div>

        </motion.div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="border-t border-white/10 pt-8 pb-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">

          <p>© 2026 Archivist ERP. All rights reserved.</p>

          <div className="flex items-center gap-6 flex-wrap justify-center">

            <span className="hidden md:block text-gray-600">
              Secure. Reliable. Built for scale.
            </span>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>All systems operational</span>
            </div>

            <span className="hidden md:block text-gray-600">
              99.9% uptime
            </span>

          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;