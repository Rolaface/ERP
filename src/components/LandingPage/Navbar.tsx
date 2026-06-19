import React, { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { name: "Modules", href: "#modules" },
  { name: "How It Works", href: "#how-it-works" },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);

  const ticking = useRef(false);

  // rAF Scroll Handling (smooth + performant)
  useEffect(() => {
    const updateScroll = () => {
      const scrollY = window.scrollY;

      setIsScrolled(scrollY > 8);

      // Progress bar
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setScrollProgress(progress);

      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScroll);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    updateScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for Active Section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      {
        rootMargin: "-40% 0px -50% 0px",
        threshold: 0,
      }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.querySelector(item.href);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll (soft snapping)
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;

    const y =
      target.getBoundingClientRect().top + window.scrollY - 70; // offset for navbar

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[60]">
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{
            width: `${scrollProgress}%`,
            background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
          }}
        />
      </div>

      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-2xl border-b shadow-[0_4px_20px_rgba(15,31,61,0.06)]"
            : "backdrop-blur-xl border-b border-transparent"
        }`}
        style={{
          background: isScrolled
            ? "rgba(255,255,255,0.85)"
            : "rgba(255,255,255,0.65)",
          borderColor: isScrolled ? "rgba(200,218,240,0.60)" : "transparent",
        }}
      >
        <div
          className={`container-app flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "h-14" : "h-16"
          }`}
        >
          {/* LEFT: LOGO */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              }}
            >
              ERP
            </div>

            <div className="flex flex-col leading-tight">
              <span
                className="text-lg font-semibold tracking-tight transition-colors"
                style={{ color: "#0f1f3d" }}
              >
                ERP
              </span>
            </div>
          </div>

          {/* CENTER: NAV LINKS */}
          <div
            className="hidden md:flex items-center gap-6 text-sm font-medium"
            style={{ color: "#5a7199" }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="relative group px-1 py-1"
                >
                  <span
                    className="transition-colors duration-150"
                    style={{ color: isActive ? "#0f1f3d" : undefined }}
                  >
                    {item.name}
                  </span>

                  {/* Underline */}
                  <span
                    className={`
                      absolute left-0 -bottom-1 h-[2px] w-full
                      origin-left transition-transform duration-150 ease-out
                      ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
                    `}
                    style={{ background: "#2563eb" }}
                  />
                </a>
              );
            })}
          </div>

         
        </div>
      </nav>
    </>
  );
};

export default Navbar;
