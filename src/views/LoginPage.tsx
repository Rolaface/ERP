import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import "../login.css";

const features = [
  { icon: Shield, label: "Enterprise Security" },
  { icon: Zap, label: "Lightning Fast" },
  { icon: BarChart3, label: "Real-time Analytics" },
  { icon: Users, label: "Team Collaboration" },
];

const Login = () => {
  const navigate = useNavigate();

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

  // ✅ WRAP SUBMIT
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await handleSubmit(e); // expect boolean

    if (success) {
      // ✅ store auth (VERY IMPORTANT for ProtectedRoute)
      localStorage.setItem("isAuthenticated", "true");

      // ✅ navigate to dashboard
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(240,20%,95%)] p-4 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-[hsl(270,70%,55%)]/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[hsl(270,60%,50%)]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[1100px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="grid min-h-[640px] md:grid-cols-[1fr_1.1fr]">

          {/* LEFT */}
          <div className="flex flex-col justify-center px-8 py-12 md:px-14">

            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold">
                ⬡
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">ERP</span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  Enterprise Suite
                </p>
              </div>
            </div>

            <h1 className="mb-1 text-2xl font-bold text-gray-800">
              Welcome back
            </h1>

            <p className="mb-8 text-sm text-gray-500">
              Sign in to manage your business operations
            </p>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* ✅ FIXED FORM */}
            <form onSubmit={onSubmit}>
              
              {/* Email */}
              <div className="relative mb-4">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Username or email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-11 py-3 text-sm"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative mb-5">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border px-11 py-3 text-sm"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              </div>

              {/* Remember */}
              <div className="mb-6 flex justify-between text-sm text-gray-500">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  Remember me
                </label>

                <button type="button">Reset Password</button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-purple-600 py-4 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* RIGHT */}
          <div className="hidden md:flex items-center justify-center bg-purple-600 text-white">
            <div className="p-10 text-center">
              <img src={erp2} className="rounded-xl mb-6" />
              <p className="text-sm opacity-80">
                One platform to manage inventory, sales, HR & finance.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;