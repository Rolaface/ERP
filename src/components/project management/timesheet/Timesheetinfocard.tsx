import React from "react";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import CustomerSelect from "../../../components/selects/CustomerSelect";
import { useCompanyDefaultsStore } from "../../../store/Companydefaultsstore";
import { fetchEmployeeOptions } from "../../../hooks/project_management/timeheet/form/useTimesheetModal";
import type { TimesheetModalRestrictions } from "../../../hooks/project_management/timeheet/form/useTimesheetModal";
import type {
  FetchProjects,
  TimesheetForm,
  TimesheetModalState,
} from "../../../types/Project_Management/Timesheet/form/Timesheetformmodal";

const GRID_COLUMNS = "grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr_96px]";
const GRID_COLUMNS_WITH_RATE =
  "grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr_96px_112px]";

interface TimesheetInfoCardProps {
  form: TimesheetForm;
  title: string;
  restrictions?: TimesheetModalRestrictions;
  fetchProjects: FetchProjects;
  onTitleChange: (value: string) => void;
  onProject: TimesheetModalState["setProject"];
  onCustomer: TimesheetModalState["setCustomer"];
  onEmployee: TimesheetModalState["setEmployee"];
  periodField?: React.ReactNode;
}

const TimesheetInfoCard: React.FC<TimesheetInfoCardProps> = ({
  form,
  title,
  restrictions,
  fetchProjects,
  onTitleChange,
  onProject,
  onCustomer,
  onEmployee,
  periodField,
}) => {
  const companyCurrency =
    useCompanyDefaultsStore.getState().defaults?.default_currency;
  const showExchangeRate = form.currency && form.currency !== companyCurrency;

  return (
    <div className="bg-card border border-theme rounded-xl p-4 shrink-0">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-theme">
        <span className="text-[11px] font-bold text-main uppercase tracking-wider">
          Timesheet Information
        </span>
      </div>

      <div
        className={`ts-info grid gap-4 items-end ${showExchangeRate ? GRID_COLUMNS_WITH_RATE : GRID_COLUMNS}`}
      >
        <div>
          <ModalInput
            label="Title"
            name="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Timesheet title"
          />
        </div>

        {periodField && <div>{periodField}</div>}

        <div>
          {restrictions?.lockCustomer ? (
            <ModalInput
              label="Customer"
              value={form.customer_name}
              disabled
              name="customer"
            />
          ) : (
            <CustomerSelect
              label="Customer"
              value={form.customer_name}
              selectedId={form.customer}
              onChange={(customer) =>
                onCustomer(customer.id, {
                  label: customer.name,
                  value: customer.id,
                  meta: { currency: customer.currency },
                })
              }
              placeholder="Search customer..."
            />
          )}
        </div>

        <div>
          <SearchSelect2
            label="Project"
            value={form.project_name}
            fetchOptions={fetchProjects}
            onChange={onProject}
            placeholder="Search project..."
          />
        </div>

        <div>
          {restrictions?.employee ? (
            <ModalInput
              label="Employee"
              value={form.employee_name}
              disabled
              name="employee"
            />
          ) : (
            <SearchSelect2
              label="Employee"
              value={form.employee_name}
              fetchOptions={fetchEmployeeOptions}
              onChange={onEmployee}
              placeholder="Search employee..."
            />
          )}
        </div>

        <div>
          <ModalInput
            label="Currency"
            value={form.currency || ""}
            disabled
            name="currency"
            placeholder="—"
            className="text-center font-mono font-semibold"
          />
        </div>

        {showExchangeRate && (
          <div>
            <ModalInput
              label="Exchange Rate"
              value={form.exchange_rate?.toFixed(4) ?? "1.0000"}
              disabled
              name="exchange_rate"
              className="text-center font-mono font-semibold"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetInfoCard;