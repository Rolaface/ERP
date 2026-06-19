import { Eye, EyeOff } from "lucide-react";
import { useLogin } from "../hooks/useloginhooks";
import "../login.css";

const Login = () => {
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    error, handleSubmit, isSubmitting,
    forgotOpen, setForgotOpen,
    forgotEmail, setForgotEmail,
    forgotStatus, forgotMessage,
    handleForgotPassword, closeForgotModal,
  } = useLogin();

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">

      {/* FULL-SCREEN BACKGROUND IMAGE */}
      <img
        src="/LoginPage.png"
        alt="ERP Platform"
        className="absolute inset-0 w-full h-full object-cover object-center"
        draggable={false}
      />

      {/* Very subtle dark vignette on right only */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to right, transparent 40%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* RIGHT LOGIN CARD */}
      <div className="relative z-10 w-full flex items-center justify-end pr-[6%]">
        <div className="w-full max-w-[400px]">

          <div
            className="rounded-3xl px-9 py-10 relative"
            style={{
              background: "linear-gradient(160deg, rgba(235,242,255,0.92) 0%, rgba(218,232,252,0.88) 100%)",
              backdropFilter: "blur(40px) saturate(150%)",
              WebkitBackdropFilter: "blur(40px) saturate(150%)",
              border: "1px solid rgba(255,255,255,0.80)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,1), 0 8px 32px rgba(100,140,200,0.15), 0 32px 64px rgba(80,120,180,0.12)",
            }}
          >

            {/* Heading */}
            <h2 className="text-[28px] font-bold text-center mb-2" style={{ color: "#0f1f3d" }}>
              Welcome Back
            </h2>
            <p className="text-[13px] text-center mb-8 leading-relaxed" style={{ color: "#5a7199" }}>
              Sign in to continue to your enterprise workspace
              <br />and manage operations seamlessly.
            </p>

            {/* Error banner */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-2xl border" style={{ background: "rgba(254,226,226,0.80)", borderColor: "rgba(252,165,165,0.50)" }}>
                <p className="text-sm font-medium" style={{ color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold mb-2 tracking-widest uppercase" style={{ color: "#4a6080" }}>
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8aaccc" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-2xl text-[13.5px] focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.75)",
                      border: "1.5px solid rgba(200,218,240,0.60)",
                      color: "#0f1f3d",
                      boxShadow: "0 2px 8px rgba(100,140,200,0.08)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.95)";
                      e.currentTarget.style.border = "1.5px solid rgba(37,99,235,0.50)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.75)";
                      e.currentTarget.style.border = "1.5px solid rgba(200,218,240,0.60)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(100,140,200,0.08)";
                    }}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold mb-2 tracking-widest uppercase" style={{ color: "#4a6080" }}>
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8aaccc" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-10 pr-11 rounded-2xl text-[13.5px] focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.75)",
                      border: "1.5px solid rgba(200,218,240,0.60)",
                      color: "#0f1f3d",
                      boxShadow: "0 2px 8px rgba(100,140,200,0.08)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.95)";
                      e.currentTarget.style.border = "1.5px solid rgba(37,99,235,0.50)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.75)";
                      e.currentTarget.style.border = "1.5px solid rgba(200,218,240,0.60)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(100,140,200,0.08)";
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#8aaccc" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#8aaccc"; }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-[12px] font-semibold transition-colors"
                    style={{ color: "#2563eb" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#1d4ed8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#2563eb"; }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Sign In */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(37,99,235,0.40), 0 1px 0 rgba(255,255,255,0.20) inset",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,99,235,0.55), 0 1px 0 rgba(255,255,255,0.20) inset";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.40), 0 1px 0 rgba(255,255,255,0.20) inset";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {isSubmitting ? "Logging in..." : (
                    <>
                      Log In
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Security note */}
            <div
              className="mt-7 pt-5 flex flex-col items-center gap-1.5"
              style={{ borderTop: "1px solid rgba(150,185,220,0.25)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="rgba(138,172,204,0.70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p className="text-[10.5px] text-center leading-relaxed" style={{ color: "#8aaccc" }}>
                Secure access to your organization's<br />critical data and operations.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL — logic unchanged */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && closeForgotModal()}
        >
          <div
            className="p-8 rounded-3xl w-[400px] relative"
            style={{
              background: "linear-gradient(160deg, rgba(235,242,255,0.96) 0%, rgba(218,232,252,0.94) 100%)",
              backdropFilter: "blur(40px) saturate(150%)",
              WebkitBackdropFilter: "blur(40px) saturate(150%)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 24px 64px rgba(80,120,180,0.20), inset 0 1px 0 rgba(255,255,255,1)",
            }}
          >
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-xl leading-none transition-colors"
              style={{ color: "#8aaccc" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#0f1f3d"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#8aaccc"; }}
            >
              ✕
            </button>

            <h2 className="text-[18px] font-bold mb-1" style={{ color: "#0f1f3d" }}>Reset Password</h2>
            <p className="text-[13px] mb-5" style={{ color: "#5a7199" }}>
              Enter your email address to receive a reset link.
            </p>

            {forgotStatus === "success" && (
              <p className="text-green-600 text-sm mb-3 font-medium">{forgotMessage}</p>
            )}
            {forgotStatus === "error" && (
              <p className="text-red-600 text-sm mb-3 font-medium">{forgotMessage}</p>
            )}

            {forgotStatus !== "success" && (
              <>
                <input
                  className="w-full px-4 py-3 rounded-2xl text-[13px] focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.80)",
                    border: "1.5px solid rgba(200,218,240,0.60)",
                    color: "#0f1f3d",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.98)";
                    e.currentTarget.style.border = "1.5px solid rgba(37,99,235,0.50)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.80)";
                    e.currentTarget.style.border = "1.5px solid rgba(200,218,240,0.60)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                <button
                  onClick={handleForgotPassword}
                  className="w-full mt-4 text-white py-3 rounded-2xl text-[13px] font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                    boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                  }}
                >
                  {forgotStatus === "loading" ? "Sending..." : "Send Link"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;