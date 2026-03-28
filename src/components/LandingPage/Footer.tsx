import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#0b0b0c] text-gray-400 overflow-hidden">

      {/* === Background Glow === */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(circle,rgba(197,139,69,0.12),transparent_70%)] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-14">

        {/* === MAIN GRID === */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16"
        >

          {/* === COLUMN 1: BRAND === */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-white text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              Archivist ERP
            </h2>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed max-w-[220px]">
              Built for modern pharmaceutical businesses.
            </p>

            {/* subtle glow line */}
            <div className="mt-6 h-[1px] w-16 bg-gradient-to-r from-amber-500/40 to-transparent" />
          </div>

          {/* === COLUMN 2: PRODUCT === */}
          <div>
            <h4 className="text-white font-semibold mb-5">Product</h4>
            <ul className="space-y-3 text-sm">
              {["Features", "Pricing", "Book Demo"].map((item) => (
                <li key={item}>
                  <a className="relative inline-block hover:text-amber-400 transition group">
                    {item}
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-amber-400 transition-all group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* === COLUMN 3: COMPANY === */}
          <div>
            <h4 className="text-white font-semibold mb-5">Company</h4>
            <ul className="space-y-3 text-sm">
              {["About", "Contact"].map((item) => (
                <li key={item}>
                  <a className="relative inline-block hover:text-amber-400 transition group">
                    {item}
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-amber-400 transition-all group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* === COLUMN 4: LEGAL === */}
          <div>
            <h4 className="text-white font-semibold mb-5">Legal</h4>
            <ul className="space-y-3 text-sm">
              {["Privacy Policy", "Terms"].map((item) => (
                <li key={item}>
                  <a className="relative inline-block hover:text-amber-400 transition group">
                    {item}
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-amber-400 transition-all group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* === COLUMN 5: CONTACT === */}
          <div>
            <h4 className="text-white font-semibold mb-5">Contact</h4>

            <div className="space-y-4 text-sm">

              <div className="flex items-center gap-3 group cursor-pointer">
                <Mail className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition" />
                <span className="group-hover:text-white transition">
                  hello@archivist.com
                </span>
              </div>

              <div className="flex items-center gap-3 group cursor-pointer">
                <Phone className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition" />
                <span className="group-hover:text-white transition">
                  +91 98765 43210
                </span>
              </div>

            </div>
          </div>

        </motion.div>

        {/* === DIVIDER === */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">

          <p>© 2026 Archivist ERP. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <span>Secure. Reliable. Built for scale.</span>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>System Operational</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;