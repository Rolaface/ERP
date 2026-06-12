import React from "react";
import { UserPlus } from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import type { CreateUserFormData } from "../../types/RoleManagement/CreateUser";


interface UserDetailsViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    modalId: string;
    form: CreateUserFormData;
    languageLabel: string;
    selectedRoleLabels: Record<string, string>;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <p className="text-[11px] font-bold text-main uppercase tracking-widest mb-3 pt-1">
        {title}
    </p>
);

const InfoRow: React.FC<{
    label: string;
    value?: string | null;
}> = ({ label, value }) => (
    <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {label}
        </div>

        <div className="text-sm text-main break-words">
            {value || "—"}
        </div>
    </div>
);

const InfoSection: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => (
    <div>
        <SectionHeader title={title} />

        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--card-bg)]">
            {children}
        </div>
    </div>
);

const RoleBadge: React.FC<{
    label: string;
}> = ({ label }) => (
    <span className="px-3 py-1 rounded-full text-xs font-medium border border-primary/20 bg-primary/10 text-primary">
        {label}
    </span>
);

const UserProfileCard: React.FC<{
    name: string;
    email: string;
    username: string;
}> = ({ name, email, username }) => (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
                <div className="font-semibold text-main text-lg">
                    {name || username}
                </div>

                <div className="text-sm text-muted">
                    {email}
                </div>

                <div className="text-xs text-muted mt-1">
                    Username: {username}
                </div>
            </div>
        </div>
    </div>
);

const UserDetailsViewModal: React.FC<UserDetailsViewModalProps> = ({
    isOpen,
    onClose,
    modalId,
    form,
    languageLabel,
    selectedRoleLabels,
}) => {

    const fullName = [
        form.firstName,
        form.middleName,
        form.lastName,
    ]
        .filter(Boolean)
        .join(" ");

    const footer = (
        <div className="flex justify-end w-full">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-main border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
            >
                Close
            </button>
        </div>
    );

    return (
        <MinimizableModal
            modalId={modalId}
            isOpen={isOpen}
            onClose={onClose}
            title="View User"
            subtitle="User information"
            icon={UserPlus}
            footer={footer}
            maxWidth="4xl"
            height="80vh"
        >
            <div className="space-y-5 overflow-y-auto">

                <UserProfileCard
                    name={fullName}
                    email={form.email}
                    username={form.username}
                />

                <InfoSection title="Account Information">
                    <div className="grid grid-cols-2 gap-6">

                        <InfoRow
                            label="Language"
                            value={languageLabel}
                        />

                        <InfoRow
                            label="Timezone"
                            value={form.timezone}
                        />

                    </div>
                </InfoSection>

                <InfoSection title="Personal Information">
                    <div className="grid grid-cols-2 gap-6">

                        <InfoRow
                            label="Full Name"
                            value={fullName}
                        />

                        <InfoRow
                            label="Gender"
                            value={form.gender}
                        />

                        <InfoRow
                            label="Date of Birth"
                            value={form.dob}
                        />

                        <InfoRow
                            label="Phone"
                            value={form.phone}
                        />

                        <InfoRow
                            label="Mobile No"
                            value={form.mobile_no}
                        />

                    </div>
                </InfoSection>

                <InfoSection title="Assigned Roles">

                    <div className="mb-4 text-sm text-muted">
                        Total Roles: {form.roleIds.length}
                    </div>

                    <div className="flex flex-wrap gap-2">

                        {form.roleIds.map((roleId) => (
                            <RoleBadge
                                key={roleId}
                                label={selectedRoleLabels[roleId] ?? roleId}
                            />
                        ))}

                    </div>

                </InfoSection>

            </div>
        </MinimizableModal>
    );
};



export default UserDetailsViewModal;