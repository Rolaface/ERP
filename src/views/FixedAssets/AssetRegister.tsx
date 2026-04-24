import React, { useState, useMemo } from "react";
import { FaTrash } from "react-icons/fa";
import AddAssetModal from "../../components/FixedAsset/AddAssetModal";
import Table from "../../components/ui/Table/Table";
import { DateRangeFilter } from "../../components/ui/modal/DateRangeFilter";
import type { Column } from "../../components/ui/Table/type";

type Asset = {
  id: string;
  name: string;
  category: string;
  location: string;
  purchaseDate: string;
  value: number;
};

const AssetRegister: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    from_date: "",
    to_date: "",
  });

  const [sortBy, setSortBy] = useState<keyof Asset | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ─── Add Asset ───
  const handleAddAsset = (asset: Omit<Asset, "id">) => {
    setAssets((prev) => [
      ...prev,
      { id: Date.now().toString(), ...asset, value: Number(asset.value) },
    ]);
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const onAddAsset = () => setShowModal(true);

  // ─── FILTER ───
  const filteredData = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate =
        (!filters.from_date ||
          new Date(a.purchaseDate) >= new Date(filters.from_date)) &&
        (!filters.to_date ||
          new Date(a.purchaseDate) <= new Date(filters.to_date));

      return matchesSearch && matchesDate;
    });
  }, [assets, searchTerm, filters]);

  // ─── SORT ───
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);

  // ─── PAGINATION ───
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedData = useMemo(() => {
    return sortedData.slice(
      (page - 1) * pageSize,
      page * pageSize
    );
  }, [sortedData, page, pageSize]);

  // ─── SORT HANDLER ───
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey as keyof Asset);
    setSortOrder(order);
    setPage(1);
  };

  // ─── COLUMNS ───
  const columns: Column<Asset>[] = [
    {
      key: "name",
      header: "Asset Name",
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
    },
    {
      key: "location",
      header: "Location",
    },
    {
      key: "purchaseDate",
      header: "Purchase Date",
      sortable: true,
    },
    {
      key: "value",
      header: "Value",
      sortable: true,
      render: (row) => `₹ ${row.value.toLocaleString()}`,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="text-red-500 hover:text-red-700"
        >
          <FaTrash />
        </button>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={paginatedData}
        rowKey={(row) => row.id}
        tableId="fixed-assets"

        loading={false}
        isFetching={false}

        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}

        enableAdd
        addLabel="Add Asset"
        onAdd={onAddAsset}

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

      <AddAssetModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddAsset}
      />
    </div>
  );
};

export default AssetRegister;