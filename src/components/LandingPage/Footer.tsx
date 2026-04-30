import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-app text-muted overflow-hidden">

      {/* Top Divider */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-radial-glow opacity-50 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03] bg-grid-subtle" />
      </div>

      <div className="relative z-10 container-app px-6">

        {/* ================= MINI CTA ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-28 pb-24 text-center border-b border-theme/70"
        >
          <div className="relative max-w-3xl mx-auto">

            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-3xl opacity-40" />

            <div className="relative stack-md">

              <h2 className="text-[34px] md:text-[42px] font-semibold text-main leading-tight tracking-tight">
                Stop losing time fixing{" "}
                <span className="text-red-500">financial chaos</span>.
                <br />
                <span className="text-gradient">
                  Get complete control in minutes.
                </span>
              </h2>

              <p className="text-muted max-w-xl mx-auto text-[15px] leading-relaxed">
                One system for payments, inventory, and accounts — so your business finally runs without confusion.
              </p>

              {/* CTA */}
              <div className="flex flex-col items-center gap-3 mt-6">

                <button className="btn btn-primary group relative inline-flex items-center gap-3 px-8 py-4 rounded-full overflow-hidden">

                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  Start Free Trial

                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                </button>

                {/* 🔥 Micro trust */}
                <p className="text-[12px] text-muted/80">
                  No credit card required • Setup in under 2 minutes
                </p>

              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= TRUST STRIP ================= */}
        <div className="text-center py-8 border-b border-theme/60">

          <p className="text-[13px] text-muted/80 max-w-2xl mx-auto leading-relaxed">
            Trusted by <span className="text-main font-medium">500+ businesses</span> • ₹10Cr+ transactions/month • Used across India
          </p>

        </div>

        {/* ================= MAIN GRID ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-5 gap-14 pt-16 pb-16"
        >

          {/* BRAND */}
          <div className="col-span-2 md:col-span-1">

            <h2 className="text-2xl font-semibold tracking-tight text-gradient">
              Archivist ERP
            </h2>

            <p className="mt-4 text-muted/80 text-sm leading-relaxed max-w-[240px]">
              Built for businesses that want real control over operations and finances.
            </p>

            <p className="mt-3 text-[12px] text-muted/70">
              Clarity over chaos.
            </p>

          </div>

          {/* LINKS */}
          {[
            { title: "Product", items: ["Features", "Pricing", "Book Demo"] },
            { title: "Company", items: ["About", "Contact"] },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-main/90 font-medium mb-5 text-[12px] tracking-wide">
                {group.title}
              </h4>

              <ul className="space-y-3 text-[13px]">
                {group.items.map((item) => (
                  <li key={item}>
                    <a className="group inline-block relative text-muted/60 hover:text-main transition duration-300">
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
            <h4 className="text-main/90 font-medium mb-5 text-[12px] tracking-wide">
              Contact
            </h4>

            <div className="space-y-4 text-[13px]">

              <div className="flex items-center gap-3 group cursor-pointer">
                <Mail className="w-4 h-4 text-muted/60 group-hover:text-primary transition duration-300" />
                <span className="text-muted/70 group-hover:text-main transition duration-300">
                  hello@archivist.com
                </span>
              </div>

              <div className="flex items-center gap-3 group cursor-pointer">
                <Phone className="w-4 h-4 text-muted/60 group-hover:text-primary transition duration-300" />
                <span className="text-muted/70 group-hover:text-main transition duration-300">
                  +91 98765 43210
                </span>
              </div>

            </div>
          </div>

        </motion.div>

        {/* ================= CREDIBILITY STRIP ================= */}
        <div className="border-t border-theme/60 pt-5 pb-3 text-center text-[12px] text-muted/70 flex flex-wrap justify-center gap-3">

          <span>GST compliant</span>
          <span>•</span>
          <span>Data encrypted</span>
          <span>•</span>
          <span>Daily backups</span>

        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="pt-5 pb-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted/70">

          <p>© 2026 Archivist ERP. All rights reserved.</p>

          <div className="flex items-center gap-5 flex-wrap justify-center">

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span>All systems operational</span>
            </div>

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