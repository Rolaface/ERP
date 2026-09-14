import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";

import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { getAllSalesInvoices } from "../../api/salesApi";
import { getAllPdcInvoices, createPdcInvoice, updatePdcInvoice, deletePdcInvoiceById, downloadPdcAttachment } from "../../api/pdcApi";

import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";

import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";

import { Paperclip, Check, X } from "lucide-react";
import DatePickerInput from "../../components/calendar/DatePickerInput";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PdcStatus = "Unused" | "Used" | "Expired" | "Discard";

export interface PdcInvoice {
  id: string; // server doc name
  invoiceNumber: string; // document_name
  refNumber: string; // cheque_reference_number
  date: string; // cheque_date, yyyy-mm-dd
  amount: string;
  attachment: string | null; // attachment url/filename from the server, or null
  status: PdcStatus;
}

const PDC_MODULE = "PDC Invoice";
const DOCUMENT_TYPE = "Sales Invoice";

const STATUS_OPTIONS: PdcStatus[] = ["Unused", "Used", "Expired", "Discard"];

const STATUS_FILTER_OPTIONS = STATUS_OPTIONS.map((s) => ({ label: s, value: s }));

// Table column key → backend sort field. Add real backend field names here
// once confirmed; falls back to the column key itself if not mapped.
const SORT_FIELD_MAP: Record<string, string> = {
  invoiceNumber: "document_name",
  refNumber: "cheque_reference_number",
  date: "cheque_date",
  amount: "amount",
  status: "status",
};

const mapSortField = (field: string) => SORT_FIELD_MAP[field] ?? field;

// StatusBadge's built-in status→variant map (VARIANT_MAP in StatusBadge.tsx)
// doesn't know "Unused"/"Discard", so we pass an explicit variant override
// per PDC status to reuse the same badge component/styling as invoices.
const STATUS_VARIANT: Record<PdcStatus, "success" | "info" | "warning" | "danger"> = {
  Used: "success",
  Unused: "info",
  Expired: "warning",
  Discard: "danger",
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  if (!iso) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [year, month, day] = iso.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
};

const makeDraftId = () =>
  `pdc-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface PdcTableProps {
  onAddPdc?: () => void;
}

const PdcTable: React.FC<PdcTableProps> = () => {
  const mountedRef = useRef(true);

  // ── PDC rows — API-backed
  const [rows, setRows] = useState<PdcInvoice[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [draft, setDraft] = useState<PdcInvoice | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Search / sort / filter / pagination (server-driven, same pattern as InvoiceTable)
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("creation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<{
    status?: string[];
    from_date?: string;
    to_date?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Invoice number options for the dropdown, sourced from real Sales Invoices
  const [invoiceOptions, setInvoiceOptions] = useState<string[]>([]);
  const [invoiceOptionsLoading, setInvoiceOptionsLoading] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Fetch PDC list

  const fetchPdcInvoices = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await getAllPdcInvoices(
        page,
        pageSize,
        mapSortField(sortBy),
        sortOrder,
        searchTerm,
        filters.status && filters.status.length > 0
          ? filters.status.join(",")
          : undefined,
        filters.from_date,
        filters.to_date,
      );

      if (!mountedRef.current) return;

      if (res?.status_code === 200) {
        const mapped: PdcInvoice[] = (res.data ?? []).map((item: any) => ({
          id: item.name ?? item.id,
          invoiceNumber: item.document_name,
          refNumber: item.cheque_reference_number,
          date: item.cheque_date,
          amount: item.amount != null ? String(item.amount) : "",
          attachment: item.attachment ?? null,
          status: item.status as PdcStatus,
        }));
        setRows(mapped);
        setTotalPages(res.pagination?.total_pages || 1);
        setTotalItems(res.pagination?.total || mapped.length);
      } else {
        showApiError(res || "Failed to fetch PDC invoices");
        setRows([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      if (mountedRef.current) {
        showApiError(err);
        setRows([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);

  useEffect(() => {
    fetchPdcInvoices();
  }, [fetchPdcInvoices]);

  // ── Reset to page 1 when search/filters change (same as InvoiceTable)
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // ── Invoice options for the dropdown (Draft + Unpaid sales invoices)

  const fetchInvoiceOptions = useCallback(async (): Promise<string[]> => {
    setInvoiceOptionsLoading(true);
    try {
      const res = await getAllSalesInvoices(
        1,
        100,
        "creation",
        "desc",
        "",
        undefined,
        undefined,
          "Unpaid,Draft,Overdue",
        undefined,
        undefined,
      );

      if (!mountedRef.current) return [];

      if (res?.status_code === 200) {
        const options = (res.data ?? []).map((inv: any) => inv.id as string);
        setInvoiceOptions(options);
        return options;
      }
      setInvoiceOptions([]);
      return [];
    } catch (err) {
      if (mountedRef.current) {
        showApiError(err);
        setInvoiceOptions([]);
      }
      return [];
    } finally {
      if (mountedRef.current) setInvoiceOptionsLoading(false);
    }
  }, []);

  // ── Add / Edit / Save / Cancel / Delete

  const handleAdd = async () => {
    const options = await fetchInvoiceOptions();
    const newRow: PdcInvoice = {
      id: makeDraftId(),
      invoiceNumber: options[0] ?? "",
      refNumber: "",
      date: "",
      amount: "",
      attachment: null,
      status: "Unused",
    };
    setRows((prev) => [newRow, ...prev]);
    setDraft(newRow);
    setAttachmentFile(null);
    setEditingId(newRow.id);
    setAddingNew(true);
  };

  const handleEdit = async (row: PdcInvoice) => {
    await fetchInvoiceOptions();
    setDraft({ ...row });
    setAttachmentFile(null);
    setEditingId(row.id);
    setAddingNew(false);
  };

  const handleCancel = () => {
    if (addingNew && editingId) {
      setRows((prev) => prev.filter((r) => r.id !== editingId));
    }
    setEditingId(null);
    setDraft(null);
    setAttachmentFile(null);
    setAddingNew(false);
  };

  const handleSave = async () => {
    if (!draft) return;

      const refNumber = String(draft.refNumber ?? "").trim();
    const amount = String(draft.amount ?? "").trim();

    if (!addingNew) {
      try {
        setSaving(true);
        showLoading("Updating PDC invoice...");

        const res = await updatePdcInvoice(draft.id, {
          document_type: DOCUMENT_TYPE,
          document_name: draft.invoiceNumber,
  cheque_reference_number: refNumber,
          cheque_date: draft.date,
          amount: amount,
          status: draft.status,
          attachment: attachmentFile,
        });

        closeSwal();

        if (res?.status_code === 200) {
          showSuccess(res?.message || "PDC invoice updated");
          setEditingId(null);
          setDraft(null);
          setAttachmentFile(null);
          setAddingNew(false);
          fetchPdcInvoices();
        } else {
          showApiError(res?.message || "Failed to update PDC invoice");
        }
      } catch (err) {
        closeSwal();
        showApiError(err);
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      setSaving(true);
      showLoading("Saving PDC invoice...");

      const res = await createPdcInvoice({
        document_type: DOCUMENT_TYPE,
        document_name: draft.invoiceNumber,
          cheque_reference_number: refNumber,
        cheque_date: draft.date,
       amount: amount,
        status: draft.status,
        attachment: attachmentFile,
      });

      closeSwal();

      if (res?.status_code === 200 || res?.status_code === 201) {
        showSuccess(res?.message || "PDC invoice added");
        setEditingId(null);
        setDraft(null);
        setAttachmentFile(null);
        setAddingNew(false);
        fetchPdcInvoices();
      } else {
        // Remove the optimistic draft row since the create failed
        setRows((prev) => prev.filter((r) => r.id !== draft.id));
        showApiError(res?.message || "Failed to save PDC invoice");
      }
    } catch (err) {
      closeSwal();
      setRows((prev) => prev.filter((r) => r.id !== draft.id));
      showApiError(err);
        setEditingId(null);
      setDraft(null);
      setAttachmentFile(null);
      setAddingNew(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: PdcInvoice) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete PDC entry ${row.refNumber || row.invoiceNumber}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting PDC invoice...");
      const res = await deletePdcInvoiceById(row.id);
      closeSwal();

      if (res?.status_code && res.status_code !== 200) {
        showApiError(res?.message || "Failed to delete PDC invoice");
        return;
      }

      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (editingId === row.id) {
        setEditingId(null);
        setDraft(null);
      }
      showSuccess("PDC invoice deleted");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const updateDraft = (field: keyof PdcInvoice, value: string | null) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

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

  // ── Columns

  const columns: Column<PdcInvoice>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice No",
        align: "left",
        sortable: true,
        render: (row) => {
          if (editingId === row.id && draft) {
            return (
              <select
                className="w-full box-sizing-border-box px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                value={draft.invoiceNumber}
                disabled={invoiceOptionsLoading}
                onChange={(e) => updateDraft("invoiceNumber", e.target.value)}
              >
                {invoiceOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <div className="py-1.5">
              <span className="block text-[#1a2b5c]">{row.invoiceNumber}</span>
            </div>
          );
        },
      },
      {
        key: "refNumber",
        header: "Reference Number",
        align: "left",
        sortable: true,
        render: (row) => {
          if (editingId === row.id && draft) {
            return (
              <input
                type="text"
                className="w-full box-sizing-border-box px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                value={draft.refNumber}
                onChange={(e) => updateDraft("refNumber", e.target.value)}
              />
            );
          }
          return (
            <div className="py-1.5">
              <span className="block">{row.refNumber}</span>
            </div>
          );
        },
      },
      {
        key: "date",
        header: "Date",
        align: "left",
        sortable: true,
        render: (row) => {
          if (editingId === row.id && draft) {
            return (
              <DatePickerInput
                label=""
                name="date"
                value={draft.date}
                required
                onChange={(name, value) => updateDraft(name as keyof PdcInvoice, value)}
              />
            );
          }
          return (
            <div className="py-1.5">
              <span className="block">{row.date ? formatDate(row.date) : "—"}</span>
            </div>
          );
        },
      },
      {
        key: "amount",
        header: "Amount",
        align: "left",
        sortable: true,
        render: (row) => {
          if (editingId === row.id && draft) {
            return (
              <input
                type="text"
                className="w-full box-sizing-border-box px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                value={draft.amount}
                  onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) {
                    updateDraft("amount", val);
                  }
                }}
              />
            );
          }
          return (
            <div className="py-1.5">
              <span className="block whitespace-nowrap">
                {row.amount || "—"}
              </span>
            </div>
          );
        },
      },
      {
        key: "attachment",
        header: "Attachment",
        align: "center",
        render: (row) => {
          if (editingId === row.id) {
            return (
              <label className="inline-flex items-center gap-1 border border-dashed border-gray-300 rounded-md px-2 py-1 text-[11px] text-gray-500 cursor-pointer">
                <Paperclip size={13} />
                <span className="max-w-[90px] truncate">
                  {attachmentFile ? attachmentFile.name : "Attach"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                />
              </label>
            );
          }
          return (
            <div className="py-1.5 flex items-center justify-center gap-1">
              {row.attachment ? (
                <button
                type="button"
                  aria-label="Download attachment"
                onClick={async () => {
                    try {
                      await downloadPdcAttachment(row.attachment!);
                    } catch (err) {
                      showApiError(err);
                    }
                  }}
                  className="flex items-center gap-1 text-gray-500 hover:text-[#1a2b5c] max-w-[160px]"
                  title={row.attachment.split("/").pop()}
                >
                  <Paperclip size={15} />
                   <span className="truncate text-xs">
                    {row.attachment.split("/").pop()}
                 </span>
                </button>
              ) : (
                <span>–</span>
              )}
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        align: "left",
        sortable: true,
        render: (row) => {
          if (editingId === row.id && draft) {
            return (
              <select
                className="w-full box-sizing-border-box px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                value={draft.status}
                onChange={(e) =>
                  updateDraft("status", e.target.value as PdcStatus)
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <div className="py-1.5">
              <StatusBadge status={row.status} variant={STATUS_VARIANT[row.status]} />
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "",
        align: "center",
        render: (row) => {
          if (editingId === row.id) {
            return (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  aria-label="Save row"
                  onClick={handleSave}
                  disabled={saving}
                  className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Cancel edit"
                  onClick={handleCancel}
                  disabled={saving}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            );
          }
          return (
            <div className="flex items-center justify-center gap-2">
                <ActionButton
                type="edit"
               onClick={() => handleEdit(row)}
                iconOnly
                disabled={!!editingId}
                title="Edit PDC entry"
              />
              <ActionMenu
                showDownload={false}
                onDelete={() => handleDelete(row)}
                customActions={[]}
              />
            </div>
          );
        },
      },
    ],
    [editingId, draft, invoiceOptions, invoiceOptionsLoading, attachmentFile, saving],
  );

  return (
     <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        tableId="pdc-invoices"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
         enableAdd={!editingId}
        addLabel="Record PDC"
        onAdd={handleAdd}
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 35, 45, 55, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        multiSelectFilters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_FILTER_OPTIONS,
            values: filters.status ?? [],
            onChange: (vals) => {
              setFilters((prev) => ({
                ...prev,
                status: vals.length > 0 ? vals : undefined,
              }));
              setPage(1);
            },
          },
        ]}
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
    </div>
  );
};

export default PdcTable;