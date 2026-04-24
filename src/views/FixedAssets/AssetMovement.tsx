import React, { useState, useMemo } from "react";
import { FaTrash } from "react-icons/fa";
import Table from "../../components/ui/Table/Table";
import { DateRangeFilter } from "../../components/ui/modal/DateRangeFilter";
import type { Column } from "../../components/ui/Table/type";
import AddAssetMovementModal from "../../components/FixedAsset/Addassetmovementmodal "; 
import type { AssetMovementRecord, AssetMovementForm } from "../../types/Assetmovement.types";
import { STATUS_CLASS_MAP } from "../../types/Assetmovement.types";

/* ─────────────────────────────────────────────
   ASSET MOVEMENT LIST PAGE
───────────────────────────────────────────── */
const AssetMovement: React.FC = () => {
  /* ── state ── */
  const [records, setRecords] = useState<AssetMovementRecord[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ from_date: "", to_date: "" });
  const [sortBy, setSortBy] = useState<keyof AssetMovementRecord | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  /* ── add record (from modal submit) ── */
  const handleAddRecord = async (form: AssetMovementForm) => {
    const newRecord: AssetMovementRecord = {
      ...form,
      id: Date.now().toString(),
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  /* ── delete ── */
  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  /* ── filter ── */
  const filteredData = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        r.company.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q);

      const txDate = new Date(r.transactionDate);
      const matchesDate =
        (!filters.from_date || txDate >= new Date(filters.from_date)) &&
        (!filters.to_date || txDate <= new Date(filters.to_date));

      return matchesSearch && matchesDate;
    });
  }, [records, searchTerm, filters]);

  /* ── sort ── */
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      const vA = a[sortBy] as string;
      const vB = b[sortBy] as string;
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);

  /* ── pagination ── */
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize],
  );

  /* ── sort handler ── */
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey as keyof AssetMovementRecord);
    setSortOrder(order);
    setPage(1);
  };

  /* ── columns ── */
  const columns: Column<AssetMovementRecord>[] = [
    {
      key: "id",
      header: "Movement ID",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs" style={{ color: "var(--primary)" }}>
          #{row.id.slice(-6)}
        </span>
      ),
    },
    {
      key: "company",
      header: "Company",
      sortable: true,
    },
    {
      key: "purpose",
      header: "Purpose",
      sortable: true,
      render: (row) => (
        <span className="badge">
          {row.purpose || "—"}
        </span>
      ),
    },
    {
      key: "transactionDate",
      header: "Transaction Date",
      sortable: true,
      render: (row) => (
        <span style={{ color: "var(--muted)", fontSize: 12 }}>
          {row.transactionDate}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`badge ${STATUS_CLASS_MAP[row.status]}`}
          style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11 }}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions" as keyof AssetMovementRecord,
      header: "Actions",
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Delete"
        >
          <FaTrash size={13} />
        </button>
      ),
    },
  ];

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={paginatedData}
        rowKey={(row) => row.id}
        tableId="asset-movement"
        loading={false}
        isFetching={false}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd
        addLabel="New Movement"
        onAdd={() => setShowModal(true)}
        enableColumnSelector
        enableExport
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy ?? ""}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        extraFilters={
          <DateRangeFilter
            from={filters.from_date}
            to={filters.to_date}
            onChange={(range) => {
              setFilters((prev) => ({ ...prev, ...range }));
              setPage(1);
            }}
          />
        }
      />

      <AddAssetMovementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddRecord}
      />
    </div>
  );
};

export default AssetMovement;