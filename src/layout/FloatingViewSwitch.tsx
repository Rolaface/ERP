import React from "react";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHRView } from "../hooks/permission/useHRView";

const FloatingViewSwitch: React.FC = () => {
    const { viewMode, canSwitchView, toggleViewMode } = useHRView();
    const navigate = useNavigate();

    if (!canSwitchView) return null;

    const isEmployeeView = viewMode === "employee";


    const handleSwitch = () => {
        toggleViewMode();
        if (isEmployeeView) {
            navigate("/dashboard");        // switching TO professional → main dashboard
        } else {
            navigate("/hr/emp-dashboard"); // switching TO employee → employee dashboard
        }
    };

    return (
        <button
            type="button"
            onClick={handleSwitch}
            className={`
                fixed top-3 right-4 z-50
                flex items-center gap-2
                px-3 py-1.5 rounded-lg
                text-xs font-semibold
                border transition-all duration-200
                shadow-sm select-none whitespace-nowrap
                border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] 
                text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]
            `}
        >
            <ArrowLeftRight size={13} />
            {isEmployeeView ? "Switch to Professional View" : "Switch to Employee View"}
        </button>
    );
};

export default FloatingViewSwitch;