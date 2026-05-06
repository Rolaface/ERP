import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import AddModeOfPaymentModal from "./AddModeOfPaymentModal";
import { FaMoneyBill } from "react-icons/fa";
import {
  getAllModeOfPayment,
  getModeOfPaymentByName,
  updateModeOfPaymentStatus,
} from "../../api/BankAccountApi";
import { closeSwal, showApiError, showLoading, showSuccess } from "../../utils/alert";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { openModeOfPaymentModal } from "../../store/modalStore";

const ModeOfPaymentSetup: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  /* ───────── FETCH DATA ───────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getAllModeOfPayment(page, pageSize, search);

      setData(Array.isArray(res.data) ? res.data : []);
      setTotalPages(res.pagination.total_pages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      showApiError(err.message);
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
  const handleToggle = async (row: any) => {
    const previous = row.enabled;

    try {
      setActionLoadingId(String(row.id));

      await updateModeOfPaymentStatus({
        name: row.id,
        enabled: previous ? 0 : 1,
      });

      await fetchData();

      showSuccess("Status updated successfully");
    } catch (err: any) {
      showApiError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };
  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Mode",
    },
    {
      key: "type",
      header: "Type",
    },
    {
      key: "defaultAccount",
      header: "Default Account",
      render: (row: any) => row.defaultAccount || "—",
    },
    {
      key: "enabled",
      header: "Status",
      render: (row: any) =>
        row.enabled ? (
          <div className="py-1.5">
          <span className="text-green-600 font-semibold">Enabled</span>
          </div>
        ) : (
          <div className="py-1.5">
            <span className="text-red-500 font-semibold">Disabled</span>
          </div>
        ),
    },
   {
  key: "actions",
  header: "Actions",
  align: "center",
  render: (row: any) => (
    <div className="flex items-center justify-center gap-2">
      
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
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
          <FaMoneyBill className="text-primary" />
          Mode Of Payment
        </h1>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(r) => String(r.id)}
        showToolbar
        enableAdd
        addLabel="Add Mode of Payment"
        onAdd={() =>
          openModeOfPaymentModal(null, false, {
            onSuccess: () => fetchData(),
          })
        }
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        enableColumnSelector
        tableId="modeOfPayment"
        pageSizeOptions={[10, 25, 50, 100]}
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
      />

    </div>
  );
};

export default ModeOfPaymentSetup;
