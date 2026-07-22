import React, { useState, useMemo } from "react";
import { toast } from "sonner";

// import { getAllImportItems, deleteImportItem } from "../../api/importApi";

import ViewImportModal from "../../components/inventory/ViewImportModal";
import DeleteModal from "../../components/actionModal/DeleteModal";

import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";

interface ImportItemSummary {
  id: string;
  itemName: string;
  quantity: string;
  originCountryCode: string;
  exportCountryCode: string;
  invoiceAmount: number;
  invoiceCurrency: string;
  invoiceExchangeRate: number;
}

const Import: React.FC = () => {
  // ── Data with stale-while-revalidate pattern (same as InvoiceTable) ──────
  const [items, setItems] = useState<ImportItemSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Pagination (server) ───────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server) ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("itemName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── View / Delete modal state ─────────────────────────────────────────────
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ImportItemSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // ── Fetch import items with stale-while-revalidate pattern ────────────────
  // Wired up exactly like InvoiceTable's fetchInvoices — just swap in the
  // real endpoint + response mapping once the backend is ready.
  //
  // const fetchItems = useCallback(async () => {
  //   setIsFetching(true);
  //   try {
  //     const res = await getAllImportItems(page, pageSize, sortBy, sortOrder, searchTerm);
  //
  //     if (!res || res.status_code !== 200) {
  //       toast.error("Failed to load import items");
  //       setItems([]);
  //       setTotalPages(1);
  //       setTotalItems(0);
  //       return;
  //     }
  //
  //     const mapped: ImportItemSummary[] = res.data.map((entry: any) => ({
  //       id: entry.id || "",
  //       itemName: entry.itemName || entry.item_name || "",
  //       quantity: entry.quantity || "0",
  //       originCountryCode: entry.originCountryCode || entry.origin_country_code || "",
  //       exportCountryCode: entry.exportCountryCode || entry.export_country_code || "",
  //       invoiceAmount: entry.invoiceAmount || entry.invoice_amount || 0,
  //       invoiceCurrency: entry.invoiceCurrency || entry.invoice_currency || "",
  //       invoiceExchangeRate: entry.invoiceExchangeRate || entry.invoice_exchange_rate || 0,
  //     }));
  //
  //     setItems(mapped);
  //     setTotalPages(res.pagination?.total_pages || 1);
  //     setTotalItems(res.pagination?.total || mapped.length);
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to load import items");
  //     setItems([]);
  //     setTotalPages(1);
  //     setTotalItems(0);
  //   } finally {
  //     setIsFetching(false);
  //     setIsInitialLoad(false);
  //   }
  // }, [page, pageSize, sortBy, sortOrder, searchTerm]);
  //
  // useEffect(() => {
  //   fetchItems();
  // }, []);
  //
  // useEffect(() => {
  //   if (isInitialLoad) return;
  //   fetchItems();
  // }, [page, pageSize, sortBy, sortOrder, searchTerm]);

  // ── Sort handler (same shape as InvoiceTable's handleSortChange) ─────────
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey);
    setSortOrder(order);
    setPage(1);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleView = (importId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImportId(importId);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (item: ImportItemSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      // await deleteImportItem(itemToDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      toast.success("Import item deleted successfully");
      setDeleteModalOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to delete import item",
        { duration: 6000 },
      );
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleAddImport = () => {
    // TODO: open create-import modal once backend/flow is ready
    toast.info("Import creation coming soon");
  };

  const handleExportExcel = async () => {
    // TODO: wire up real export once backend is ready (same pattern as
    // InvoiceTable's handleExportExcel — fetch all pages, build XLSX, saveAs)
    toast.info("Export coming soon");
  };

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns: Column<ImportItemSummary>[] = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        align: "left",
        sortable: true,
        render: (i) => (
          <div className="py-1.5">
            <span className="block">{i.id}</span>
          </div>
        ),
      },
      {
        key: "itemName",
        header: "Item Name",
        align: "left",
        sortable: true,
        render: (i) => (
          <div className="py-1.5">
            <span className="block font-medium">{i.itemName}</span>
          </div>
        ),
        tooltip: (i) => `Item: ${i.itemName}`,
      },
      {
        key: "quantity",
        header: "Quantity",
        align: "center",
        render: (i) => (
          <div className="py-1.5">
            <span className="block">{i.quantity}</span>
          </div>
        ),
      },
      {
        key: "originCountryCode",
        header: "Origin Country",
        align: "center",
        render: (i) => (
          <div className="py-1.5">
            <span className="block">{i.originCountryCode || "—"}</span>
          </div>
        ),
      },
      {
        key: "exportCountryCode",
        header: "Export Country",
        align: "center",
        render: (i) => (
          <div className="py-1.5">
            <span className="block">{i.exportCountryCode || "—"}</span>
          </div>
        ),
      },
      {
        key: "invoiceAmount",
        header: "Invoice Amount",
        align: "right",
        sortable: true,
        render: (i) => (
          <div className="py-1.5">
            <span className="block whitespace-nowrap">
              {i.invoiceAmount.toFixed(2)}
            </span>
          </div>
        ),
      },
      {
        key: "invoiceCurrency",
        header: "Currency",
        align: "center",
        render: (i) => (
          <div className="py-1.5">
            <span className="block">{i.invoiceCurrency || "—"}</span>
          </div>
        ),
      },
      {
        key: "invoiceExchangeRate",
        header: "Exchange Rate",
        align: "right",
        render: (i) => (
          <div className="py-1.5">
            <span className="block whitespace-nowrap">
              {i.invoiceExchangeRate.toFixed(2)}
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (i) => (
          <ActionGroup>
            <ActionButton
              type="view"
              onClick={(e) => handleView(i.id, e)}
              iconOnly
            />
            <ActionMenu onDelete={(e) => handleDeleteClick(i, e)} />
          </ActionGroup>
        ),
      },
    ],
    [],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
        tableId="import-items"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Import"
        onAdd={handleAddImport}
        enableColumnSelector
        enableExport
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 50, 100, 200]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowDoubleClick={(item) => handleView(item.id)}
      />

      {/* VIEW MODAL */}
      {viewModalOpen && (
        <ViewImportModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedImportId(null);
          }}
          importId={selectedImportId}
          // onSuccess={fetchItems}
        />
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && itemToDelete && (
        <DeleteModal
          entityName="Import Item"
          entityId={itemToDelete.id}
          entityDisplayName={itemToDelete.itemName}
          isLoading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default Import;