import React from "react";
import { Briefcase, Calendar, User, Clock } from "lucide-react";
import { fmt, fmtDate } from "../detailtab/Employeehelpers";
import { Field, Section } from "../detailtab/Employeeuiprimitives";

interface Props {
  emp: any;
}

export const EmploymentTab: React.FC<Props> = ({ emp }) => (
  <div className="space-y-5">
    {/* ── Role & Assignment ── */}
    <Section
      title="Role & Assignment"
      icon={<Briefcase className="w-3.5 h-3.5" />}
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Field label="Designation" value={fmt(emp.designation)} />
        <Field label="Department" value={fmt(emp.department)} />
        <Field label="Employee Type" value={fmt(emp.employment_type)} />
        <Field label="Grade" value={fmt(emp.grade)} />
        <Field label="Branch" value={fmt(emp.branch)} />
        <Field label="Reports To" value={fmt(emp.reports_to)} />
        <Field label="Company" value={fmt(emp.company)} />
      </div>
    </Section>

    {/* ── Dates & Contract ── */}
    <Section
      title="Dates & Contract"
      icon={<Calendar className="w-3.5 h-3.5" />}
    >
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        <Field
          label="Date of Joining"
          value={fmtDate(emp.date_of_joining)}
        />
        {/* <Field
          label="Contract End"
          value={fmtDate(emp.contract_end_date)}
        /> */}
        {/* <Field
          label="Notice Period"
          value={
            emp.notice_number_of_days
              ? `${emp.notice_number_of_days} days`
              : null
          }
        /> */}
        {/* <Field
          label="Date of Retirement"
          value={fmtDate(emp.date_of_retirement)}
        /> */}
        {/* <Field label="Relieving Date" value={fmtDate(emp.relieving_date)} /> */}
      </div>
    </Section>

    {/* ── Approvers ── */}
    {/* <Section title="Approvers" icon={<User className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        <Field label="Leave Approver" value={fmt(emp.leave_approver)} />
        <Field label="Expense Approver" value={fmt(emp.expense_approver)} />
        <Field
          label="Shift Approver"
          value={fmt(emp.shift_request_approver)}
        />
      </div>
    </Section> */}

    {/* ── Leave ── */}
    <Section title="Leave" icon={<Clock className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Field label="Leave Policy" value={fmt(emp.leave_policy)} />
        <Field label="Holiday List" value={fmt(emp.holiday_list)} />
        {/* <Field label="Default Shift" value={fmt(emp.default_shift)} /> */}
      </div>
    </Section>
  </div>
);