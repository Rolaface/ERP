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
      <div className="hidden lg:flex w-[58%] relative flex-col justify-between px-16 py-12 bg-gradient-to-br from-[#0B1220] to-[#0F172A] overflow-hidden">

        {/* Animated Gradient Layer */}
        <div className="absolute inset-0 opacity-30 animate-[pulse_12s_ease-in-out_infinite] 
        bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_40%),
            radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.2),transparent_40%)]" />

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none 
        bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none 
        bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),
            linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]
        bg-[size:32px_32px]" />

        {/* Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px]" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10 animate-[fadeInUp_0.8s_ease-out]">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
            <span className="text-sm font-bold">⬢</span>
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">
            RolaERP
          </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-xl animate-[fadeInUp_1s_ease-out]">

          {/* Headline Glow */}
          <div className="absolute -top-10 -left-10 w-[300px] h-[300px] bg-blue-500/20 blur-[120px] pointer-events-none" />

          <h1 className="relative text-[48px] font-extrabold leading-[1.05] tracking-tight text-white mb-4">
            Operate your business with clarity
          </h1>

          <p className="text-[#94A3B8] text-lg mb-10 max-w-md">
            Secure, real-time control over finance, operations, and teams.
          </p>

          {/* Features */}
          <div className="space-y-6 mt-2">

            {/* Primary Feature */}
            <div className="flex items-start gap-4">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md" />

                <div className="relative w-11 h-11 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center">
                  <ShieldCheck className="text-white" size={20} />
                </div>
              </div>

              <span className="text-white font-medium leading-snug">
                End-to-end encrypted infrastructure
              </span>
            </div>

            {/* Secondary Feature */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-md" />

                <div className="relative w-11 h-11 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center">
                  <ShieldCheck className="text-[#CBD5E1]" size={20} />
                </div>
              </div>

              <span className="text-[#CBD5E1] leading-snug">
                Role-based access with audit trails
              </span>
            </div>

            {/* Secondary Feature */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-md" />

                <div className="relative w-11 h-11 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center">
                  <ShieldCheck className="text-[#CBD5E1]" size={20} />
                </div>
              </div>

              <span className="text-[#CBD5E1] leading-snug">
                99.99% uptime across global systems
              </span>
            </div>

          </div>
        </div>

        {/* Bottom Insight */}
        <div className="relative z-10 animate-[fadeInUp_1.2s_ease-out]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
          bg-[#1E293B]/50 backdrop-blur-md border border-[#334155]/50 
          text-[#CBD5E1] text-xs shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            +18.4% operational efficiency this quarter
          </div>
        </div>

      </div>

      {/* ================= RIGHT: ACCESS LAYER ================= */}
      <div className="w-full lg:w-[42%] flex items-center justify-center bg-gradient-to-b from-white to-[#F8FAFC] px-6">

        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none 
  bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.08),transparent_60%)]" />
        {/* Card with entrance animation */}
        
        <div className="relative w-full max-w-md 
bg-[rgba(255,255,255,0.72)] backdrop-blur-2xl
rounded-[30px] p-10
border border-white/50
shadow-[0_8px_30px_rgba(15,23,42,0.08),0_20px_60px_rgba(59,130,246,0.10)]
lg:-ml-24 lg:-mt-16 
animate-[fadeInUp_0.9s_ease-out]">

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-[#0F172A] mb-2 tracking-tight">
              Welcome back to Rola
            </h2>

            <p className="text-sm leading-relaxed text-[#64748B] max-w-[320px]">
              Continue managing operations, finance, and teams in one secure place.
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
                className="w-full h-12 px-4 rounded-xl 
bg-[#F4F8FC] border border-[#DCE7F3]
shadow-inner
placeholder:text-[#94A3B8]
focus:bg-white focus:border-primary 
focus:ring-4 focus:ring-blue-500/10
focus:border-blue-500/70
focus:shadow-[0_0_0_1px_rgba(59,130,246,0.30),0_8px_20px_rgba(59,130,246,0.10)]
focus:placeholder:opacity-60
outline-none transition-all duration-200"
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
                  className="w-full h-12 px-4 pr-10 rounded-xl 
bg-[#F4F8FC] border border-[#DCE7F3]
shadow-inner
placeholder:text-[#94A3B8]
focus:bg-white focus:border-primary 
focus:ring-4 focus:ring-blue-500/10
focus:border-blue-500/70
focus:shadow-[0_0_0_1px_rgba(59,130,246,0.30),0_8px_20px_rgba(59,130,246,0.10)]
focus:placeholder:opacity-60
outline-none transition-all duration-200"
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
              className="relative w-full h-[52px] rounded-xl text-white font-semibold overflow-hidden
  bg-gradient-to-b from-blue-500 to-blue-600
  transition-all duration-200
  hover:from-blue-500 hover:to-blue-700
  hover:-translate-y-[1px]
  hover:shadow-[0_10px_20px_rgba(59,130,246,0.25)]
  active:scale-[0.97]"
            >
              {/* Shine Effect */}
              <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500
  bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)]" />

              <span className="relative z-10">
                {isSubmitting ? "Signing you in..." : "Sign in"}
              </span>
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-[#64748B] mt-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 
flex items-center justify-center text-[10px]">
  🔒
</div>
              <span>Your data is protected</span>
            </div>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#F1F5F9] text-center space-y-2">

            <p className="text-sm text-[#475569]">
              New to Rola?{" "}
              <span className="text-primary font-semibold cursor-pointer hover:opacity-80 transition">
                Create your workspace
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