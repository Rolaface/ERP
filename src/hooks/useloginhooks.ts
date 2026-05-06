import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCompanyById } from "../api/companySetupApi";
import { useCompanyStore } from "../store/companyStore";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

export const useLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const { setCompanyInfo } = useCompanyStore.getState();

  setCompanyInfo({
    companyName: company?.companyName,
    baseCurrency: company?.baseCurrency, 
    companyAddress: `${company?.address?.addressLine1}, ${company?.address?.city}, ${company?.address?.country}`,
  });

  console.log("Stored baseCurrency:", company?.baseCurrency);

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
  };
};