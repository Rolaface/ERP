import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import Table from "../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";

// import PurchaseInvoiceDetailsDrawer from "../../../views/Procurement/purchaseinvoice_imported/PurchaseInvoiceDetailsDrawer";
import { useImportedPurchaseInvoices } from "../../../hooks/procument/useImportedPurchaseInvoices";
import type { ImportedPurchaseInvoiceItemRaw } from "../../../types/procument/imported_purchase/Importedpurchaseinvoice.types";
import { openProcessImportModal } from "../../../components/feature/procument/processimportpi.modal";

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> =
  {
    "3": { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", dot: "bg-[#22c55e]" },
    "4": { bg: "bg-[#fef2f2]", text: "text-[#dc2626]", dot: "bg-[#ef4444]" },
  };
const DEFAULT_STATUS_STYLE = {
  bg: "bg-gray-100",
  text: "text-gray-700",
  dot: "bg-gray-400",
};

const formatDate = (raw: string | null | undefined) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (raw: string | null | undefined) => {
  if (!raw) return "—";
  const d = new Date(raw.replace(" ", "T"));
  if (isNaN(d.getTime())) return raw;
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
};

const ImportedPurchaseInvoice: React.FC = () => {
  const { invoices, isLoading, refresh } = useImportedPurchaseInvoices();
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<ImportedPurchaseInvoiceItemRaw | null>(null);

  const handleViewDrawer = (item: ImportedPurchaseInvoiceItemRaw) => {
    setSelectedInvoice(item);
    setIsDrawerOpen(true);
  };

  const columns: Column<ImportedPurchaseInvoiceItemRaw>[] = [
    {
      key: "declaration_no",
      header: "DECLARATION NO",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span
            className="block font-medium text-[#2563eb] hover:underline cursor-pointer"
            onClick={() => handleViewDrawer(i)}
          >
            {i.declaration_no}
          </span>
        </div>
      ),
    },
    {
      key: "declaration_date",
      header: "DECLARATION DATE",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">
            {formatDate(i.declaration_date)}
          </span>
        </div>
      ),
    },
    {
      key: "item_name",
      header: "ITEM NAME",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.item_name}</span>
        </div>
      ),
    },
    {
      key: "supplier_name",
      header: "SUPPLIER NAME",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.supplier_name ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "ITEM QUANTITY",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">
            {i.quantity} {i.quantity_unit}
          </span>
        </div>
      ),
    },
    {
      key: "invoice_amount",
      header: "INVOICE AMOUNT",
      align: "right",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">
            {i.currency} {i.invoice_amount.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: "checker",
      header: "CHECKER",
      align: "left",
      render: (i) => (
        <div className="py-1.5 max-w-[180px]">
          <span className="block text-gray-700 whitespace-normal break-words">
            {i.checker}
          </span>
        </div>
      ),
    },
    {
      key: "checked_at",
      header: "CHECKED AT",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">
            {formatDateTime(i.checked_at)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      render: (i) => {
        const style = STATUS_STYLE[i.status_code] ?? DEFAULT_STATUS_STYLE;
        return (
          <div className="py-1.5 flex justify-center">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-md ${style.bg} ${style.text} flex items-center gap-1.5`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
              {i.status}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "ACTIONS",
      align: "center",
      render: (i) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            title="View Purchase Invoice Details"
            onClick={(e?: React.MouseEvent) => {
              e?.stopPropagation();
              handleViewDrawer(i);
            }}
          />
          <ActionMenu />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full">
      <div className="flex flex-1 flex-col min-h-0 bg-card rounded-lg">
        <Table
          loading={isLoading}
          columns={columns}
          data={invoices}
          showToolbar
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          enableAdd={false}
          enableExport
          enableColumnSelector
      primaryAction={
  <button
    onClick={() =>
      openProcessImportModal({
        onSuccess: refresh,
      })
    }
    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
  >
    <RefreshCw size={16} />
    Process Declarations
  </button>
}
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(invoices.length / pageSize))}
          pageSize={pageSize}
          totalItems={invoices.length}
          pageSizeOptions={[20, 50, 100]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onPageChange={setPage}
          onRowDoubleClick={handleViewDrawer}
        />
      </div>

      {/* {isDrawerOpen && selectedInvoice && (
        <PurchaseInvoiceDetailsDrawer
          invoice={selectedInvoice}
          onClose={() => setIsDrawerOpen(false)}
        />
      )} */}
    </div>
  );
};

export default ImportedPurchaseInvoice;