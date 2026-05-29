import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Package,
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
    forgotOpen,
    setForgotOpen,
    forgotEmail,
    setForgotEmail,
    forgotStatus,
    forgotMessage,
    handleForgotPassword,
    closeForgotModal,
  } = useLogin();

  const [rememberMe, setRememberMe] = useState(false);

  return (
    // <div className="min-h-screen bg-app overflow-hidden">
<div className="min-h-screen bg-slate-50 overflow-hidden flex items-center"> 
      {/* <section className="relative flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-app"> */}
<section className="relative flex flex-col justify-center w-full px-8 md:px-16 lg:px-24 py-12">
        {/* Soft gradient fade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/5" />

        {/* <div className="max-w-md w-full mx-auto relative z-10 backdrop-blur-[2px]"> */}
        <div className="max-w-md w-full mx-auto relative z-10 bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">

          {/* Logo */}
          <div className="mb-10 flex items-center gap-3 animate-fade-up delay-1">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="heading-lg font-bold tracking-tight">
              ERP
            </span>
          </div>

          {/* Headline */}
          <div className="mb-12 animate-fade-up delay-2">
            <h1 className="heading-xl mb-4 tracking-tight leading-[1.1] text-main">
              Regain Operational Clarity
            </h1>

            <p className="text-muted text-sm leading-relaxed max-w-sm">
              All-in-one ERP to manage finance, inventory & teams with precision.
            </p>
          </div>

          {/* Error */}
          <div className="mb-6 min-h-[44px]">
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 motion-fade-in">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* ================= FORM ================= */}
          <form onSubmit={handleSubmit} className="form-section space-y-6 animate-fade-up delay-3">

            {/* Email */}
            <div className="form-group space-y-2">
              <label className="form-label">Email or Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base 
transition-all duration-[120ms] ease-out
focus:ring-2 focus:ring-primary/30 focus:border-primary 
hover:shadow-sm focus:shadow-md
focus:scale-[1.01]"
                placeholder="name@company.com"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group space-y-2">
              <div className="flex justify-between items-center">
                <label className="form-label">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10 transition-all duration-200 ease-out 
            focus:ring-2 focus:ring-primary/30 focus:border-primary 
            hover:shadow-sm focus:shadow-md"
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
            text-muted hover:text-main 
            transition-colors duration-200"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

            </div>

            {/* Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary group w-full h-12 flex items-center justify-center gap-2
  relative overflow-hidden
  transition-all duration-[120ms] ease-out
  hover:shadow-lg hover:-translate-y-[1px]
  active:scale-[0.97] active:shadow-md
  disabled:opacity-70 disabled:cursor-not-allowed"
              >

                {/* Gradient overlay */}
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300" />


                {isSubmitting && (
                  <span className="absolute inset-0 animate-pulse z-10" />
                )}

                {/* Content */}
                <span className="relative flex items-center gap-2 z-20">
                  {isSubmitting ? "Checking..." : "Sign In"}
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </span>

              </button>
            </div>

          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-theme animate-fade-in delay-4">
            <div className="flex items-center gap-2 text-muted text-[11px] tracking-wider uppercase">
              <ShieldCheck size={16} />
              Secured with enterprise-grade encryption
            </div>
          </div>

        </div>
      </section>

      {/* ================= RIGHT ================= */}
      
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeForgotModal(); }}
        >
          <div className="card relative w-full max-w-sm mx-4 p-8 animate-fade-up">

            {/* Close */}
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-muted hover:text-main transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="heading-lg font-bold text-main mb-2">Reset password</h2>
            <p className="text-muted text-sm mb-6">
              Enter your email and we'll send a reset link.
            </p>

            {/* Status messages */}
            {forgotStatus === "success" && (
              <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-success text-sm">{forgotMessage}</p>
              </div>
            )}
            {forgotStatus === "error" && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
                <p className="text-danger text-sm">{forgotMessage}</p>
              </div>
            )}

            {forgotStatus !== "success" && (
              <>
                <div className="space-y-2 mb-6">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                    className="input-base focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="name@company.com"
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotStatus === "loading"}
                  className="btn btn-primary w-full h-12 flex items-center justify-center gap-2
              transition-all duration-[120ms] hover:shadow-lg hover:-translate-y-[1px]
              active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {forgotStatus === "loading" ? "Sending..." : "Send reset link"}
                </button>
              </>
            )}

            {forgotStatus === "success" && (
              <button
                type="button"
                onClick={closeForgotModal}
                className="btn btn-primary w-full h-12 flex items-center justify-center mt-2"
              >
                Back to login
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;