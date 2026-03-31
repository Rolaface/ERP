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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-app">

      {/* ================= LEFT ================= */}
      <section className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-app">
        <div className="max-w-md w-full mx-auto">

          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="heading-lg font-bold tracking-tight">
              ERP
            </span>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="heading-xl mb-3">
              Regain Operational Clarity
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              All-in-one ERP to manage finance, inventory & teams with precision.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Email or Username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-card border border-theme text-main placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                placeholder="name@company.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-muted">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-10 rounded-lg bg-card border border-theme text-main placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {/* Remember */}
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

            {/* Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full h-12 rounded-lg font-semibold text-white
bg-[linear-gradient(to_right,var(--primary),rgba(59,91,158,0.8))]
hover:opacity-90
active:scale-[0.98]
transition flex items-center justify-center gap-2
              "
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-theme">
            <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wide">
              <ShieldCheck size={16} />
              Secured with enterprise-grade encryption
            </div>
          </div>

        </div>
      </section>

      {/* ================= RIGHT ================= */}
      <section className="hidden md:flex relative items-center justify-center overflow-hidden bg-sidebar">

        {/* Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative w-full max-w-lg px-8 space-y-8">

          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-card/70 backdrop-blur-xl shadow-xl border border-theme animate-float">
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
          <div className="p-6 rounded-2xl bg-card/70 backdrop-blur-xl shadow-xl border border-theme ml-12 animate-float-delayed">
            <div className="flex items-center gap-4">
              <Users className="text-primary" />
              <div>
                <p className="text-sm text-muted">Active Users</p>
                <p className="text-lg font-bold text-main">1,240</p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-card/70 backdrop-blur-xl shadow-xl border border-theme animate-float-slow">
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

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle,_#000_1px,_transparent_1px)] [background-size:24px_24px]" />
      </section>
    </div>
  );
};

export default Login;