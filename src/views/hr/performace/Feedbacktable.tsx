import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
    useMemo,
} from "react";
import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { useDataRefreshStore, REFRESH_KEYS } from "../../../store/dataRefreshStore";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";
import { usePermission } from "../../../hooks/permission/usePermission";
import PermissionGate from "../../PermissionGate";
import { openFeedbackModal } from "../../../store/modalStore";

const FEEDBACK_MODULE = "Employee Performance Feedback";


interface FeedbackItem {
    name: string;
    for_employee: string;
    for_employee_name?: string;
    reviewer: string;
    reviewer_name?: string;
    added_on?: string;
    company?: string;
}

interface FeedbackTableProps {
    onAddFeedback?: () => void;
}

const FeedbackTable: React.FC<FeedbackTableProps> = ({ onAddFeedback }) => {
    const mountedRef = useRef(true);
    const { can } = usePermission();

    // ── Data ──────────────────────────────────────────────────────────────────
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    // ── Pagination ────────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // ── Search ────────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("added_on");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => { setPage(1); }, [searchTerm]);
    const fetchFeedbacks = useCallback(async () => {
        setFeedbacks([]);
        setTotalPages(1);
        setTotalItems(0);
        setIsFetching(false);
        setIsInitialLoad(false);
    }, []);
    useEffect(() => {
        mountedRef.current = true;
        fetchFeedbacks();
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (isInitialLoad) return;
        fetchFeedbacks();
    }, [page, pageSize, sortBy, sortOrder, searchTerm]);

    useEffect(() => {
        const unsubscribe = useDataRefreshStore
            .getState()
            .subscribeToRefresh(REFRESH_KEYS.FEEDBACK_LIST, () => fetchFeedbacks());
        return unsubscribe;
    }, [fetchFeedbacks]);

    const handleSortChange = ({
        sortBy: col,
        sortOrder: order,
    }: { sortBy: string; sortOrder: "asc" | "desc" }) => {
        setSortBy(col);
        setSortOrder(order);
        setPage(1);
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (name: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        const result = await fireManagedSwal({
            icon: "warning",
            title: "Are you sure?",
            text: `Delete this feedback record?`,
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            showLoading("Deleting feedback...");
            closeSwal();

            setFeedbacks((prev) =>
                prev.filter((f) => f.name !== name)
            );

            showSuccess("Feedback removed successfully");
        } catch (err: any) {
            closeSwal();
            showApiError(
                err?.message?.includes("not yet wired")
                    ? "Delete API is not yet available. Please wire the endpoint."
                    : err,
            );
        }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────
    const handleEdit = (feedback: FeedbackItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        openFeedbackModal(feedback, true);
    };

    // ── Format date ───────────────────────────────────────────────────────────
    const formatDate = (d?: string) => {
        if (!d) return "—";
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return d;
        return `${String(parsed.getDate()).padStart(2, "0")}-${months[parsed.getMonth()]}-${parsed.getFullYear()}`;
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: Column<FeedbackItem>[] = useMemo(
        () => [
            {
                key: "name",
                header: "ID",
                align: "left",
                sortable: true,
                render: (row) => (
                    <div className="py-1.5">
                        <span className="block text-xs text-muted">{row.name}</span>
                    </div>
                ),
            },
            {
                key: "for_employee",
                header: "For Employee",
                align: "left",
                sortable: true,
                render: (row) => (
                    <div className="py-1.5">
                        <span className="block font-medium">{row.for_employee_name ?? row.for_employee}</span>
                        {row.for_employee_name && (
                            <span className="block text-xs text-muted">{row.for_employee}</span>
                        )}
                    </div>
                ),
                tooltip: (row) => `Employee: ${row.for_employee}`,
            },
            {
                key: "reviewer",
                header: "Reviewer",
                align: "left",
                sortable: true,
                render: (row) => (
                    <div className="py-1.5">
                        <span className="block font-medium">{row.reviewer_name ?? row.reviewer}</span>
                        {row.reviewer_name && (
                            <span className="block text-xs text-muted">{row.reviewer}</span>
                        )}
                    </div>
                ),
            },
            {
                key: "added_on",
                header: "Added On",
                align: "center",
                sortable: true,
                render: (row) => (
                    <div className="py-1.5">
                        <span className="block">{formatDate(row.added_on)}</span>
                    </div>
                ),
            },
            {
                key: "company",
                header: "Company",
                align: "left",
                render: (row) => (
                    <div className="py-1.5">
                        <span className="block">{row.company || "—"}</span>
                    </div>
                ),
            },
            {
                key: "actions",
                header: "Actions",
                align: "center",
                render: (row) => (
                    <div className="flex items-center justify-center gap-2">
                        <PermissionGate module={FEEDBACK_MODULE} action="write">
                            <ActionButton
                                type="edit"
                                onClick={(e) => handleEdit(row, e)}
                                iconOnly
                            />
                        </PermissionGate>
                        <ActionMenu
                            {...(can(FEEDBACK_MODULE, "delete")
                                ? { onDelete: (e) => handleDelete(row.name, e) }
                                : {})}
                        />
                    </div>
                ),
            },
        ],
        [handleDelete, handleEdit],
    );

    return (
        <div className="h-full min-h-0">
            <Table
                columns={columns}
                data={feedbacks}
                rowKey={(row) => row.name}
                tableId="employee-feedback"
                loading={isInitialLoad}
                isFetching={isFetching}
                showToolbar
                searchValue={searchTerm}
                onSearch={(q) => { setSearchTerm(q); setPage(1); }}
                enableAdd={can(FEEDBACK_MODULE, "create")}
                addLabel="Add Feedback"
                onAdd={onAddFeedback}
                enableColumnSelector
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                pageSizeOptions={[10, 25, 50]}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                onPageChange={setPage}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                emptyMessage="No feedback records found. Feedback API will be available soon."
            />
        </div>
    );
};

export default FeedbackTable;