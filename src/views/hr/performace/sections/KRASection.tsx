import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import type { Column } from "../../../../components/ui/Table/type";
import ModalTable from "../../../../components/ui/Table/ModalTableInside";
import type { SetupRow } from "../types";
import AddKRAModal from "../../../../components/Hr/performance/section/AddKRAModal";
import { showApiError, showLoading, closeSwal } from "../../../../utils/alert";
import { fireManagedSwal } from "../../../../utils/swalManager";

import {
  getKRAList,
  deleteKRA,
  getKRAById,
} from "../../../../api/Appraisalapi/kraApi";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../components/ui/Table/ActionButton";

const PAGE_SIZE = 10;

export default function KRASection() {
  const [data, setData] = useState<SetupRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedKRA, setSelectedKRA] = useState<SetupRow | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const fetchKRAs = async () => {
    try {
      setLoading(true);
      const resp = await getKRAList({ page, pageSize: PAGE_SIZE, search });
      const mapped: SetupRow[] = (resp.data || []).map((r) => ({
        id: r.name,
        title: r.title,
        description: r.description || "-",
        creation: r.creation || "-",
      }));
      setData(mapped);
      setTotalItems(resp.pagination?.total || mapped.length);
    } catch (err) {
      console.error("Failed to fetch KRAs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKRAs();
  }, [page, search]);

  const openDetail = async (id: string, mode: "view" | "edit") => {
    try {
      const detail = await getKRAById(id);
      setSelectedKRA({
        id: detail.name,
        title: detail.title,
        description: detail.description || "-",
      });
      setIsViewMode(mode === "view");
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch KRA detail", err);
    }
  };

  const deleteRow = async (id: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete KRA "${id}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting KRA...");
      await deleteKRA(id);
      closeSwal();
      setData((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      closeSwal();
      const raw =
        err?.response?.data?._server_messages ||
        err?.response?.data?.exception ||
        err?.message;
      let message = "Failed to delete KRA";
      try {
        if (raw) {
          const parsed = JSON.parse(raw);
          const first = JSON.parse(parsed[0]);
          message = String(first.message)
            .replace(/<a [^>]*>(.*?)<\/a>/gi, "$1")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch {
        message = "Failed to delete KRA";
      }
      showApiError(message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedKRA(null);
    setIsViewMode(false);
  };

  const columns: Column<SetupRow>[] = [
    {
      key: "creation",
      header: "Created At",
      align: "center",
      render: (row) => (
        <span>
          {row.creation && row.creation !== "-"
            ? new Date(row.creation).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      key: "title",
      header: "Name",
      sortable: true,
      truncate: true,
    },
    {
      key: "description",
      header: "Description",
      truncate: true,
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
            onClick={() => openDetail(row.id, "view")}
          />
          <ActionButton
            type="edit"
            iconOnly
            onClick={() => openDetail(row.id, "edit")}
          />
          <ActionMenu
            customActions={[
              {
                label: "Delete",
                onClick: () => deleteRow(row.id),
                danger: true,
                icon: <FaTrash className="w-4 h-4" />,
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <>
      <ModalTable<SetupRow>
        tableId="setup-kra"
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        showToolbar
        toolbarPlaceholder="Search KRAs..."
        searchValue={search}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        enableAdd
        addLabel="+ Add KRA"
        onAdd={() => {
          setSelectedKRA(null);
          setIsViewMode(false);
          setShowModal(true);
        }}
        enableColumnSelector
        currentPage={page}
        totalPages={Math.max(1, Math.ceil(totalItems / PAGE_SIZE))}
        pageSize={PAGE_SIZE}
        totalItems={totalItems}
        onPageChange={setPage}
      />

      {showModal && (
        <AddKRAModal
          selectedKRA={selectedKRA}
          isViewMode={isViewMode}
          onClose={closeModal}
          onAdd={(row) => {
            setData((prev) => [row, ...prev]);
            closeModal();
          }}
        />
      )}
    </>
  );
}