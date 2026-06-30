import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import {
  getAllModeOfPayment,
  updateModeOfPaymentStatus,
} from "../../api/BankAccountApi";
import {
  showApiError,
  showSuccess,
} from "../../utils/alert";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { openModeOfPaymentModal } from "../../store/modalStore";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import { usePermission } from "../../hooks/permission/usePermission";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";
import { fireManagedSwal } from "../../utils/swalManager";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
const MODE_OF_PAYMENT_MODULE = "Mode Of Payment";

const ModeOfPaymentSetup: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { can } = usePermission();


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllModeOfPayment(page, pageSize, search);
      setData(Array.isArray(res.data) ? res.data : []);
      setTotalPages(res.pagination.total_pages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleEdit = (name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openModeOfPaymentModal({ name }, true, {
      onSuccess: () => fetchData(),
    });
  };

const handleView = (name:string, e?: React.MouseEvent) => {
  e?.stopPropagation();

  openModeOfPaymentModal({ name }, true, {
    onSuccess: () => fetchData(),
    isViewMode:true
  });
};

const handleToggle = async (row: any) => {
  const isDisabling = row.enabled;

  const result = await fireManagedSwal({
    icon: "warning",
    title: isDisabling ? "Disable Mode of Payment?" : "Enable Mode of Payment?",
    text: isDisabling
      ? `Are you sure you want to disable "${row.name}"?`
      : `Are you sure you want to enable "${row.name}"?`,
    showCancelButton: true,
    confirmButtonColor: isDisabling ? "#ef4444" : "#22c55e",
    cancelButtonColor: "#6b7280",
    confirmButtonText: isDisabling ? "Yes, Disable" : "Yes, Enable",
    cancelButtonText: "No",
  });
  if (!result.isConfirmed) return;

  try {
    setActionLoadingId(String(row.id));
    await updateModeOfPaymentStatus({
      name: row.id,
      enabled: row.enabled ? 0 : 1,
    });
    await fetchData();
    showSuccess("Status updated successfully");
  } catch (err: any) {
    showApiError(err);
  } finally {
    setActionLoadingId(null);
  }
};
  const columns: Column<any>[] = [
    { key: "name", header: "Mode" },
    { key: "type", header: "Type" },
    {
      key: "defaultAccount",
      header: "GL Account",
      render: (row: any) => getGLNameWithoutAbbreviation(row.accountName) || "—",

    },
    {
      key: "enabled",
      header: "Status",
      render: (row: any) =>
        row.enabled ? (
          <span className="text-green-600 font-semibold">Enabled</span>
        ) : (
          <span className="text-red-500 font-semibold">Disabled</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row: any) => (
        <div className="flex items-center justify-center gap-2">
           
           
  <ActionButton
  type="view"
  iconOnly
  onClick={(e) => handleView(row.id, e)}   
/>
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(row.id, e)}
            iconOnly
            title="Edit Mode of Payment"
          />
          <ActionMenu
            customActions={[
              {
                label: row.enabled ? "Disable" : "Enable",
                icon: row.enabled ? ACTION_ICONS.DISABLE : ACTION_ICONS.ENABLE,
                onClick: () => handleToggle(row),
                disabled: actionLoadingId === String(row.id),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <AppPage>
      <AppPageBody>
        <Table
          columns={columns}
          data={data}
          loading={loading}
          rowKey={(r) => String(r.id)}
          showToolbar
          enableAdd={can(MODE_OF_PAYMENT_MODULE, "create")}
          addLabel="Add Mode of Payment"
          onAdd={() =>
            openModeOfPaymentModal(null, false, {
              onSuccess: fetchData,
            })
          }
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          enableColumnSelector
          tableId="modeOfPayment"
           pageSizeOptions={[20, 50, 100,200]}
          onPageChange={setPage}
          searchValue={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onRowDoubleClick={(row) => handleView(row.id)}
        />
      </AppPageBody>
    </AppPage>
  );
};

export default ModeOfPaymentSetup;
