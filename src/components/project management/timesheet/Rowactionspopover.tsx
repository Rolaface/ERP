import React from "react";
import { Copy, CopyPlus, Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Popover } from "../../../components/common/Popover";
import UpdateRatesPanel from "./UpdateRatesPanel";
import type {
  RowActionsView,
  TimesheetLine,
  TimesheetModalState,
} from "../../../types/Project_Management/Timesheet/form/Timesheetformmodal";

const WIDTH: Record<RowActionsView, number> = { menu: 176, rates: 190 };
const OFFSET = 4;

interface RowActionsState {
  openId: string | null;
  view: RowActionsView;
  setView: (view: RowActionsView) => void;
  close: () => void;
  activeTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

interface RowActionsPopoverProps {
  actions: RowActionsState;
  activeLine: TimesheetLine | null;
  isEmployee: boolean;
  currency: string;
  onDuplicate: TimesheetModalState["duplicateLine"];
  onSaveRates: TimesheetModalState["updateLineRates"];
}

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-main hover:bg-app/60 transition-colors"
  >
    <Icon size={12} className={label === "Update Rates" ? "text-primary" : ""} />
    {label}
  </button>
);

const RowActionsPopover: React.FC<RowActionsPopoverProps> = ({
  actions,
  activeLine,
  isEmployee,
  currency,
  onDuplicate,
  onSaveRates,
}) => {
  const { openId, view, setView, close, activeTriggerRef } = actions;

  return (
    <Popover
      triggerRef={activeTriggerRef}
      open={openId !== null}
      onClose={close}
      placement="bottom-end"
      width={WIDTH[view]}
      offset={OFFSET}
    >
      {openId && view === "menu" && (
        <div className="py-1">
          {!isEmployee && (
            <MenuItem
              icon={Pencil}
              label="Update Rates"
              onClick={() => setView("rates")}
            />
          )}
          <MenuItem
            icon={Copy}
            label="Duplicate Below"
            onClick={() => {
              onDuplicate(openId, "after");
              close();
            }}
          />
          <MenuItem
            icon={CopyPlus}
            label="Duplicate at End"
            onClick={() => {
              onDuplicate(openId, "end");
              close();
            }}
          />
        </div>
      )}

      {openId && view === "rates" && activeLine && (
        <UpdateRatesPanel
          line={activeLine}
          currency={currency}
          onCancel={() => setView("menu")}
          onSave={(billingRate, costingRate) => {
            onSaveRates(openId, billingRate, costingRate);
            close();
          }}
        />
      )}
    </Popover>
  );
};

export default RowActionsPopover;