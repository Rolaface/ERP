import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCompanyById } from "../api/companySetupApi";
import { useCompanyStore } from "../store/companyStore";
import { resetPasswordApi } from "../api/authService";
import { getCurrencyList }
  from "../api/lookupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

export const useLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [forgotMessage, setForgotMessage] = useState("");

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotStatus("error");
      setForgotMessage("Please enter your email address.");
      return;
    }

    setForgotStatus("loading");
    setForgotMessage("");

    try {
      const res = await resetPasswordApi(forgotEmail.trim());
      setForgotStatus("success");
      setForgotMessage(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setForgotStatus("error");
      setForgotMessage(
        msg === "RESET_FAILED"
          ? "Could not send reset link. Please try again."
          : msg
      );
    }
  };

  const closeForgotModal = () => {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotStatus("idle");
    setForgotMessage("");
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      // 1. login
      await login(email, password);

      // 2. fetch company
      const companyRes = await getCompanyById(COMPANY_ID);
      const company = companyRes?.data;

      // 3. store in zustand
const { setCompanyInfo } =
  useCompanyStore.getState();

const currencies =
  await getCurrencyList({
    search:
      company?.baseCurrency,
  });

const matchedCurrency =
  currencies.find(
    (c) =>
      c.name ===
      company?.baseCurrency,
  );

setCompanyInfo({
  companyName:
    company?.companyName,

  baseCurrency:
    company?.baseCurrency,

  currencySymbol:
    matchedCurrency?.symbol ||
    company?.baseCurrency ||
    "",
    domain: company?.primaryBusinessDomain ?? "",   
  industryType: company?.industryType ?? "",    
companyAddress:
  company?.address || {},
});




      // 4. navigate
      navigate("/dashboard");

    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};