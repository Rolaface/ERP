import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmResetPasswordApi } from "./api/authService";
import { Eye, EyeOff, Lock, CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";

const PASSWORD_MIN_LENGTH = 7;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-]/;
const UPPERCASE_REGEX = /[A-Z]/;

const extractBackendMessage = (err: any): string => {
  const directMessage = err?.response?.data?.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  const serverMessages = err?.response?.data?._server_messages;
  if (typeof serverMessages === "string") {
    try {
      const parsedArray = JSON.parse(serverMessages);
      const parsedFirst = JSON.parse(parsedArray[0]);
      if (typeof parsedFirst?.message === "string") {
        return parsedFirst.message.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    } catch {
      // fall through to generic message below
    }
  }

  return "Something went wrong. Please try again.";
};

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key") ?? "";
  const [new_password, setNewPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checks = [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: new_password.length >= PASSWORD_MIN_LENGTH },
    { label: "At least one special character", met: SPECIAL_CHAR_REGEX.test(new_password) },
    { label: "At least one uppercase letter", met: UPPERCASE_REGEX.test(new_password) },
  ];

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!key) {
      setError("Reset link is invalid or expired.");
      return;
    }

    if (!checks.every((c) => c.met)) {
      setError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long, include at least one special character, and at least one uppercase letter.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmResetPasswordApi(key, new_password, confirm_password);
      setMessage("Password reset successfully.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(extractBackendMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f6f3] px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ff7a3d] via-[#ff9a6a] to-[#f76733]" />

        <form onSubmit={handleReset} className="p-5 sm:p-8 space-y-4 sm:space-y-5">
          <div className="flex flex-col items-center text-center space-y-2 mb-2">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#fff1ea] flex items-center justify-center">
              <Lock className="h-5 w-5 text-[#f76733]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-xs sm:text-sm text-gray-500 px-2">
              Choose a new password to secure your account.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm rounded-lg px-3 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm rounded-lg px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="break-words">{message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="w-full h-11 border border-gray-300 rounded-lg pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#f76733]/40 focus:border-[#f76733] transition"
                value={new_password}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="space-y-1 pt-1">
              {checks.map((c) => (
                <div
                  key={c.label}
                  className={`flex items-center gap-1.5 text-xs ${c.met ? "text-green-600" : "text-gray-400"}`}
                >
                  {c.met ? <CheckCircle2 size={13} className="flex-shrink-0" /> : <Circle size={13} className="flex-shrink-0" />}
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                className="w-full h-11 border border-gray-300 rounded-lg pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#f76733]/40 focus:border-[#f76733] transition"
                value={confirm_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#f76733] hover:bg-[#e85d2b] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Resetting...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;