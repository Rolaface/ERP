import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import ImportedItemModal from "../../components/inventory/ImportedItems/ImportItemsModal";

// Dummy Data Interface to match the ZRA Table structure
interface DeclarationSummary {
  id: string; // Declaration No
  date: string;
  taskCode: string;
  supplier: string;
  status: "Pending" | "Approved" | "Rejected";
}

const DUMMY_DECLARATIONS: DeclarationSummary[] = [
  { id: "C3460-2019-TZDL", date: "20 Nov 2023", taskCode: "2239078", supplier: "ODERICH CONSERVA QUALIDADE BRASIL", status: "Pending" },
  { id: "C3459-2019-TZDL", date: "19 Nov 2023", taskCode: "2238001", supplier: "ABC TRADERS LTD", status: "Approved" },
  { id: "C3458-2019-TZDL", date: "18 Nov 2023", taskCode: "2237654", supplier: "GLOBAL SUPPLIES ZM", status: "Rejected" },
  { id: "C3457-2019-TZDL", date: "17 Nov 2023", taskCode: "2237002", supplier: "ZAM IMPORTS CO.", status: "Pending" },
  { id: "C3456-2019-TZDL", date: "16 Nov 2023", taskCode: "2236123", supplier: "AFRICA MERCHANTS LTD", status: "Approved" },
  { id: "C3455-2019-TZDL", date: "15 Nov 2023", taskCode: "2235900", supplier: "IMPORTERS ZAMBIA LTD", status: "Pending" },
  { id: "C3454-2019-TZDL", date: "14 Nov 2023", taskCode: "2235012", supplier: "BN METRO Ltd", status: "Rejected" },
];

const ImportedItem: React.FC = () => {
  /* ── Table / list state ── */
  const [declarations, setDeclarations] = useState<DeclarationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(13); // Dummy total pages (245 / 20)
  const [totalItems, setTotalItems] = useState(245);

  /* ── View mode state ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationSummary | null>(null);

  /* ── Simulate Fetch ── */
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setDeclarations(DUMMY_DECLARATIONS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [page, pageSize]);

  const handleRowClick = useCallback((summary: DeclarationSummary) => {
    setSelectedDeclaration(summary);
    setIsModalOpen(true);
  }, []);

  const handleFetchLatest = useCallback(() => {
    setLoading(true);
    // Simulate fetching latest ZRA declarations
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const columns: Column<DeclarationSummary>[] = [
    {
      key: "id",
      header: "Declaration No",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block font-medium">{i.id}</span>
        </div>
      ),
      tooltip: (i) => i.id,
    },
    {
      key: "date",
      header: "Declaration Date",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">{i.date}</span>
        </div>
      ),
      tooltip: (i) => i.date,
    },
    {
      key: "taskCode",
      header: "Task Code",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">{i.taskCode}</span>
        </div>
      ),
      tooltip: (i) => i.taskCode,
    },
    {
      key: "supplier",
      header: "Supplier",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">{i.supplier}</span>
        </div>
      ),
      tooltip: (i) => i.supplier,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (i) => {
        const isPending = i.status === "Pending";
        const isApproved = i.status === "Approved";
        
        return (
          <div className="py-1.5 flex justify-center">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-md ${
                isPending
                  ? "bg-amber-100 text-amber-800"
                  : isApproved
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {i.status}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (i) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            title="View Declaration"
            onClick={(e?: React.MouseEvent<HTMLButtonElement>) => {
              e?.stopPropagation();
              handleRowClick(i);
            }}
          />
          <ActionMenu />
        </ActionGroup>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full">
      {/* Supplemental filters (Date Range) placed above the Table */}
      {/* <div className="flex items-center gap-3 mb-4 shrink-0">
        <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
        <input 
          type="date" 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-white"
        />
      </div> */}

      <div className="flex flex-1 flex-col min-h-0">
        <Table
          loading={loading}
          columns={columns}
          data={declarations}
          enableColumnSelector
          showToolbar
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          enableAdd={true}
          addLabel="Fetch Latest Declarations"
          onAdd={handleFetchLatest}
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
          onRowDoubleClick={handleRowClick}
        />
      </div>

      {isModalOpen && (
        <ImportedItemModal 
          onClose={() => setIsModalOpen(false)} 
          // declaration={selectedDeclaration} // If you need to pass data into the modal later
        />
      )}
    </div>
  );
};

export default ImportedItem;