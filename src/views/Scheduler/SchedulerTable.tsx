import React, { useCallback } from "react";
import { useShedular } from "../../hooks/useSheduler";
import type { SchedulerRecord } from "../../api/schedulerApi";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { AppPage, AppPageBody, AppPageHeader } from "../../components/ui/app-shell";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { CalendarClock } from "lucide-react";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";

const schedulerPage: React.FC = () => {
  const {
    data,
    loading,
    openAdd,
    openView,
    openEdit,
    handleDelete,
    handleToggleEnable
  } = useShedular();

  const columns: Column<SchedulerRecord>[] = [
    {
      key: "schedulerName",
      header: "Scheduler Name",
      align: "left",
      render: (row) => (
        <div className="py-1.5">
          <span className="block">{row.schedulerName || "—"}</span>
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Frequency",
      align: "left",
      render: (row) => (
        <div className="py-1.5">
          <span className="block text-muted">{row.frequency || "—"}</span>
        </div>
      ),
    },
    {
      key: "enabled",
      header: "Enabled",
      align: "left",
      render: (row) => (
        <div className="py-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.enabled
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
              }`}
          >
            {row.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            onClick={(e) => { e.stopPropagation(); openView(row); }}
          />
          <ActionButton
            type="edit"
            iconOnly
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          />
          <ActionMenu
  customActions={[
    {
      label: row.enabled ? "Disable" : "Enable",
      icon: row.enabled ? ACTION_ICONS.DISABLE : ACTION_ICONS.ENABLE,
      onClick: () => handleToggleEnable(row.id, !row.enabled),
      disabled: false,
      danger: row.enabled,
    },
    {
      label: "Delete",
      icon: ACTION_ICONS.DELETE,
      onClick: () => handleDelete(row.id),
      danger: true,
    },
  ]}
/>
        </ActionGroup>
      ),
    },
  ];

  return (
    <AppPage>
      <AppPageHeader
        title="Schedulers"
        description="Manage your schedulers"
        icon={<CalendarClock />}
      />

      <AppPageBody>
        <Table
          columns={columns}
          tableId="scheduler-table"
          data={data}
          showToolbar
          loading={loading}
          enableAdd
          addLabel="Add Scheduler"
          onAdd={openAdd}
          enableColumnSelector
        />
      </AppPageBody>
    </AppPage>
  );
};

export default schedulerPage;