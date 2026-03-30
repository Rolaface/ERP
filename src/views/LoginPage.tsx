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
import erp2 from "../assets/login-illustration.png";

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
    isSubmitting,
  } = useLogin();

  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-6 relative overflow-hidden">

      {/* Ambient Glass Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[1100px] rounded-3xl border border-theme bg-card/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">

        <div className="grid md:grid-cols-[1fr_1.1fr] min-h-[640px]">

          {/* LEFT */}
          <div className="flex flex-col justify-center px-10 py-12">

            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-sm">
                ⬡
              </div>
              <div>
                <h2 className="heading-lg">ERP</h2>
                <p className="text-xs text-muted tracking-widest uppercase">
                  Enterprise Suite
                </p>
              </div>
            </div>

            <h1 className="heading-xl mb-2">Welcome back</h1>
            <p className="text-muted mb-8 text-sm">
              Sign in to continue your workflow with clarity
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20">
                <p className="text-danger text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="stack-md">

              {/* EMAIL FIELD */}
              <div className="relative">
                <User
                  className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition ${
                    focusedField === "user" ? "text-primary" : "text-muted"
                  }`}
                />

                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("user")}
                  onBlur={() => setFocusedField(null)}
                  className="peer filter-input-refined pl-11 pt-5 pb-2"
                  required
                />

                <label className="absolute left-11 top-2 text-xs text-muted transition-all 
                  peer-focus:text-primary 
                  peer-placeholder-shown:top-3.5 
                  peer-placeholder-shown:text-sm">
                  Username or Email
                </label>
              </div>

              {/* PASSWORD FIELD */}
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition ${
                    focusedField === "pass" ? "text-primary" : "text-muted"
                  }`}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("pass")}
                  onBlur={() => setFocusedField(null)}
                  className="peer filter-input-refined pl-11 pr-11 pt-5 pb-2"
                  required
                />

                <label className="absolute left-11 top-2 text-xs text-muted transition-all 
                  peer-focus:text-primary 
                  peer-placeholder-shown:top-3.5 
                  peer-placeholder-shown:text-sm">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-main"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* OPTIONS */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="accent-[var(--primary)]"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                >
                  Reset Password
                </button>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  btn btn-primary w-full py-3 text-base gap-2 mt-2
                  shadow-[0_10px_30px_rgba(0,0,0,0.12)]
                  hover:shadow-[0_15px_40px_rgba(0,0,0,0.18)]
                  hover:-translate-y-[1px]
                  active:translate-y-0
                "
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* RIGHT */}
          <div className="hidden md:flex items-center justify-center bg-sidebar relative overflow-hidden">

            {/* Glass overlay */}
            <div className="absolute inset-0 bg-card/30 backdrop-blur-2xl" />

            <div className="relative z-10 p-10 text-center stack-md">

              <div className="card card-hover max-w-[380px] mx-auto backdrop-blur-md bg-card/70">
                <img src={erp2} alt="ERP Preview" className="rounded-xl" />
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {features.map((f) => (
                  <div key={f.label} className="badge gap-1 backdrop-blur-sm bg-card/60">
                    <f.icon className="h-3 w-3" />
                    {f.label}
                  </div>
                ))}
              </div>

              <p className="text-muted text-sm max-w-[300px] mx-auto mt-4">
                A unified platform to manage inventory, sales, HR & finance —
                designed for precision and scale.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;