import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Loader2 } from "lucide-react";
import { getCompanyById } from "../api/companySetupApi";
import { getCurrencyList } from "../api/lookupApi";
import { useCompanyStore } from "../store/companyStore";
import { useAuth } from "../context/AuthContext";

import { ERP_BASE, ERP_FRONTEND, LMS_FRONTEND } from '../config/resolverUrls';
// const LMS_URL = import.meta.env.VITE_LMS_URL as string;

console.log("🚀 ~ LMS_FRONTEND:", LMS_FRONTEND)
console.log("🚀 ~ ERP_FRONTEND:", ERP_FRONTEND)
console.log("🚀 ~ ERP_BASE:", ERP_BASE)

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;

const SelectApp = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loadingTile, setLoadingTile] = useState<"erp" | "lms" | null>(null);

    const handleErpClick = async () => {
        setLoadingTile("erp");
        try {
            const companyRes = await getCompanyById(COMPANY_ID);
            const company = companyRes?.data;

            const currencies = await getCurrencyList({ search: company?.baseCurrency });
            const matchedCurrency = currencies.find((c) => c.name === company?.baseCurrency);

            useCompanyStore.getState().setCompanyInfo({
                companyName: company?.companyName,
                baseCurrency: company?.baseCurrency,
                currencySymbol: matchedCurrency?.symbol || company?.baseCurrency || "",
                domain: company?.primaryBusinessDomain ?? "",
                industryType: company?.industryType ?? "",
                companyAddress: company?.address || {},
            });

            navigate("/dashboard");
        } catch (err) {
            console.error("Failed to load company info:", err);
            setLoadingTile(null);
            navigate("/dashboard");
        }
    };

    const handleLmsClick = () => {
        setLoadingTile("lms");
        const sid = user?.sid || localStorage.getItem("session_id");   // ← fallback
        window.location.href = `${LMS_FRONTEND}?sid=${encodeURIComponent(sid ?? "")}`;
    };

  return (
  <div className="h-screen w-screen flex items-center justify-center bg-white">
    <div className="w-full max-w-[560px] px-6">
      <div
        className="rounded-3xl px-9 py-10"
        style={{
          background:
            "linear-gradient(160deg, rgba(235,242,255,0.92) 0%, rgba(218,232,252,0.88) 100%)",
          backdropFilter: "blur(40px) saturate(150%)",
          WebkitBackdropFilter: "blur(40px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.80)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,1), 0 8px 32px rgba(100,140,200,0.15), 0 32px 64px rgba(80,120,180,0.12)",
        }}
      >
                        <h2 className="text-[26px] font-bold text-center mb-2" style={{ color: "#0f1f3d" }}>
                            Choose your workspace
                        </h2>
                        <p className="text-[13px] text-center mb-8" style={{ color: "#5a7199" }}>
                            You have access to more than one application.
                        </p>

                        <div className="grid grid-cols-2 gap-5">
                            <button
                                onClick={handleErpClick}
                                disabled={loadingTile !== null}
                                className="flex flex-col items-center gap-3 rounded-2xl py-8 transition-all disabled:opacity-60"
                                style={{
                                    background: "rgba(255,255,255,0.75)",
                                    border: "1.5px solid rgba(200,218,240,0.60)",
                                }}
                            >
                                {loadingTile === "erp" ? (
                                    <>
                                        <Loader2 size={32} color="#2563eb" className="animate-spin" />
                                        <span className="text-[13px] font-semibold" style={{ color: "#5a7199" }}>
                                            Loading workspace…
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Building2 size={32} color="#2563eb" />
                                        <span className="text-[14px] font-bold" style={{ color: "#0f1f3d" }}>
                                            ERP
                                        </span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleLmsClick}
                                disabled={loadingTile !== null}
                                className="flex flex-col items-center gap-3 rounded-2xl py-8 transition-all disabled:opacity-60"
                                style={{
                                    background: "rgba(255,255,255,0.75)",
                                    border: "1.5px solid rgba(200,218,240,0.60)",
                                }}
                            >
                                {loadingTile === "lms" ? (
                                    <>
                                        <Loader2 size={32} color="#2563eb" className="animate-spin" />
                                        <span className="text-[13px] font-semibold" style={{ color: "#5a7199" }}>
                                            Redirecting to LMS…
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <GraduationCap size={32} color="#2563eb" />
                                        <span className="text-[14px] font-bold" style={{ color: "#0f1f3d" }}>
                                            LMS
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default SelectApp;