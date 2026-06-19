import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const NAV_ITEMS = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Customers", href: "#customers" },
  { name: "Demo", href: "#demo" },
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
      const progress = (scrollY / docHeight) * 100;
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
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled
          ? `
              bg-card/70 backdrop-blur-2xl 
              border-b border-theme/60 
              shadow-[0_4px_20px_rgba(0,0,0,0.04)]
            `
          : `
              bg-card/50 backdrop-blur-xl 
              border-b border-transparent
            `
          }`}
      >
        <div
          className={`container-app flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"
            }`}
        >
          {/* LEFT: LOGO */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-[var(--density-radius)] bg-primary flex items-center justify-center text-white font-bold shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
              ERP
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-main tracking-tight transition-colors group-hover:text-primary">
                YourERP
              </span>

              <span className="text-[10px] text-muted hidden md:block">
                Trusted by 500+ businesses
              </span>
            </div>
          </div>

          {/* CENTER: NAV LINKS */}
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-muted">
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
                    className={`transition-colors duration-150 ${isActive ? "text-main" : "group-hover:text-main"
                      }`}
                  >
                    {item.name}
                  </span>

                  {/* Underline */}
                  <span
                    className={`
                      absolute left-0 -bottom-1 h-[2px] w-full bg-primary
                      origin-left transition-transform duration-150 ease-out
                      ${isActive
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                      }
                    `}
                  />
                </a>
              );
            })}
          </div>

          {/* RIGHT: LOGIN + CTA */}
          <div className="flex items-center gap-3">
            {/* <Link
              to="/login"
              className="hidden md:block text-sm font-medium text-white hover:text-main transition-colors duration-150 bg-[var(--primary)] rounded-[calc(var(--density-radius)*1)] px-[calc(var(--density-padding-sm)*2)] py-[calc(var(--density-padding-md)*1)] "
            >
              Login
            </Link> */}

            {/* {showSignup && (
              <Link to="/signup">
                <button
                  className={`
                  relative inline-flex items-center justify-center
                  px-[var(--density-padding-lg)] py-[var(--density-padding-sm)]
                  text-sm font-semibold text-white
                  rounded-[var(--density-radius)]
                  bg-primary

                  shadow-[0_2px_6px_rgba(0,0,0,0.08)]
                  transition-all duration-200

                  hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)]
                  hover:scale-[1.02]

                  active:scale-[0.98]
                `}
                >
                  <span className="absolute inset-0 rounded-[var(--density-radius)] bg-primary opacity-0 blur-xl transition-opacity duration-300 hover:opacity-20"></span>

                  <span className="relative z-10">Sign Up</span>
                </button>
              </Link>
            )} */}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;