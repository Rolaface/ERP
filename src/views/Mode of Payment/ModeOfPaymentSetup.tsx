import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import AddModeOfPaymentModal from "./AddModeOfPaymentModal";
import { FaMoneyBillWave } from "react-icons/fa";
import {
  getAllModeOfPayment,
  updateModeOfPaymentStatus,
} from "../../api/BankAccountApi";
import { showApiError, showSuccess } from "../../utils/alert";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

const ModeOfPaymentSetup: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  /* ───────── FETCH DATA ───────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getAllModeOfPayment(page, pageSize);

      setData(Array.isArray(res.data) ? res.data : []);
      setTotalPages(res.pagination.total_pages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      showApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  /* ───────── COLUMNS ───────── */
  const columns = [
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
        <ActionGroup>

          <ActionMenu
            customActions={[
              {
                label: row.enabled ? "Disable" : "Enable",
                onClick: () => handleToggle(row),
                disabled: actionLoadingId === String(row.id),
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
          <FaMoneyBillWave className="text-primary" />
          Mode Of Payment
        </h1>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(r) => `${r.id}-${r.type}`}
        showToolbar
        enableAdd
        addLabel="Add Mode of Payment"
        onAdd={() => setShowModal(true)}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* EMPTY */}
      {!loading && data.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No mode of payments found
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <AddModeOfPaymentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={fetchData}
        />
      )}
    </div>
  );
};

export default ModeOfPaymentSetup;