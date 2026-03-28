import React, { useEffect, useState } from "react";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          : "bg-white/70 backdrop-blur-lg"
      }`}
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        
        {/* LEFT: LOGO */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c58b45] to-[#a06d2f] flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
            ERP
          </div>
          <span className="text-lg font-semibold text-gray-900 tracking-tight group-hover:text-black transition-colors">
            YourERP
          </span>
        </div>

        {/* CENTER: NAV LINKS */}
        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-600">
          {[
            { name: "Features", href: "#features" },
            { name: "Pricing", href: "#pricing" },
            { name: "Customers", href: "#customers" },
            { name: "Demo", href: "#demo" },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="relative group transition-colors"
            >
              <span className="group-hover:text-gray-900 transition-colors">
                {item.name}
              </span>

              {/* Animated underline */}
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-[#c58b45] transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* RIGHT: LOGIN + CTA */}
        <div className="flex items-center gap-5">
          
          {/* Login */}
          <a
            href="/login"
            className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Login
          </a>

          {/* CTA */}
          <button className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-[#c58b45] to-[#a06d2f] shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
            
            {/* Glow effect */}
            <span className="absolute inset-0 rounded-xl bg-[#c58b45] opacity-0 blur-xl transition-opacity duration-300 hover:opacity-40"></span>
            
            <span className="relative z-10">Book Demo</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;