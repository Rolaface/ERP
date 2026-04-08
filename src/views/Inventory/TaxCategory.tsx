import React, { useEffect, useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { getAllTaxCategories } from "../../api/taxCategoryApi";
import {
  showApiError
} from "../../utils/alert";
import AddTaxCategoryModal from "../../components/inventory/TaxCategoryModal";

type TaxCategory = {
  id: string;
  title: string;
  status: string;
};

const TaxCategory: React.FC = () => {
  const [data, setData] = useState<TaxCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const fetchTaxCategories = async () => {
    try {
      setLoading(true);

      const res = await getAllTaxCategories(page, pageSize);

      const list = res?.data || [];
      const pagination = res?.pagination || {};

      const formatted = list.map((item: any) => ({
        id: item.name || `-`,
        title: item.title || "-",
        status: item.disabled ? "Inactive" : "Active",
      }));

      setData([...formatted]);
      setTotalPages(pagination.total_pages || 1);
      setTotalItems(pagination.total_count || 0);
    } catch (err) {
      showApiError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxCategories();
  }, [page, pageSize]);
  const columns: Column<TaxCategory>[] = [
    {
      key: "id",
      header: "ID",
      align: "left",
    },
    {
      key: "title",
      header: "Title",
      align: "left",
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (row) => (
        <span
          className={`font-medium ${
            row.status === "Active" ? "text-success" : "text-danger"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        loading={loading}
        columns={columns}
        data={data}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add Tax Category"
        onAdd={() => {
          setShowModal(true);
        }}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      <AddTaxCategoryModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={fetchTaxCategories}
/>

    </div>
  );
};

export default TaxCategory;
