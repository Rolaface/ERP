import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#0b0b0c] text-gray-400 overflow-hidden">

      {/* === BACKGROUND ENHANCEMENT === */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Main Glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,rgba(197,139,69,0.15),transparent_70%)] blur-[120px]" />

        {/* Bottom Glow */}
        <div className="absolute bottom-[-30%] right-[10%] w-[500px] h-[300px] bg-[radial-gradient(circle,rgba(197,139,69,0.12),transparent_70%)] blur-[100px]" />

        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:50px_50px]" />

      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* =========================
            PRE-FOOTER CTA (UPGRADED)
        ========================== */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-24 pb-16 text-center border-b border-white/10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
            Bring clarity to your{" "}
            <span className="bg-gradient-to-r from-[#fbbf24] to-[#c58b45] bg-clip-text text-transparent">
              business operations
            </span>
          </h2>

          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Join 500+ businesses already simplifying operations, reducing errors, and scaling faster.
          </p>

          {/* CTA */}
          <button className="mt-8 group relative inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">

            {/* Glow */}
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            Book Free Demo

            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition" />
          </button>

          {/* Micro trust */}
          <p className="mt-3 text-[12px] text-gray-500">
            No credit card required • Setup in minutes
          </p>

        </motion.div>

        {/* =========================
            MAIN FOOTER GRID
        ========================== */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-5 gap-12 pt-16 pb-16"
        >

          {/* BRAND */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#fbbf24] to-[#c58b45] bg-clip-text text-transparent">
              Archivist ERP
            </h2>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed max-w-[240px]">
              Built for modern businesses that want clarity, control, and growth.
            </p>

            {/* Trust badges */}
            <div className="mt-6 flex items-center gap-2 text-[11px] text-gray-500">
              <span className="px-2 py-1 border border-white/10 rounded-full">
                Secure
              </span>
              <span className="px-2 py-1 border border-white/10 rounded-full">
                Reliable
              </span>
            </div>

          </div>

          {/* PRODUCT */}
          <div>
            <h4 className="text-white font-semibold mb-5">Product</h4>
            <ul className="space-y-3 text-sm">
              {["Features", "Pricing", "Book Demo"].map((item) => (
                <li key={item}>
                  <a className="group inline-block relative hover:text-white transition">
                    {item}
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="text-white font-semibold mb-5">Company</h4>
            <ul className="space-y-3 text-sm">
              {["About", "Contact"].map((item) => (
                <li key={item}>
                  <a className="group inline-block relative hover:text-white transition">
                    {item}
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h4 className="text-white font-semibold mb-5">Legal</h4>
            <ul className="space-y-3 text-sm">
              {["Privacy Policy", "Terms"].map((item) => (
                <li key={item}>
                  <a className="group inline-block relative hover:text-white transition">
                    {item}
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="text-white font-semibold mb-5">Contact</h4>

            <div className="space-y-4 text-sm">

              <div className="flex items-center gap-3 group cursor-pointer">
                <Mail className="w-4 h-4 text-gray-500 group-hover:text-primary transition" />
                <span className="group-hover:text-white transition">
                  hello@archivist.com
                </span>
              </div>

              <div className="flex items-center gap-3 group cursor-pointer">
                <Phone className="w-4 h-4 text-gray-500 group-hover:text-primary transition" />
                <span className="group-hover:text-white transition">
                  +91 98765 43210
                </span>
              </div>

            </div>
          </div>

        </motion.div>

        {/* =========================
            BOTTOM BAR (UPGRADED)
        ========================== */}
        <div className="border-t border-white/10 pt-6 pb-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">

          <p>© 2026 Archivist ERP. All rights reserved.</p>

          <div className="flex items-center gap-6 flex-wrap justify-center">

            <span className="hidden md:block">
              Secure. Reliable. Built for scale.
            </span>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>All systems operational</span>
            </div>

            {/* Extra trust */}
            <span className="hidden md:block">
              99.9% uptime
            </span>

          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;