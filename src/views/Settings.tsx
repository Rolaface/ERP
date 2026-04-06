import React, { useState } from "react";
import {
  FaCogs,
  FaPalette,
  FaGlobe,
  FaShieldAlt,
  FaBell,
  FaSave,
  FaUndo,
  FaCheckCircle,
} from "react-icons/fa";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppSurface,
  AppTabs,
} from "../components/ui/app-shell";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [showSuccess, setShowSuccess] = useState(false);
  const [taxRate, setTaxRate] = useState(10);
  const [currency, setCurrency] = useState("USD");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("Cash");

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tabs = [
    { id: "general", label: "General Settings", icon: <FaGlobe /> },
    { id: "appearance", label: "Appearance", icon: <FaPalette /> },
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    { id: "security", label: "Security", icon: <FaShieldAlt /> },
  ];

  return (
    <AppPage>
      <AppPageHeader
        title="System Settings"
        description="Manage your ERP configuration and preferences."
        icon={<FaCogs />}
        actions={
          showSuccess ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-500">
              <span className="inline-flex items-center gap-2">
                <FaCheckCircle />
                Settings Saved
              </span>
            </div>
          ) : null
        }
      />
      <AppTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <AppPageBody className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-card hover:text-main"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <AppSurface className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h3 className="text-lg font-semibold capitalize text-main">
              {activeTab} Settings
            </h3>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-6 py-6">
            {activeTab === "general" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border)] bg-app px-4 py-3 text-main outline-none transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Base Currency
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-app px-4 py-3 text-main outline-none transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-app px-4 py-3 text-main outline-none transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Default Payment Method
                  </label>
                  <select
                    value={defaultPaymentMethod}
                    onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[var(--border)] bg-app px-4 py-3 text-main outline-none transition-all focus:ring-2 focus:ring-primary"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="rounded-xl border border-[var(--border)] bg-app p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-main">System Theme</h4>
                    <p className="text-sm text-muted">
                      Choose how the ERP looks for you.
                    </p>
                  </div>
                  <div className="origin-right scale-125">
                    <ThemeSwitcher />
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "security" || activeTab === "notifications") && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-row-hover text-3xl text-muted">
                  {activeTab === "security" ? <FaShieldAlt /> : <FaBell />}
                </div>
                <h4 className="font-semibold text-main">
                  Advanced {activeTab} control
                </h4>
                <p className="max-w-xs text-sm text-muted">
                  These modules will be available in the next system update.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--border)] bg-row-hover/20 px-6 py-4">
            <button className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-card">
              <FaUndo className="text-xs" /> Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              <FaSave /> Save Settings
            </button>
          </div>
        </AppSurface>
      </AppPageBody>
    </AppPage>
  );
};

export default Settings;
