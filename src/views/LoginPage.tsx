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
  } = useLogin();

  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-app relative overflow-hidden">

      {/* Global ambient light */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-radial-glow opacity-40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-radial-glow opacity-30 blur-[100px]" />
      </div>

      {/* ================= LEFT ================= */}
      <section className="relative flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-app">

        {/* Soft gradient fade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/5" />

        <div className="max-w-md w-full mx-auto relative z-10 backdrop-blur-[2px]">

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
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* ================= FORM ================= */}
          <form onSubmit={handleSubmit} className="form-section space-y-6 animate-fade-up delay-3">

            {/* Email */}
            <div className="form-group space-y-2">
              <label className="form-label">Email or Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base transition-all duration-200 ease-out 
          focus:ring-2 focus:ring-primary/30 focus:border-primary 
          hover:shadow-sm focus:shadow-md"
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

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                <label className="text-sm text-muted">
                  Remember me for 30 days
                </label>
              </div>
            </div>

            {/* Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary group w-full h-12  flex items-center justify-center gap-2
          relative overflow-hidden
          transition-all duration-200 ease-out
          hover:shadow-lg hover:-translate-y-[1px]
          active:scale-[0.98] active:shadow-md
          disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300" />

                <span className="relative flex items-center gap-2">
                  {isSubmitting ? "Signing In..." : "Sign In"}
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
      <section className="hidden md:flex relative items-center justify-center overflow-hidden bg-sidebar">

        {/* Background glow (refined & softer) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-radial-glow opacity-60 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-radial-glow opacity-50 blur-[140px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md px-8 space-y-6">

          <div className="text-sm text-muted mb-2 px-1">
            Your business at a glance
          </div>

          {/* Card 1 */}
          <div className="card card-hover relative overflow-hidden
      before:absolute before:inset-0
      before:bg-gradient-to-br before:from-white/5 before:to-transparent
      before:opacity-0 hover:before:opacity-100
      before:transition-opacity">

            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="text-primary" />
              </div>
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                +12.4%
              </span>
            </div>

            <p className="text-sm text-muted">Monthly Revenue</p>
            <h3 className="text-2xl font-bold text-main">₹2,48,290</h3>

            <div className="mt-4 h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[78%]" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="card card-hover relative overflow-hidden
      before:absolute before:inset-0
      before:bg-gradient-to-br before:from-white/5 before:to-transparent
      before:opacity-0 hover:before:opacity-100
      before:transition-opacity">

            <div className="flex items-center gap-4">
              <Users className="text-primary" />
              <div>
                <p className="text-sm text-muted">Active Users</p>
                <p className="text-lg font-bold text-main">1,240</p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card card-hover relative overflow-hidden
      before:absolute before:inset-0
      before:bg-gradient-to-br before:from-white/5 before:to-transparent
      before:opacity-0 hover:before:opacity-100
      before:transition-opacity">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="text-primary" />
                <span className="text-sm font-semibold text-main">
                  Stock Audit
                </span>
              </div>
              <span className="text-xs text-muted">Batch #PX-992</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Progress</span>
                <span>92%</span>
              </div>
              <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[92%]" />
              </div>
            </div>
          </div>

        </div>

        {/* Grid texture (enhanced blending) */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-grid-subtle mix-blend-overlay" />

      </section>
    </div>
  );
};

export default Login;