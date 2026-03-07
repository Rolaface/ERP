import { useState } from "react";
import {
  User,
  Lock,
  EyeOff,
  Eye,
  Shield,
  Zap,
  BarChart3,
  Users,
  ArrowRight,
} from "lucide-react";
import { useLogin } from "../hooks/useloginhooks";
import erp2 from "../assets/login-illustration2.png";
import logo from "../assets/iZyane_Icon.png";
import "../login.css";

const features = [
  { icon: Shield, label: "Enterprise Security" },
  { icon: Zap, label: "Lightning Fast" },
  { icon: BarChart3, label: "Real-time Analytics" },
  { icon: Users, label: "Team Collaboration" },
];

const Login = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    handleSubmit,
  } = useLogin();

  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(210,20%,95%)] p-4 overflow-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-[hsl(210, 80%, 62%)]/10 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[hsl(210, 60%, 50%)]/8 blur-3xl animate-pulse-slower" />
      </div>

      <div className="relative w-full max-w-[1100px] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-[hsl(210, 70%, 55%)]/10 animate-scale-in">
        <div className="grid min-h-[640px] md:grid-cols-[1fr_1.1fr]">
          {/* Left - Form */}
          <div className="flex flex-col justify-center px-8 py-12 md:px-14">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3 animate-fade-in delay-100 fill-both opacity-0-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(210 , 70%, 55%)] shadow-primary-lg hover-scale cursor-pointer">
                <img src={logo} alt="ERP Dashboard Preview" />
              </div>
              <div>
                <span className="text-xl font-bold text-[hsl(240,10%,20%)] tracking-tight">
                  iZyane ERP
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(240,5%,50%)] font-medium">
                  Enterprise Suite
                </p>
              </div>
            </div>

            {/* Heading */}
            <h1 className="mb-1 text-2xl font-bold text-[hsl(240,10%,20%)] animate-fade-in delay-200 fill-both opacity-0-start">
              Welcome back
            </h1>
            <p className="mb-8 text-sm text-[hsl(240,5%,50%)] animate-fade-in delay-250 fill-both opacity-0-start">
              Sign in to manage your business operations
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[hsl(0,84%,97%)] border border-[hsl(0,84%,90%)] animate-fade-in">
                <p className="text-sm text-[hsl(0,84%,60%)] font-medium">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div className="relative mb-4 animate-fade-in delay-350 fill-both opacity-0-start">
                <User
                  className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
                    focusedField === "user"
                      ? "text-[hsl(200,70%,55%)]"
                      : "text-[hsl(240,5%,50%)]"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Username or email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("user")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full rounded-xl border border-[hsl(270,20%,88%)] bg-[hsl(270,30%,97%)] py-3 pl-11 pr-4 text-sm text-[hsl(240,10%,20%)] placeholder:text-[hsl(240,5%,50%)]/60 outline-none focus:border-[hsl(210,70%,55%)] focus:ring-2 focus:ring-[hsl(210,70%,55%)]/10 focus:bg-white transition-all duration-300"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative mb-5 animate-fade-in delay-450 fill-both opacity-0-start">
                <Lock
                  className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
                    focusedField === "pass"
                      ? "text-[hsl(220,70%,55%)]"
                      : "text-[hsl(240,5%,50%)]"
                  }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("pass")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full rounded-xl border border-[hsl(270,20%,88%)] bg-[hsl(270,30%,97%)] py-3 pl-11 pr-11 text-sm text-[hsl(240,10%,20%)] placeholder:text-[hsl(240,5%,50%)]/60 outline-none focus:border-[hsl(210,70%,55%)] focus:ring-2 focus:ring-[hsl(210,70%,55%)]/10 focus:bg-white transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(240,5%,50%)] hover:text-[hsl(240,10%,20%)] transition-colors"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Remember / Forgot */}
              <div className="mb-6 flex items-center justify-between animate-fade-in delay-550 fill-both opacity-0-start">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[hsl(240,5%,50%)] group">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border transition-all duration-200 ${
                      rememberMe
                        ? "border-[hsl(210,70%,55%)] bg-[hsl(210,70%,55%)]"
                        : "border-[hsl(270,20%,88%)] group-hover:border-[hsl(210,70%,55%)]/50"
                    }`}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:opacity-90 transition-colors"
                >
                  Reset Password
                </button>
              </div>

              {/* Login button */}
              <div className="animate-fade-in delay-650 fill-both opacity-0-start">
                <button
                  type="submit"
                  className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:opacity-95 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </form>
          </div>

          {/* Right - Illustration */}
          <div className="relative hidden md:block overflow-hidden bg-white">
            {/* Animated gradient background */}
            <div className="absolute inset-0">
              <div className="absolute -left-16 -top-16 h-[130%] w-[130%] rounded-blob-1 bg-[hsl(205,80%,58%)] opacity-90 animate-spin-slow origin-55-50" />

              <div className="absolute -bottom-20 -right-20 h-[70%] w-[70%] rounded-blob-2 bg-[hsl(210,75%,50%)]/40 animate-spin-slower origin-45-50" />

              <div className="absolute top-10 right-10 h-[40%] w-[40%] rounded-full bg-white/5 animate-spin-slowest origin-50-60" />
            </div>

            {/* Content */}
            <div className="relative flex h-full flex-col items-center justify-center p-10">
              {/* Laptop */}
              <div className="flex w-full justify-center animate-float">
                <div
                  className="w-full max-w-[380px] 
      rounded-2xl 
      bg-white/10 
      backdrop-blur-md 
      border border-white/20 
      p-3 
      shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                >
                  <img
                    src={erp2}
                    alt="ERP Dashboard Preview"
                    className="w-full rounded-xl animate-fade-in delay-500 fill-both duration-800"
                  />
                </div>
              </div>
              {/* Feature pills */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 animate-fade-in delay-800 fill-both opacity-0-start">
                {features.map((f, i) => (
                  <div
                    key={f.label}
                    className={`flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/10 animate-fade-in fill-both opacity-0-start hover-scale delay-${900 + i * 100}`}
                  >
                    <f.icon className="h-3 w-3" />
                    {f.label}
                  </div>
                ))}
              </div>

              {/* Tagline */}
              <p className="mt-6 text-center text-sm font-medium text-white/80 max-w-[280px] animate-fade-in delay-1300 fill-both opacity-0-start">
                One platform to manage inventory, sales, HR & finance —
                simplified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
