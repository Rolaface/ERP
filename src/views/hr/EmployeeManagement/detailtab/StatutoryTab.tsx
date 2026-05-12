import React from "react";
import { ShieldCheck } from "lucide-react";
import { fmt, fmtDate } from "../detailtab/Employeehelpers";
import { Field, Section } from "../detailtab/Employeeuiprimitives";

interface Props {
  emp: any;
}

export const StatutoryTab: React.FC<Props> = ({ emp }) => (
  <div className="space-y-5">
    <Section
      title="Statutory Information"
      icon={<ShieldCheck className="w-3.5 h-3.5" />}
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