import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import Table from "../../../components/ui/Table/Table";
import type { Column } from "../../../components/ui/Table/type";
import { HrTableFrame } from "../../hr/components/HrTabLayout";
import {
  ActionButton,
  ActionGroup,
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import {
  usePmList,
  type PmListConfig,
} from "../../../hooks/project_management/project/usePmList";
import type { RowActions } from "../../../hooks/project_management/project/Useprojectactions";
import { openProjectFormModal } from "../../../components/project management/project_modal/projectForm.modal";

interface PmListTableProps<T extends Record<string, any>> {
  config: PmListConfig<T>;
  height?: string;
  enableAdd?: boolean;
  onAdd?: (ctx: { reload: () => void }) => void;
  addLabel?: string;
  onRowOpen?: (row: T) => void;
  getActions?: (row: T, ctx: { reload: () => void }) => RowActions | null;
}

const openNewProject = ({ reload }: { reload: () => void }) =>
  openProjectFormModal({ onSuccess: reload });

const PmListTable = <T extends Record<string, any>>({
  config,
  height = "calc(95.5vh - 100px)",
  enableAdd = true,
  onAdd = openNewProject,
  addLabel = "Add Project",
  onRowOpen,
  getActions,
}: PmListTableProps<T>) => {
  const list = usePmList<T>(config);

  const columns = useMemo<Column<T>[]>(() => {
    if (!getActions) return config.columns;

    const actionsColumn = {
      key: "__actions",
      header: "Actions",
      align: "center",
      width: "120px",
      render: (row: T) => {
        const actions = getActions(row, { reload: list.reload });
        if (!actions) return null;

        return (
          <div onDoubleClick={(e) => e.stopPropagation()}>
            <ActionGroup>
              {actions.onView && (
                <ActionButton type="view" iconOnly onClick={actions.onView} />
              )}
              {actions.onEdit && (
                <ActionButton type="edit" iconOnly onClick={actions.onEdit} />
              )}
              {actions.menu && <ActionMenu {...actions.menu} />}
            </ActionGroup>
          </div>
        );
      },
    } as Column<T>;

    return [...config.columns, actionsColumn];
  }, [config.columns, getActions, list.reload]);

  return (
    <HrTableFrame>
      <Table
        tableId={config.tableId}
        customHeight={height}
        columns={columns}
        data={list.rows}
        rowKey={(row) => row.name}
        loading={list.isInitialLoad}
        isFetching={list.isFetching}
        showToolbar
        enableAdd={false}
        primaryAction={
          enableAdd ? (
            <button
              type="button"
              onClick={() => onAdd({ reload: list.reload })}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={16} />
              {addLabel}
            </button>
          ) : undefined
        }
        toolbarPlaceholder={config.searchPlaceholder}
        searchValue={list.searchTerm}
        onSearch={list.changeSearch}
        multiSelectFilters={
          config.statusField && config.statusOptions
            ? [
                {
                  key: "status",
                  label: "Status",
                  options: config.statusOptions,
                  values: list.statusFilter,
                  onChange: list.changeStatusFilter,
                },
              ]
            : undefined
        }
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSortChange={({ sortBy, sortOrder }) =>
          list.changeSort(sortBy, sortOrder)
        }
        enableColumnSelector
        currentPage={list.page}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalItems={list.totalItems}
        pageSizeOptions={[20, 50, 100, 200]}
        onPageSizeChange={list.changePageSize}
        onPageChange={list.setPage}
        onRowDoubleClick={onRowOpen}
      />
    </HrTableFrame>
  );
};

export default PmListTable;