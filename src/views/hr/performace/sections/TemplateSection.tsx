import { useEffect, useState } from "react";
import type { Column } from "../../../../components/ui/Table/type";
import ModalTable from "../../../../components/ui/Table/ModalTableInside";

import type { SetupRow } from "../types";
import {
  showApiError,
  showLoading,
  closeSwal,
} from "../../../../utils/alert";

import { fireManagedSwal } from "../../../../utils/swalManager";

import AddTemplateModal from "../../../../components/Hr/performance/section/AddTemplateModal";

import {
  getTemplateList,
  deleteTemplate,
  getTemplateById,
} from "../../../../api/Appraisalapi/templeteApi";



import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../components/ui/Table/ActionButton";

export default function TemplateSection() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);

  const [data, setData] = useState<SetupRow[]>([]);
  const [, setLoading] = useState(false);

  const [totalItems, setTotalItems] = useState(0);

  const [selectedTemplate, setSelectedTemplate] = useState<SetupRow | null>(null);

  const [isViewMode, setIsViewMode] = useState(false);

  const PAGE_SIZE = 10;

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      const resp = await getTemplateList({
        page,
        pageSize: PAGE_SIZE,
        search,
      });

      const mapped: SetupRow[] = (resp.data || []).map((r) => ({
        id: r.name,
        title: r.template_title,
        description: r.description || "-",
        creation: r.creation || "-",
      }));

      setData(mapped);

      setTotalItems(resp.pagination?.total || mapped.length);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page, search]);

 const deleteRow = async (id: string) => {
  const result = await fireManagedSwal({
    icon: "warning",
    title: "Are you sure?",
    text: `Delete Template "${id}"?`,
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    showLoading("Deleting Template...");

    await deleteTemplate(id);

    closeSwal();

    setData((prev) =>
      prev.filter((r) => r.id !== id),
    );
  } catch (err: any) {
    closeSwal();

    const raw =
      err?.response?.data?._server_messages ||
      err?.response?.data?.exception ||
      err?.message;

    let message = "Failed to delete Template";

    try {
      if (raw) {
        const parsed = JSON.parse(raw);

        const first = JSON.parse(parsed[0]);

        message = String(first.message)
          .replace(
            /<a [^>]*>(.*?)<\/a>/gi,
            "$1",
          )
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }
    } catch {
      message = "Failed to delete Template";
    }

    showApiError(message);
  }
};

  const columns: Column<SetupRow>[] = [
    {
      key: "creation",
      header: "Date Created",
      align: "center",
      render: (row) => (
        <span>
          {row.creation
            ? new Date(row.creation).toLocaleDateString()
            : "-"}
        </span>
      ),
    },

    {
      key: "title",
      header: "Template Name",
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
            onClick={async () => {
              try {
                const detail = await getTemplateById(row.id);

                setSelectedTemplate({
                  id: detail.name,
                  title: detail.template_title,
                  description: detail.description || "-",
                });

                setIsViewMode(true);

                setShowModal(true);
              } catch (err) {
                console.error(
                  "Failed to fetch Template detail",
                  err,
                );
              }
            }}
          />

          <ActionButton
            type="edit"
            iconOnly
            onClick={async () => {
              try {
                const detail = await getTemplateById(row.id);

                setSelectedTemplate({
                  id: detail.name,
                  title: detail.template_title,
                  description: detail.description || "-",
                });

                setIsViewMode(false);

                setShowModal(true);
              } catch (err) {
                console.error(
                  "Failed to fetch Template detail",
                  err,
                );
              }
            }}
          />

          <ActionMenu
  onDelete={() => deleteRow(row.id)}
/>
        </ActionGroup>
      ),
    },
  ];

  return (
     <div className="h-[calc(100vh-220px)]"> 
    
      <ModalTable<SetupRow>
        tableId="setup-template"
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        showToolbar
        toolbarPlaceholder="Search Templates..."
        searchValue={search}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        enableAdd
        addLabel="+ Add Template"
        onAdd={() => {
          setSelectedTemplate(null);
          setIsViewMode(false);
          setShowModal(true);
        }}
        enableColumnSelector
        currentPage={page}
        totalPages={Math.max(
          1,
          Math.ceil(totalItems / PAGE_SIZE),
        )}
        pageSize={PAGE_SIZE}
        totalItems={totalItems}
        onPageChange={setPage}
      />

      {showModal && (
        <AddTemplateModal
          selectedTemplate={selectedTemplate}
          isViewMode={isViewMode}
          onClose={() => {
            setShowModal(false);
            setSelectedTemplate(null);
            setIsViewMode(false);
          }}
          onAdd={() => {
            fetchTemplates();

            setShowModal(false);

            setSelectedTemplate(null);

            setIsViewMode(false);
          }}
        />
        
      )}
    </div>
  );
}