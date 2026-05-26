import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import { AppPage , AppPageBody , AppPageHeader } from "../../components/ui/app-shell";
import ActionButton, {
    ActionGroup,
    ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { fireManagedSwal } from "../../utils/swalManager";
import type { Column } from "../../components/ui/Table/type";
import {
    showApiError,
    showSuccess,
    showLoading,
    closeSwal,
} from "../../utils/alert";
import { getEmailTemplates, deleteEmailTemplates } from "../../api/Email/EmailTemplateApi";
import type { EmailTemplate } from "../../api/Email/EmailTemplateApi";
import { openEmailTemplateModal } from "../../store/modalStore";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";
import PermissionGate from "../PermissionGate";
import { usePermission } from "../../hooks/permission/usePermission";
import { Mail } from "lucide-react";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ET_MODULE = "Email Template";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface EmailTemplatesTableProps {
    onAdd?: () => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const EmailTemplates: React.FC<EmailTemplatesTableProps> = ({ onAdd }) => {
    const { can } = usePermission();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);


    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getEmailTemplates({ page, pageSize, search: searchTerm });
            setTemplates(result.data);
            setTotalItems(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            showApiError(err);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchTerm]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchTemplates();
        }, 600);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchTemplates();
    }, [page, pageSize]);

    // Subscribe to global refresh events
    const subscribeToRefresh = useDataRefreshStore(
        (state) => state.subscribeToRefresh,
    );
    useEffect(() => {
        const unsubscribe = subscribeToRefresh(
            REFRESH_KEYS.EMAIL_TEMPLATE_LIST,
            () => fetchTemplates(),
        );
        return () => unsubscribe();
    }, [subscribeToRefresh, fetchTemplates]);

    // ── Handlers ──

    const handleAddClick = () => {
        openEmailTemplateModal();
    };

    const handleEdit = (template: EmailTemplate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openEmailTemplateModal(template.id); 
};


    const handleDelete = async (
        template: EmailTemplate,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();

        const confirm = await fireManagedSwal({
            icon: "warning",
            title: "Are you sure?",
            text: `Delete template "${template.id}"?`,
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete",
        });

        if (!confirm.isConfirmed) return;

        try {
            showLoading("Deleting template...");
            await deleteEmailTemplates({ name: template.id, doctype: "Email Template" });
            closeSwal();
            showSuccess("Email template deleted successfully");
            await fetchTemplates();
        } catch (error) {
            closeSwal();
            showApiError(error);
        }
    };

    // ── Columns ──

    const columns: Column<EmailTemplate>[] = [
        {
            key: "template_name",
            header: "Name",
            align: "left",
            render: (t) => (
                <div className="py-1.5">
                    <span className="block"> {t.id || "—"}</span>
                </div>
            ),
        },
        {
            key: "subject",
            header: "Subject",
            align: "left",
            render: (t) => (
                <div className="py-1.5">
                    <span className="block text-muted truncate max-w-xs">
                        {t.subject || "—"}
                    </span>
                </div>
            ),
            tooltip: (t) => t.subject || "—",
        },
        // {
        //     key: "id",
        //     header: "Template ID",
        //     align: "center",
        //     render: (t) => (
        //         <div className="py-1.5">
        //             <code className="inline-flex max-w-full rounded bg-row-hover px-2 py-0.5 text-xs text-main">
        //                 {t.id || "—"}
        //             </code>
        //         </div>
        //     ),
        // },

        {
            key: "actions",
            header: "Actions",
            align: "center",
            render: (t) => (
                <ActionGroup>
                    <PermissionGate module={ET_MODULE} action="write">
                        <ActionButton
                            type="edit"
                            onClick={(e) => handleEdit(t, e)}
                            iconOnly
                        />
                    </PermissionGate>

                    <ActionMenu
                        {...(can(ET_MODULE, "delete")
                            ? { onDelete: (e) => handleDelete(t, e as any) }
                            : {})}
                    />
                </ActionGroup>
            ),
        },
    ];

    return (
         <AppPage>
             <AppPageHeader
        title="Email Template"
        description="Create Email Templates"
        icon={<Mail />}
      />

            <AppPageBody>
            <Table
                columns={columns}
                tableId="email-templates"
                data={templates}
                showToolbar
                loading={loading}
                searchValue={searchTerm}
                onSearch={setSearchTerm}
                enableAdd={can(ET_MODULE, "create")}
                addLabel="Add Email Template"
                onAdd={handleAddClick}
                enableColumnSelector
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={(size) => setPageSize(size)}
                pageSizeOptions={[10, 25, 50, 100]}
            />
            </AppPageBody>
        </AppPage>
    );
};

export default EmailTemplates;