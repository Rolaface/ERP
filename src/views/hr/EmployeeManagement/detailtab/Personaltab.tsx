import React from "react";
import { User, Mail, Shield, CreditCard } from "lucide-react";
import { fmt, fmtDate } from "../detailtab/Employeehelpers";
import { Field, Section } from "../detailtab/Employeeuiprimitives";

interface Props {
  emp: any;
  fullName: string;
}

export const PersonalTab: React.FC<Props> = ({ emp, fullName }) => (
  <div className="space-y-5">
    {/* ── Personal Info ── */}
    <Section title="Personal Info" icon={<User className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        <Field label="Full Name" value={fullName} className="col-span-2" />
        <Field label="Gender" value={fmt(emp.gender)} />
        <Field label="Date of Birth" value={fmtDate(emp.date_of_birth)} />
        <Field label="Marital Status" value={fmt(emp.marital_status)} />
        <Field label="Blood Group" value={fmt(emp.blood_group)} />
        <Field label="Salutation" value={fmt(emp.salutation)} />
      </div>
    </Section>

    {/* ── Contact ── */}
    <Section title="Contact" icon={<Mail className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Field label="Personal Email" value={fmt(emp.personal_email)} />
        <Field label="Company Email" value={fmt(emp.company_email)} />
        <Field label="Cell Number" value={fmt(emp.cell_number)} />
        <Field
          label="Preferred Email"
          value={fmt(emp.prefered_email) || fmt(emp.prefered_contact_email)}
        />
        <Field
          label="Current Address"
          value={fmt(emp.current_address)}
          className="col-span-2"
        />
        <Field
          label="Permanent Address"
          value={fmt(emp.permanent_address)}
          className="col-span-2"
        />
      </div>
    </Section>

    {/* ── Emergency Contact ── */}
    <Section title="Emergency Contact" icon={<Shield className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        <Field label="Contact Name" value={fmt(emp.person_to_be_contacted)} />
        <Field label="Relationship" value={fmt(emp.relation)} />
        <Field label="Phone" value={fmt(emp.emergency_phone_number)} />
      </div>
    </Section>

    {/* ── Identity & Compliance ── */}
    <Section
      title="Identity & Compliance"
      icon={<CreditCard className="w-3.5 h-3.5" />}
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Field label="Passport Number" value={fmt(emp.passport_number)} mono />
        <Field label="Place of Issue" value={fmt(emp.place_of_issue)} />
        <Field label="Date of Issue" value={fmtDate(emp.date_of_issue)} />
        <Field label="Valid Upto" value={fmtDate(emp.valid_upto)} />
        <Field
          label="Health Insurance"
          value={fmt(emp.health_insurance_provider)}
        />
        <Field
          label="Insurance No."
          value={fmt(emp.health_insurance_no)}
          mono
        />
      </div>
    </Section>
  </div>
);