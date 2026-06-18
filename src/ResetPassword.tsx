import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmResetPasswordApi } from "./api/authService";
import { Eye, EyeOff } from "lucide-react";
import { showValidationError, showApiError } from "./utils/alert";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key") ?? "";
  const [new_password, setNewPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!key) {
      showValidationError("Reset link is invalid or expired.");
      return;
    }

    try {
      const res = await confirmResetPasswordApi(key, new_password, confirm_password);
      setMessage(res.message ?? "Password reset successfully.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      showApiError(err);
    }
  };
  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleReset}
        className="p-6 bg-white shadow-md rounded w-96 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Reset Password</h2>

        {message && <p className="text-green-600">{message}</p>}

        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            className="w-full border p-2 rounded pr-10"
            value={new_password}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-2.5 text-gray-500"
          >
            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full border p-2 rounded pr-10"
            value={confirm_password}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-2.5 text-gray-500"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          Confirm
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;