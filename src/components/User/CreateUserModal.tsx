import React, { useRef, useState, useEffect } from "react";
import { UserPlus, X } from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { useCreateUser } from "../../hooks/useCreateUser";
import type { CreateUserFormData } from "../../types/RoleManagement/CreateUser";
import { GENDER_OPTIONS } from "../../types/RoleManagement/CreateUser";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import DatePickerInput from "../calendar/DatePickerInput";
import RoleMultiSelect from "../ui/modal/RoleMultiSelect";
import { getUserById } from "../../api/RoleManagement/CreateUserApi";

const TIMEZONES = [
  "Africa/Casablanca", "Europe/Rome", "Europe/Paris", "America/Aruba", "Asia/Baghdad",
  "Pacific/Wallis", "Europe/Athens", "Pacific/Apia", "Africa/Mbabane", "Asia/Ulaanbaatar",
  "Asia/Chongqing", "America/Kentucky/Louisville", "Indian/Christmas", "Europe/Jersey",
  "Africa/Luanda", "Africa/Kinshasa", "Europe/Volgograd", "America/Dominica",
  "Australia/Lord_Howe", "America/Nipigon", "Asia/Seoul", "Europe/Kaliningrad",
  "Indian/Cocos", "Australia/Perth", "Asia/Barnaul", "America/Fortaleza",
  "Pacific/Noumea", "HST", "Europe/Tallinn", "America/Danmarkshavn", "Europe/Malta",
  "America/Cambridge_Bay", "Asia/Gaza", "Europe/Istanbul", "America/Chicago",
  "Asia/Urumqi", "Europe/Busingen", "America/Swift_Current", "Africa/Dar_es_Salaam",
  "Africa/Sao_Tome", "Asia/Phnom_Penh", "Europe/Vatican", "Pacific/Easter", "Etc/GMT+5",
  "Africa/Brazzaville", "America/Guadeloupe", "Asia/Kuala_Lumpur",
  "America/Indiana/Marengo", "Etc/GMT+8", "America/Bogota", "Pacific/Gambier",
  "America/Rankin_Inlet", "America/St_Thomas", "Africa/Accra", "Pacific/Johnston",
  "Antarctica/Rothera", "America/Bahia_Banderas", "Africa/Bangui", "America/Guayaquil",
  "Asia/Kolkata", "America/Mexico_City", "America/Recife", "Atlantic/St_Helena",
  "America/Vancouver", "America/Virgin", "Australia/Lindeman", "America/Manaus",
  "America/Puerto_Rico", "Asia/Anadyr", "America/Port-au-Prince",
  "America/Argentina/Jujuy", "America/Ciudad_Juarez", "Indian/Mahe", "Pacific/Kosrae",
  "Asia/Tbilisi", "Asia/Magadan", "Asia/Atyrau", "UTC", "America/Glace_Bay",
  "Asia/Samarkand", "Europe/Monaco", "Africa/Bujumbura", "Asia/Jerusalem",
  "Pacific/Norfolk", "America/Regina", "Pacific/Saipan", "Asia/Dubai", "Africa/Abidjan",
  "America/North_Dakota/Center", "Europe/Vienna", "Africa/Niamey", "America/Caracas",
  "America/Juneau", "America/Detroit", "Europe/Mariehamn", "Etc/GMT+4",
  "America/Shiprock", "Africa/Banjul", "Pacific/Funafuti",
];


const fetchTimezoneOptions = async (search: string) => {
  const q = search.toLowerCase();
  return TIMEZONES
    .filter((tz) => !q || tz.toLowerCase().includes(q))
    .map((tz) => ({ value: tz, label: tz }));
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserFormData) => Promise<void> | void;
  initialData?: CreateUserFormData | null;
  isEditMode?: boolean;
  modalId: string;
}



const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <p className="text-[11px] font-bold text-main uppercase tracking-widest mb-3 pt-1">
    {title}
  </p>
);

// ─── Role pills + SearchSelect2 ───────────────────────────────────────────────

interface RolePickerProps {
  selected: string[];
  selectedLabels: Record<string, string>;
  fetchRoles: (q: string) => Promise<{ value: string; label: string }[]>;
  onAdd: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onDirty: () => void;
}

const RolePicker: React.FC<RolePickerProps> = ({
  selected,
  selectedLabels,
  fetchRoles,
  onAdd,
  onRemove,
  onDirty,
}) => {

  const fetchFiltered = React.useCallback(
    async (q: string) => {
      const all = await fetchRoles(q);
      return all.filter((opt) => !selected.includes(opt.value));
    },
    [fetchRoles, selected]
  );

  return (
    <div className="flex items-start gap-2">
      <div className="w-[140px] shrink-0">
        <SearchSelect2
          label=""
          value=""
          onChange={(val, opt) => {
            if (!val) return;
            onAdd(val, opt.label);
            onDirty();
          }}
          fetchOptions={fetchFiltered}
          placeholder="Search role..."
        />
      </div>
      {selected.length > 0 && (
        <div className="flex flex-nowrap gap-1.5 pt-1 ">
          {selected.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {selectedLabels[id] ?? id}
              <button type="button" onClick={() => { onRemove(id); onDirty(); }} className="hover:text-[var(--danger)] transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
}) => {
  const resolvedModalId = useRef(modalId).current;
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [languageLabel, setLanguageLabel] = useState(initialData?.language ?? "");
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  const {
    form,
    errors,
    isSubmitting,
    selectedRoleLabels,
    fetchLanguages,
    fetchRoles,
    handleFieldChange,
    addRole,
    removeRole,
    handleSubmit,
    handleReset,
  } = useCreateUser({ onSubmit, onClose, initialData: initialData ?? null });

  useEffect(() => {
    if (!isOpen || !isEditMode || !initialData?.id) return;

    setIsFetchingUser(true);
    getUserById(initialData.id)
      .then((res) => {
        const d = res.message.data;
        const mapped: CreateUserFormData = {
          id: d.id,
          email: d.email,
          username: d.username,
          language: d.language,
          firstName: d.firstName,
          middleName: d.middleName,
          lastName: d.lastName,
          gender: d.gender,
          phone: d.phone,
          dob: d.dob ?? "",
          timezone: d.timezone,
          mobile_no: d.mobile_no ?? "",
          roleIds: d.roles,
        };
        handleReset();
        Object.entries(mapped).forEach(([k, v]) =>
          handleFieldChange(k as keyof CreateUserFormData, v as never)
        );
        d.roles.forEach((r) => addRole(r, r));
        fetchLanguages("")
          .then((langs) => {
            const matched = langs.find(
              (l) => l.value === d.language
            );

            setLanguageLabel(
              matched?.label ?? d.language
            );
          })
          .catch(() => {
            setLanguageLabel(d.language);
          });
      })
      .catch(() => {/* silently fail, form stays empty */ })
      .finally(() => setIsFetchingUser(false));
  }, [isOpen, isEditMode, initialData?.id]);


  const dirty = <K extends keyof CreateUserFormData>(
    field: K,
    value: CreateUserFormData[K]
  ) => {
    handleFieldChange(field, value);
    markDirty();
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={() => { handleReset(); resetDirty(); }}
        className="px-4 py-2 text-sm font-medium text-muted border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
      >
        Reset
      </button>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
          className="px-4 py-2 text-sm font-medium text-main border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm shadow-primary/20 hover:opacity-90 transition-all ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
        >
          {isSubmitting ? "Creating..." : isEditMode ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={isEditMode ? "Edit User" : "Create New User"}
      subtitle="Fill in the details to create a new user account"
      icon={UserPlus}
      footer={footer}
      maxWidth="4xl"
      height="80vh"
    >
      <div className="h-full flex flex-col">
        {isFetchingUser ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-muted">Loading user...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-5 pb-2">

            {/* ── Account Information ───────────────────────────────────── */}
            <div>
              <SectionHeader title="Account Information" />
              <div className="grid grid-cols-4 gap-x-4 gap-y-3 items-start">

                <ModalInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => dirty("email", e.target.value)}
                  required
                  error={errors.email}
                  autoComplete="off"
                  disabled={isEditMode}
                />

                <ModalInput
                  label="Username"
                  type="text"
                  value={form.username}
                  onChange={(e) => dirty("username", e.target.value)}
                  required
                  error={errors.username}
                  autoComplete="off"
                />


                <div>
                  <span className="block text-[10px] font-medium text-main mb-1">Language</span>
                  <SearchSelect2
                    label=""
                    value={languageLabel}
                    onChange={(val, opt) => {
                      dirty("language", val);                      // form stores "bs"
                      setLanguageLabel(opt.label);                 // display stores "Bosanski"
                    }}
                    fetchOptions={fetchLanguages}
                    placeholder="Search language..."
                  />
                </div>

                <div>
                  <span className="block text-[10px] font-medium text-main mb-1">
                    Timezone
                  </span>
                  <SearchSelect2
                    label=""
                    value={form.timezone ?? ""}
                    onChange={(val) => dirty("timezone", val)}
                    fetchOptions={fetchTimezoneOptions}
                    placeholder="Search timezone..."
                  />
                </div>

              </div>

              {/* ── Assign Roles ──────────────────────────────────────────── */}
              <div className="mt-5 w-[350px]">
                <SectionHeader title="Assign Roles" />
                <RoleMultiSelect
                  selected={form.roleIds}
                  selectedLabels={selectedRoleLabels}
                  fetchRoles={fetchRoles}
                  onAdd={addRole}
                  onRemove={removeRole}
                  onDirty={markDirty}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border)]" />

            {/* ── Personal Information ──────────────────────────────────── */}
            <div>
              <SectionHeader title="Personal Information" />
              <div className="grid grid-cols-4 gap-x-4 gap-y-3">

                <ModalInput
                  label="First Name"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => dirty("firstName", e.target.value)}
                  placeholder="First name"
                  required
                  error={errors.firstName}
                />

                <ModalInput
                  label="Middle Name"
                  type="text"
                  value={form.middleName ?? ""}
                  onChange={(e) => dirty("middleName", e.target.value)}
                  placeholder="Middle name"
                />

                <ModalInput
                  label="Last Name"
                  type="text"
                  value={form.lastName ?? ""}
                  onChange={(e) => dirty("lastName", e.target.value)}
                  placeholder="Last name"
                />

                <ModalSelect
                  label="Gender"
                  value={form.gender ?? ""}
                  onChange={(e) => dirty("gender", e.target.value)}
                  placeholder="Select gender"
                  options={GENDER_OPTIONS.map((g) => ({ label: g, value: g }))}
                />


                <DatePickerInput
                  label="Date of Birth"
                  name="dob"
                  value={form.dob ?? ""}
                  onChange={(_name, value) => dirty("dob", value)}
                />

                <ModalInput
                  label="Phone"
                  type="tel"
                  value={form.phone ?? ""}
                  onChange={(e) => dirty("phone", e.target.value)}
                  placeholder="Phone number"
                />


                <ModalInput
                  label="Mobile No"
                  type="tel"
                  value={form.mobile_no ?? ""}
                  onChange={(e) => dirty("mobile_no", e.target.value)}
                  placeholder="Mobile number"
                />

              </div>
            </div>
          </div>
        )}
      </div>
    </MinimizableModal>
  );
};

export default CreateUserModal;