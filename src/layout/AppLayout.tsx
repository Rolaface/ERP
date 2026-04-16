import React, { Suspense, useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/SideBar";
import PageLoader from "../components/ui/PageLoader";
import { QuickAddProvider } from "../context/QuickAddContext";
import {
  openCustomerModal,
  openInvoiceModal,
  openQuotationModal,
  openSupplierModal,
  openItemModal,
  openItemCategoryModal,
  openPurchaseOrderModal,
  openPurchaseInvoiceModal,
  openProformaModal,
  openWarehouseModal,
  type ModalContext,
} from "../store/modalStore";
import { AppMain, AppShell, AppContentContainer, RightPanel } from "./layoutSystem";
import GlobalModalHandler from "../components/common/GlobalModalHandler";
import { showApiError, showSuccess } from "../utils/alert";
import { createSalesInvoice } from "../api/salesApi";
import { createQuotation } from "../api/quotationApi";
import { createItemGroupNode, renameItemGroup, updateItemGroupById } from "../api/itemGroupApi";
import { createWarehouseNode, updateWarehouseById } from "../api/WarehouseApi";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
  const location = useLocation();
  const isRootDashboard = location.pathname === "/dashboard";

  // ─── Submit handlers ────────────────────────────────────────────────────────
  // All deps are stable module-level imports or Zustand .getState() calls,
  // so the dep array is genuinely empty — these references never change.

  const handleInvoiceSubmit = useCallback(async (payload: any) => {
    try {
      const response = await createSalesInvoice(payload);
      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return false;
      }
      showSuccess(response.message);
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.INVOICE_LIST);
      return true;
    } catch (error: any) {
      showApiError(error);
      return false;
    }
  }, []);

  const handleQuotationSubmit = useCallback(async (payload: any) => {
    try {
      const response = await createQuotation(payload);
      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return false;
      }
      showSuccess("Quotation created successfully!");
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.QUOTATION_LIST);
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    }
  }, []);

  const handleItemSubmit = useCallback(async (
    payload: any,
    isEdit: boolean,
    onSuccess: () => void
  ) => {
    try {
      if (isEdit) {
        await updateItemGroupById(payload.id, payload);
        showSuccess("Item group updated successfully!");
      } else {
        await createItemGroupNode(payload);
        showSuccess("Item group created successfully!");
      }
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.ITEM_CATEGORY_LIST);
      onSuccess();
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    }
  }, []);

  const handleCategorySubmit = useCallback(async (
    payload: any,
    isEdit: boolean,
    onSuccess: () => void
  ) => {
    try {
      let response;

      if (isEdit) {
        let targetId = payload.id;

        if (payload.original_name && payload.original_name !== payload.item_group_name) {
          const renameResp = await renameItemGroup(payload.original_name, payload.item_group_name);
          if (!renameResp || ![200, 201].includes(renameResp.status || renameResp.status_code)) {
            showApiError(renameResp);
            return false;
          }
          targetId = payload.item_group_name;
        }

        response = await updateItemGroupById(targetId, payload);
      } else {
        response = await createItemGroupNode(payload);
      }

      const isSuccess =
        response && [200, 201, 202].includes(response.status_code || response.status);

      if (!isSuccess) {
        showApiError(response);
        return false;
      }

      const actionText = isEdit ? "updated" : "created";
      showSuccess(
        response.data?.message ||
          response.message ||
          `Item Group ${payload.item_group_name} ${actionText} successfully`
      );

      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.ITEM_CATEGORY_LIST);
      onSuccess();
      return true;
    } catch (error: any) {
      showApiError(error);
      return false;
    }
  }, []);

  const handleWarehouseSubmit = useCallback(async (
    payload: any,
    isEdit: boolean,
    onSuccess: () => void
  ) => {
    try {
      const response = isEdit
        ? await updateWarehouseById(payload.id, payload)
        : await createWarehouseNode(payload);

      const isSuccess =
        response && [200, 201, 202].includes(response.status_code || response.status);

      if (!isSuccess) {
        showApiError(response);
        return false;
      }

      const actionText = isEdit ? "updated" : "created";
      showSuccess(
        response.data?.message ||
          response.message ||
          `Warehouse ${payload.warehouse_name} ${actionText} successfully`
      );

      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.WAREHOUSE_LIST);
      onSuccess();
      return true;
    } catch (error: any) {
      showApiError(error);
      return false;
    }
  }, []);

  // ─── Modal openers ───────────────────────────────────────────────────────────
  // These are all thin wrappers around stable Zustand store actions.
  // useCallback with [] ensures they're created once and never change.

  // Sales
  const openInvoiceCreate = useCallback(() => openInvoiceModal(), []);
  const openInvoiceEdit = useCallback(
    (invoiceNumber: string, _data: any) => openInvoiceModal({ invoiceNumber }, true),
    []
  );
  const openProformaCreate = useCallback(() => openProformaModal(), []);
  const openProformaEdit = useCallback(
    (proformaId: string, _data: any) => openProformaModal({ proformaId }, true),
    []
  );
  const openQuotationCreate = useCallback(() => openQuotationModal(), []);
  const openQuotationEdit = useCallback(
    (quotationId: string, _data: any) => openQuotationModal({ quotationId }, true),
    []
  );

  // CRM
  const openCustomerCreate = useCallback(() => openCustomerModal(), []);
  const openCustomerEdit = useCallback(
    (_id: string, data: any) => openCustomerModal(data, true),
    []
  );

  // Procurement
  const openSupplierCreate = useCallback(() => openSupplierModal(), []);
  const openSupplierEdit = useCallback(
    (_id: string, data: any) => openSupplierModal(data, true),
    []
  );
  const openPOCreate = useCallback(() => openPurchaseOrderModal(), []);
  const openPOEdit = useCallback(
    (poId: string | number) => openPurchaseOrderModal(poId),
    []
  );
  const openPICreate = useCallback(() => openPurchaseInvoiceModal(), []);
  const openPIEdit = useCallback(
    (pId: string | number) => openPurchaseInvoiceModal(pId),
    []
  );

  // Inventory
  const openItemCreate = useCallback(
    (context?: ModalContext) => openItemModal(undefined, false, context),
    []
  );
  const openItemEdit = useCallback(
    (id: string, data: any, context?: ModalContext) => openItemModal(data, true, context),
    []
  );
  const openCategoryCreate = useCallback(
    (options?: { parent?: string; onSuccess?: () => void }) =>
      openItemCategoryModal({ parent: options?.parent }, false, { onSuccess: options?.onSuccess }),
    []
  );
  const openCategoryEdit = useCallback(
    (id: string, data: any, options?: { onSuccess?: () => void }) =>
      openItemCategoryModal(data, true, { onSuccess: options?.onSuccess }),
    []
  );
  const openWarehouseCreate = useCallback(
    (options?: { parent?: string; onSuccess?: () => void }) =>
      openWarehouseModal({ parent: options?.parent }, false, { onSuccess: options?.onSuccess }),
    []
  );
  const openWarehouseEdit = useCallback(
    (id: string, data: any, options?: { onSuccess?: () => void }) =>
      openWarehouseModal(data, true, { onSuccess: options?.onSuccess }),
    []
  );

  // ─── Stable context object ───────────────────────────────────────────────────
  // useMemo ensures the object reference only changes if one of the callbacks
  // above changes — which they never will (all [] deps). This means every
  // React.memo'd consumer (InvoiceTable, QuotationsTable, etc.) is correctly
  // protected from re-renders caused by sidebar toggles or other layout state.

  const sharedProps = useMemo(() => ({
    // Sales
    openInvoiceCreate,
    openInvoiceEdit,
    openProformaCreate,
    openProformaEdit,
    openQuotationCreate,
    openQuotationEdit,
    // CRM
    openCustomerCreate,
    openCustomerEdit,
    // Procurement
    openSupplierCreate,
    openSupplierEdit,
    openPOCreate,
    openPOEdit,
    openPICreate,
    openPIEdit,
    // Inventory
    openItemCreate,
    openItemEdit,
    openCategoryCreate,
    openCategoryEdit,
    openWarehouseCreate,
    openWarehouseEdit,
    // Submit handlers
    handleInvoiceSubmit,
    handleQuotationSubmit,
    handleItemSubmit,
    handleCategorySubmit,
    handleWarehouseSubmit,
  }), [
    openInvoiceCreate, openInvoiceEdit,
    openProformaCreate, openProformaEdit,
    openQuotationCreate, openQuotationEdit,
    openCustomerCreate, openCustomerEdit,
    openSupplierCreate, openSupplierEdit,
    openPOCreate, openPOEdit,
    openPICreate, openPIEdit,
    openItemCreate, openItemEdit,
    openCategoryCreate, openCategoryEdit,
    openWarehouseCreate, openWarehouseEdit,
    handleInvoiceSubmit, handleQuotationSubmit,
    handleItemSubmit, handleCategorySubmit, handleWarehouseSubmit,
  ]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  // GlobalModalHandler is rendered OUTSIDE AppShell so that modal open/close/
  // submit state changes cannot propagate up through AppShell and cause
  // sharedProps consumers to re-render.

  return (
    <QuickAddProvider>
      <AppShell
        sidebar={<Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}
        rightPanel={<RightPanel />}
      >
        <AppMain sidebarOpen={sidebarOpen}>
          <AppContentContainer viewportLocked={isRootDashboard}>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <Suspense fallback={<PageLoader />}>
                <Outlet context={sharedProps} />
              </Suspense>
            </div>
          </AppContentContainer>
        </AppMain>
      </AppShell>

      {/* Rendered outside AppShell — modal state changes are isolated from the
          layout tree and cannot trigger re-renders in the data tables. */}
      <GlobalModalHandler />
    </QuickAddProvider>
  );
};

export default AppLayout;