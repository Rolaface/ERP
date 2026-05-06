import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useLogin } from "../hooks/useloginhooks";

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
    isSubmitting,
  } = useLogin();

  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0B1220]">

      {/* ================= LEFT: TRUST LAYER ================= */}
      <div className="hidden lg:flex w-[58%] relative flex-col justify-between px-16 py-12 bg-gradient-to-br from-[#0B1220] to-[#0F172A]">

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none 
        bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),
            linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]
        bg-[size:32px_32px]" />

        {/* Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px]" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
            <span className="text-sm font-bold">⬢</span>
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">
            Nexus ERP
          </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-xl">

          <h1 className="text-[48px] font-extrabold leading-[1.05] tracking-tight text-white mb-4">
            Operate your business with clarity
          </h1>

          <p className="text-[#94A3B8] text-lg mb-10 max-w-md">
            Secure, real-time control over finance, operations, and teams.
          </p>

          {/* Features */}
          <div className="space-y-5">

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] flex items-center justify-center">
                <ShieldCheck className="text-white" size={18} />
              </div>
              <span className="text-white font-medium">
                End-to-end encrypted infrastructure
              </span>
            </div>

            <div className="flex items-center gap-4 opacity-80">
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center">
                <ShieldCheck className="text-[#94A3B8]" size={18} />
              </div>
              <span className="text-[#94A3B8]">
                Role-based access with audit trails
              </span>
            </div>

            <div className="flex items-center gap-4 opacity-80">
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center">
                <ShieldCheck className="text-[#94A3B8]" size={18} />
              </div>
              <span className="text-[#94A3B8]">
                99.99% uptime across global systems
              </span>
            </div>

          </div>
        </div>

        {/* Bottom Insight */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B]/40 border border-[#334155]/40 text-[#CBD5E1] text-xs">
            +18.4% operational efficiency this quarter
          </div>
        </div>

      </div>

      {/* ================= RIGHT: ACCESS LAYER ================= */}
      <div className="w-full lg:w-[42%] flex items-center justify-center bg-gradient-to-b from-white to-[#F8FAFC] px-6">

        {/* OVERLAP FIX (critical) */}
        <div className="w-full max-w-md bg-white rounded-2xl p-10 border border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.08)] lg:-ml-24 lg:-mt-16">

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-[#64748B]">
              Sign in to access your workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase mb-2">
                Email or Username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-12 px-4 rounded-lg 
                bg-[#F9FAFB] border border-[#E5E7EB]
                focus:bg-white focus:border-primary
                outline-none transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold text-[#475569] uppercase">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pr-10 rounded-lg 
                  bg-[#F9FAFB] border border-[#E5E7EB]
                  focus:bg-white focus:border-primary
                  outline-none transition"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              {/* Remember */}
              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="ml-2 text-sm text-[#475569]">
                  Remember me
                </span>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[52px] rounded-lg text-white font-semibold
              bg-gradient-to-b from-blue-500 to-blue-600
              hover:from-blue-500 hover:to-blue-700
              active:scale-[0.98] transition"
            >
              {isSubmitting ? "Checking..." : "Sign in"}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#F1F5F9] text-center space-y-2">

            <p className="text-sm text-[#475569]">
              Don’t have an account?{" "}
              <span className="text-primary font-semibold cursor-pointer">
                Sign up here
              </span>
            </p>

            <p className="text-xs text-[#94A3B8]">
              Need access?{" "}
              <span className="hover:text-[#64748B] cursor-pointer">
                Contact administrator
              </span>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;