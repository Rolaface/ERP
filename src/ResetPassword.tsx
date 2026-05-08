import React, { useState } from "react";
import { resetPasswordApi } from "../src/api/authService";

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await resetPasswordApi(email);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleReset}
        className="p-6 bg-white shadow-md rounded w-96 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Reset Password</h2>

        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-600">{message}</p>}

        <input
          type="text"
          placeholder="Enter username"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          Send Reset Link
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
