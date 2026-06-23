import React from "react";
import { UserPlus } from "lucide-react";
import type { CreateUserFormData } from "../../types/RoleManagement/CreateUser";

interface UserDetailsViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    modalId: string;
    form: CreateUserFormData;
    languageLabel: string;
    selectedRoleLabels: Record<string, string>;
}

const F: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div>
        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 1 }}>
            {label}
        </p>
        <p style={{ fontSize: 13, color: value ? "var(--text)" : "var(--muted)", fontWeight: 500, lineHeight: 1.3 }}>
            {value || "—"}
        </p>
    </div>
);

const S: React.FC<{ title: string }> = ({ title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 7px" }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>
            {title}
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
);

const UserDetailsViewModal: React.FC<UserDetailsViewModalProps> = ({
    isOpen, onClose, form, languageLabel, selectedRoleLabels,
}) => {
    if (!isOpen) return null;

    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, zIndex: 999,
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(2px)",
                    animation: "udv-fade .15s ease",
                }}
            />

            {/* Drawer */}
            <div style={{
                position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1000,
                width: "min(560px, 100vw)",
                background: "var(--card)",
                color: "var(--text)",
                display: "flex", flexDirection: "column",
                boxShadow: "-6px 0 32px rgba(0,0,0,0.15)",
                animation: "udv-slide .2s cubic-bezier(.4,0,.2,1)",
                overflow: "hidden",
            }}>
                <style>{`
                    @keyframes udv-fade  { from{opacity:0} to{opacity:1} }
                    @keyframes udv-slide { from{transform:translateX(48px);opacity:0} to{transform:translateX(0);opacity:1} }
                `}</style>

                {/* Header */}
                <div style={{
                    padding: "10px 14px", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "var(--card)", flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: "var(--primary)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div style={{ lineHeight: 1 }}>
                            <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                                User
                            </p>
                            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                                {fullName || form.username || "—"}
                            </p>
                        </div>
                    </div>

                    <button onClick={onClose} style={{
                        width: 26, height: 26, borderRadius: 6,
                        border: "1px solid var(--border)", background: "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--muted)",
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>

                    {/* Profile Card */}
                    <div style={{
                        padding: "12px 14px", borderRadius: 8,
                        border: "1px solid var(--border)", background: "var(--bg)",
                        display: "flex", alignItems: "center", gap: 12, marginBottom: 4,
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: "var(--primary)", opacity: 0.9,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0,
                        }}>
                            {(fullName || form.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{form.email}</p>
                            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{form.username}</p>
                        </div>
                    </div>

                    {/* Account Info */}
                    <S title="Account Information" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 7 }}>
                        <F label="Language" value={languageLabel} />
                        <F label="Timezone" value={form.timezone} />
                    </div>

                    {/* Personal Info */}
                    <S title="Personal Information" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 7 }}>
                        <F label="Full Name" value={fullName} />
                        <F label="Gender" value={form.gender} />
                        <F label="Date of Birth" value={form.dob} />
                        <F label="Phone" value={form.phone} />
                        <F label="Mobile No" value={form.mobile_no} />
                    </div>

                    {/* Roles */}
                    <S title={`Assigned Roles (${form.roleIds.length})`} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {form.roleIds.length === 0 ? (
                            <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>No roles assigned</p>
                        ) : form.roleIds.map((roleId) => (
                            <span key={roleId} style={{
                                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                color: "var(--primary)", background: "rgba(var(--primary-rgb, 192,132,61),0.1)",
                                border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                            }}>
                                {selectedRoleLabels[roleId] ?? roleId}
                            </span>
                        ))}
                    </div>

                    <div style={{ height: 12 }} />
                </div>
            </div>
        </>
    );
};

export default UserDetailsViewModal;