import { Eye, EyeOff, BarChart3, Brain, ShieldCheck, Zap , Lock , User, Users } from "lucide-react";import { motion } from "framer-motion";
import { useLogin } from "../hooks/useloginhooks";
import "../login.css";
import { useState } from "react";
const features = [
  // { icon: Shield, label: "Enterprise Security" },
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

  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f3] relative overflow-hidden">

<div className="fixed inset-0 pointer-events-none overflow-hidden bg-[#f8f6f3] z-0">

  {/* SOFT GLOW BACKGROUND */}
  <motion.div
    className="absolute w-[500px] h-[500px] bg-orange-400 rounded-full blur-3xl opacity-20"
    animate={{
      x: ["-10%", "15%", "-10%"],
      y: ["-10%", "10%", "-10%"],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />

  {/* SMALL FLOATING CUBES */}
  {Array.from({ length: 35 }).map((_, i) => (
    <motion.div
      key={i}
      className="absolute w-3 h-3 bg-[#f76733] rounded-sm shadow-sm opacity-60"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        x: [0, Math.random() * 40 - 20, 0],
        y: [0, Math.random() * -40 + 20, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  ))}

  {Array.from({ length: 25 }).map((_, i) => (
    <motion.div
      key={`p-${i}`}
      className="absolute w-1 h-1 bg-black rounded-full opacity-20"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        x: [0, 20, -20, 0],
        y: [0, -20, 20, 0],
      }}
      transition={{
        duration: 5 + Math.random() * 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  ))}

</div>

      <div className="relative z-10 w-[80%] max-w-8xl h-[550px] bg-gradient-to-br from-[#ff7a3d] via-[#ff9a6a] to-[#f76733] rounded-3xl shadow-2xl flex overflow-hidden">

  <div className="w-1/2 p-10 flex flex-col justify-center">

  <div className="flex items-center gap-3 mb-6">
    <div className="h-10 w-10 rounded-lg bg-[#f76733] flex items-center justify-center">
      <BarChart3 className="text-white h-5 w-5" />
    </div>
    <div>
      <p className="font-semibold text-lg text-gray-800">ERP</p>
      <p className="text-white text-xs">Enterprise Platform</p>
    </div>
  </div>

  <h2 className="text-2xl font-bold text-gray-800 mb-1">Login</h2>

  <p className="text-white text-sm mb-6">Sign in to continue</p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[hsl(0,84%,97%)] border border-[hsl(0,84%,90%)] animate-fade-in">
                <p className="text-sm text-[hsl(0,84%,60%)] font-medium">
                  {error}
                </p>
              </div>
            )}


  <form onSubmit={handleSubmit} className="space-y-4">

    <div>
      <label className="text-xs text-white mb-1 block">Email</label>
               

      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full h-10 border px-3 rounded-md"
        placeholder="Enter your email"
      />
    </div>

    <div>
      <div className="flex justify-between items-center">
                   

        <label className="text-xs text-white mb-1 block">
          Password
        </label>

        {/* 🔥 FORGOT BUTTON */}
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-xs text-[#1b64d1] hover:underline"
        >
          Forgot?
        </button>
      </div>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-10 border px-3 rounded-md pr-10"
          placeholder="Enter your password"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2 text-gray-500"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

    </div>
             

    <motion.button
      whileHover={{ scale: 1.05 }}
      type="submit"
      disabled={isSubmitting}
      className="w-full h-10 bg-white text-[#f76733] rounded-md "
    >
      {isSubmitting ? "Loading..." : "Login"}
    </motion.button>

  </form>

 {/* ================= FORGOT PASSWORD MODAL ================= */}

</div>

        {/* RIGHT */}
  {/* RIGHT SIDE */}
<div className="w-1/2 relative flex items-center justify-center overflow-hidden">

  {/* BIG ORANGE CIRCLE BACKGROUND */}
  <div
    className="absolute bg-white w-[800px] h-[800px] rounded-full right-[-280px] top-1/2 -translate-y-1/2"
   
  />

  {/* LIGHT DOT PATTERN (TOP RIGHT) */}
  <div className="absolute right-0 top-0 w-full h-full">
    <div className="absolute right-10 top-10 grid grid-cols-6 gap-2 opacity-20">
      {Array.from({ length: 36 }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
      ))}
    </div>
  </div>

  {/* FAINT CIRCLE LINES (DECOR) */}
  <div className="absolute right-[-120px] top-10 w-[300px] h-[300px] border border-white/20 rounded-full" />
  <div className="absolute right-[-180px] bottom-10 w-[200px] h-[200px] border border-white/10 rounded-full" />

  {/* MAIN CONTENT */}
  <div className="relative z-10 text-black w-[360px] text-center">

    {/* POWERED BY */}
    <div className="flex items-center gap-3 mb-6">
  <div className="flex-1 h-[1px] bg-black/40" />
  
  <span className="text-[11px] tracking-[3px] text-black/90">
    POWERED BY
  </span>
  
  <div className="flex-1 h-[1px] bg-black/40" />
</div>

    {/* LOGOS STACK */}
    <div className="flex flex-col items-center gap-3">


      {/* ROLAFACE LOGO */}
      <img
        src="/rolafaceLogo.png"
        alt="RolaFace"
        className="w-52 object-contain drop-shadow-xl"
      />

      {/* AMPERSAND */}
      <div className="text-2xl font-light leading-none opacity-80">
        &
      </div>

      {/* iZYANE LOGO */}
      <img
        src="/iZyaneLogo.png"
        alt="iZyane"
        className="w-52 object-contain drop-shadow-xl"
      />
    </div>

    {/* TITLE BOX STYLE */}
    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-5">

  <h1 className="text-lg text-gray-900 font-semibold mb-2">
    Unified Business Operations
  </h1>

  <p className="text-xs text-gray-600 opacity-80 leading-relaxed">
    Manage all your business operations in one place — from finance and inventory to HR and analytics. 
  </p>

</div>

    {/* FEATURES */}

{/* FEATURES */}
<div className="flex justify-evenly mt-6 text-xs text-black">

  <div className="flex flex-col items-center gap-1">
    <BarChart3 className="w-5 h-5 text-black opacity-90" />
    <span className="text-black opacity-90">Scalable</span>
  </div>

  <div className="flex flex-col items-center gap-1">
    <Brain className="w-5 h-5 text-black opacity-90" />
    <span className="text-black opacity-90">AI Powered</span>
  </div>

  <div className="flex flex-col items-center gap-1">
    <ShieldCheck className="w-5 h-5 text-black opacity-90" />
    <span className="text-black opacity-90">Secure</span>
  </div>

  <div className="flex flex-col items-center gap-1">
    <Zap className="w-5 h-5 text-black opacity-90" />
    <span className="text-black opacity-90">Reliable</span>
  </div>

</div>

  </div>
</div>
      </div>

      {/* ================= MODAL (UNCHANGED) ================= */}
     {forgotOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={(e) => e.target === e.currentTarget && closeForgotModal()}
  >
    <div className="bg-white p-6 rounded-xl w-[400px] relative shadow-xl">

      <button
        onClick={closeForgotModal}
        className="absolute top-3 right-3 text-white"
      >
        ✕
      </button>

      <h2 className="text-lg font-bold mb-2">Reset Password</h2>

      <p className="text-sm text-white mb-4">
        Enter your email to receive reset link
      </p>

      {forgotStatus === "success" && (
        <p className="text-green-600 text-sm mb-3">{forgotMessage}</p>
      )}

      {forgotStatus === "error" && (
        <p className="text-red-600 text-sm mb-3">{forgotMessage}</p>
      )}

      {forgotStatus !== "success" && (
        <>
          <input
            className="w-full border p-2 rounded-md"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <button
            onClick={handleForgotPassword}
            className="w-full mt-4 bg-[#f76733] text-white p-2 rounded-md"
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

