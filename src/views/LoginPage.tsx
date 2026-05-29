import {
  Eye,
  EyeOff,
  ArrowRight,
  BarChart3,
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

  // const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="login-page relative min-h-screen overflow-hidden bg-slate-100">
      {/* Background polish */}
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-60" />

      {/* Main */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md motion-fade-up">
          {/* Card */}
          <div
            className="
              form-card form-card--sm
              card-premium
              border-theme
              bg-card
              min-h-0
              gap-8
              px-6 py-7
              sm:px-8 sm:py-8
            "
          >
            {/* =========================================================
                BRAND
            ========================================================= */}
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-11 w-11 items-center justify-center
                  rounded-2xl
                  bg-primary
                  shadow-sm
                "
              >
                <BarChart3 className="h-5 w-5 text-white" />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide text-main">
                  RolaERP
                </span>

                <span className="text-xs text-muted">
                  Enterprise Resource Platform
                </span>
              </div>
            </div>

            {/* =========================================================
                HEADER
            ========================================================= */}
            <div className="form-header gap-3">
              <h1
                className="
                  text-[30px]
                  leading-[1.05]
                  font-semibold
                  tracking-tight
                  text-main
                "
              >
                Welcome back
              </h1>

              <p
                className="
                  max-w-sm
                  text-sm
                  leading-relaxed
                  text-muted
                "
              >
                Sign in using your company credentials to continue.
              </p>
            </div>

            {/* =========================================================
                ERROR
            ========================================================= */}
            {error && (
              <div
                className="
                  rounded-2xl
                  border border-danger/20
                  bg-danger/10
                  px-4 py-3
                  motion-fade-in
                "
              >
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {/* =========================================================
                FORM
            ========================================================= */}
            <form
              onSubmit={handleSubmit}
              className="form-section gap-5"
            >
              {/* EMAIL */}
              <div className="form-field">
                <label
                  htmlFor="email"
                  className="form-label mb-2"
                >
                  Email or Employee ID
                </label>

                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="username"
                  required
                  className="
                    input-base
                    h-12
                  "
                />
              </div>

              {/* PASSWORD */}
              <div className="form-field">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="form-label"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="
                      text-xs
                      font-medium
                      text-primary
                      transition-opacity
                      hover:opacity-80
                    "
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="
                      input-base
                      h-12
                      pr-12
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="
absolute inset-y-0 right-0
flex items-center justify-center
w-12
text-muted
transition-colors
hover:text-main
"
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER */}

              {/* <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="
                      h-4 w-4
                      rounded
                      border-theme
                    "
                  />

                  <span className="text-sm text-muted">
                    Remember me
                  </span>
                </label>
              </div> */}

              {/* BUTTON */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    btn btn-primary btn-premium
                    h-12 w-full
                    rounded-xl
                    text-sm font-semibold
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? "Signing in..." : "Sign In"}

                    {!isSubmitting && (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </span>
                </button>
              </div>
            </form>

            {/* =========================================================
                FOOTER
            ========================================================= */}
            <div
              className="
                flex items-center gap-2
                border-t border-theme
                pt-5
              "
            >

            </div>
          </div>
        </div>
      </main>

      {/* =============================================================
          FORGOT PASSWORD MODAL
      ============================================================= */}
      {forgotOpen && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/40
            p-4
            backdrop-blur-sm
          "
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeForgotModal();
            }
          }}
        >
          <div
            className="
              card-premium
              bg-card
              relative
              w-full
              max-w-md
              rounded-3xl
              border border-theme
              p-6
              motion-scale-in
            "
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeForgotModal}
              aria-label="Close modal"
              className="
                absolute right-4 top-4
                text-muted
                transition-colors
                hover:text-main
              "
            >
              ✕
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-main">
                Reset password
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted">
                Enter your email address and we’ll send you a
                password reset link.
              </p>
            </div>

            {/* Status */}
            {forgotStatus === "success" && (
              <div
                className="
                  mb-5 rounded-2xl
                  border border-success/20
                  bg-success/10
                  px-4 py-3
                "
              >
                <p className="text-sm text-success">
                  {forgotMessage}
                </p>
              </div>
            )}

            {forgotStatus === "error" && (
              <div
                className="
                  mb-5 rounded-2xl
                  border border-danger/20
                  bg-danger/10
                  px-4 py-3
                "
              >
                <p className="text-sm text-danger">
                  {forgotMessage}
                </p>
              </div>
            )}

            {/* Form */}
            {forgotStatus !== "success" && (
              <>
                <div className="form-field mb-6">
                  <label
                    htmlFor="forgot-email"
                    className="form-label mb-2"
                  >
                    Email address
                  </label>

                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) =>
                      setForgotEmail(e.target.value)
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      handleForgotPassword()
                    }
                    placeholder="name@company.com"
                    autoFocus
                    className="input-base h-12"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotStatus === "loading"}
                  className="
                    btn btn-primary btn-premium
                    h-12 w-full
                    rounded-xl
                    text-sm font-semibold
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                >
                  {forgotStatus === "loading"
                    ? "Sending..."
                    : "Send reset link"}
                </button>
              </>
            )}

            {/* Success CTA */}
            {forgotStatus === "success" && (
              <button
                type="button"
                onClick={closeForgotModal}
                className="
                  btn btn-primary btn-premium
                  mt-2
                  h-12 w-full
                  rounded-xl
                  text-sm font-semibold
                "
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