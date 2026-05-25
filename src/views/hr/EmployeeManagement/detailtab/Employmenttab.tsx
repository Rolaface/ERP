import React, { useEffect, useState } from "react";
import {
  getAllDepartments,
  getAllLeavePolicies,
  getalluser,
  getEmployees,
} from "../../../../api/utils/frappeUtilsApi";
import { Briefcase, Calendar, User, Clock } from "lucide-react";
import { fmt, fmtDate } from "../detailtab/Employeehelpers";
import { Field, Section } from "../detailtab/Employeeuiprimitives";
import { resolveLabel } from "../../../../api/utils/labelResolver";

interface Props {
  emp: any;
}

export const EmploymentTab: React.FC<Props> = ({ emp }) => {
  const [reportingToLabel, setReportingToLabel] = useState("");
  const [departmentLabel, setDepartmentLabel] = useState("");

  const [leaveApproverLabel, setLeaveApproverLabel] = useState("");

  const [expenseApproverLabel, setExpenseApproverLabel] = useState("");

  const [shiftApproverLabel, setShiftApproverLabel] = useState("");

  const [leavePolicyLabel, setLeavePolicyLabel] = useState("");
  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: emp?.department,
        fetcher: getAllDepartments,
      });

      setDepartmentLabel(label);
    };

    loadLabel();
  }, [emp?.department]);
  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: emp?.leave_approver,
        fetcher: getalluser,
      });

      setLeaveApproverLabel(label);
    };

    loadLabel();
  }, [emp?.leave_approver]);
  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: emp?.expense_approver,
        fetcher: getalluser,
      });

      setExpenseApproverLabel(label);
    };

    loadLabel();
  }, [emp?.expense_approver]);
  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: emp?.shift_request_approver,
        fetcher: getalluser,
      });

      setShiftApproverLabel(label);
    };

    loadLabel();
  }, [emp?.shift_request_approver]);
  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: emp?.leave_policy,
        fetcher: getAllLeavePolicies,
      });

      setLeavePolicyLabel(label);
    };

    loadLabel();
  }, [emp?.leave_policy]);
  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: emp?.reports_to,
        fetcher: getEmployees,
      });

      setReportingToLabel(label);
    };

    loadLabel();
  }, [emp?.reports_to]);

  return (
    <div className="space-y-5">
      {/* ── Role & Assignment ── */}
      <Section
        title="Role & Assignment"
        icon={<Briefcase className="w-3.5 h-3.5" />}
      >
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <Field label="Designation" value={fmt(emp.designation)} />
          <Field
            label="Department"
            value={fmt(departmentLabel || emp.department)}
          />
          <Field label="Employee Type" value={fmt(emp.employment_type)} />
          <Field label="Grade" value={fmt(emp.grade)} />
          <Field label="Branch" value={fmt(emp.branch)} />
          <Field
            label="Reports To"
            value={fmt(reportingToLabel || emp.reports_to)}
          />
          <Field label="Company" value={fmt(emp.company)} />
        </div>
      </Section>

      {/* ── Dates & Contract ── */}
      <Section
        title="Dates & Contract"
        icon={<Calendar className="w-3.5 h-3.5" />}
      >
        <div className="grid grid-cols-3 gap-x-5 gap-y-4">
          <Field label="Date of Joining" value={fmtDate(emp.date_of_joining)} />
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
      <Section title="Approvers" icon={<User className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-3 gap-x-5 gap-y-4">
          <Field
            label="Leave Approver"
            value={fmt(leaveApproverLabel || emp.leave_approver)}
          />
          <Field
            label="Expense Approver"
            value={fmt(expenseApproverLabel || emp.expense_approver)}
          />
          <Field
            label="Shift Approver"
            value={fmt(shiftApproverLabel || emp.shift_request_approver)}
          />
        </div>
      </Section>

      {/* ── Leave ── */}
      <Section title="Leave" icon={<Clock className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <Field
            label="Leave Policy"
            value={fmt(leavePolicyLabel || emp.leave_policy)}
          />
          <Field label="Holiday List" value={fmt(emp.holiday_list)} />
          {/* <Field label="Default Shift" value={fmt(emp.default_shift)} /> */}
        </div>
      </Section>
    </div>
  );
};
