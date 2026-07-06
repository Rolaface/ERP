import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ChatWindow from "../components/chat/ChatWindow";
import { FEATURES } from "../config/features";
import Sidebar from "../components/SideBar";
import PageLoader from "../components/ui/PageLoader";
import { QuickAddProvider } from "../context/QuickAddContext";
import FloatingViewSwitch from "../components/common/FloatingViewSwitch";
import {
  openCustomerModal,
  openInvoiceModal,
  openQuotationModal,
  openSalesOrderModal,
  openSupplierModal,
  openItemModal,
  openItemCategoryModal,
  openPurchaseOrderModal,
  openPurchaseInvoiceModal,
  openProformaModal,
  openWarehouseModal,
  type ModalContext,
} from "../store/modalStore";
import { AppMain, AppShell } from "./layoutSystem";
import GlobalModalHandler from "../components/common/GlobalModalHandler";
import { FloatingMinimizedDock } from "../components/common/FloatingMinimizedDock";
import { showApiError, showSuccess } from "../utils/alert";
import { createSalesInvoice } from "../api/salesApi";
import { createQuotation } from "../api/quotationApi";
import {
  createItemGroupNode,
  renameItemGroup,
  updateItemGroupById,
} from "../api/itemGroupApi";
import { createWarehouseNode, updateWarehouseById } from "../api/WarehouseApi";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const location = useLocation();
  const publicRoutes = ["/", "/login", "/signup"];

  const isPublicRoute = publicRoutes.includes(location.pathname);

  const handleInvoiceSubmit = async (payload: any) => {
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
  };

  const handleQuotationSubmit = async (payload: any) => {
    try {
      const response = await createQuotation(payload);
      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return false;
      }
      showSuccess("Quotation created successfully!");
      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.QUOTATION_LIST);
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    }
  };

  const handleItemSubmit = async (
    payload: any,
    isEdit: boolean,
    onSuccess: () => void,
  ) => {
    try {
      if (isEdit) {
        await updateItemGroupById(payload.id, payload);
        showSuccess("Item group updated successfully!");
        useDataRefreshStore
          .getState()
          .triggerRefresh(REFRESH_KEYS.ITEM_CATEGORY_LIST);
      } else {
        await createItemGroupNode(payload);
        showSuccess("Item group created successfully!");
        useDataRefreshStore
          .getState()
          .triggerRefresh(REFRESH_KEYS.ITEM_CATEGORY_LIST);
      }
      onSuccess();
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    }
  };

  const handleCategorySubmit = async (
    payload: any,
    isEdit: boolean,
    onSuccess: () => void,
  ) => {
    try {
      let response;

      if (isEdit) {
        let targetId = payload.id;

        if (
          payload.original_name &&
          payload.original_name !== payload.item_group_name
        ) {
          const renameResp = await renameItemGroup(
            payload.original_name,
            payload.item_group_name,
          );
          if (
            !renameResp ||
            ![200, 201].includes(renameResp.status || renameResp.status_code)
          ) {
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
        response &&
        [200, 201, 202].includes(response.status_code || response.status);
      if (!isSuccess) {
        showApiError(response);
        return false;
      }

      const actionText = isEdit ? "updated" : "created";
      showSuccess(
        response.data?.message ||
          response.message ||
          `Item Group ${payload.item_group_name} ${actionText} successfully`,
      );

      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.ITEM_CATEGORY_LIST);
      onSuccess();
      return true;
    } catch (error: any) {
      showApiError(error);
      return false;
    }
  };

  const handleWarehouseSubmit = async (
    payload: any,
    isEdit: boolean,
    onSuccess: () => void,
  ) => {
    try {
      const response = isEdit
        ? await updateWarehouseById(payload.id, payload)
        : await createWarehouseNode(payload);

      const isSuccess =
        response &&
        [200, 201, 202].includes(response.status_code || response.status);
      if (!isSuccess) {
        showApiError(response);
        return false;
      }

      const actionText = isEdit ? "updated" : "created";
      showSuccess(
        response.data?.message ||
          response.message ||
          `Warehouse ${payload.warehouse_name} ${actionText} successfully`,
      );

      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.WAREHOUSE_LIST);
      onSuccess();
      return true;
    } catch (error: any) {
      showApiError(error);
      return false;
    }
  };

  // Sales handlers
  const openInvoiceCreate = () => openInvoiceModal();
  const openInvoiceEdit = (invoiceNumber: string, data: any) =>
    openInvoiceModal(data, true);
  const openProformaCreate = () => openProformaModal();
  const openProformaEdit = (proformaId: string, data: any) =>
    openProformaModal({ ...data, proformaId }, true);
  const openQuotationCreate = () => openQuotationModal();
  const openQuotationEdit = (quotationId: string, data: any) =>
    openQuotationModal({ ...data, quotationId }, true);
    const openSalesOrderCreate = () => openSalesOrderModal();
  const openSalesOrderEdit = (salesOrderId: string, data: any) =>
    openSalesOrderModal({ ...data, salesOrderId }, true);

  // CRM handlers
  const openCustomerCreate = () => openCustomerModal();
  const openCustomerEdit = (id: string, data: any) =>
    openCustomerModal(data, true);

  // Procurement handlers
  const openSupplierCreate = () => openSupplierModal();
  const openSupplierEdit = (id: string, data: any) =>
    openSupplierModal(data, true);
  const openPOCreate = () => openPurchaseOrderModal();
  const openPOEdit = (poId: string | number) => openPurchaseOrderModal(poId);
  const openPICreate = () => openPurchaseInvoiceModal();
  const openPIEdit = (pId: string | number) => openPurchaseInvoiceModal(pId);

  // Inventory handlers
  const openItemCreate = (context?: ModalContext) =>
    openItemModal(undefined, false, context);
  const openItemEdit = (id: string, data: any, context?: ModalContext) =>
    openItemModal(data, true, context);
  const openCategoryCreate = (options?: {
    parent?: string;
    onSuccess?: () => void;
  }) =>
    openItemCategoryModal({ parent: options?.parent }, false, {
      onSuccess: options?.onSuccess,
    });
  const openCategoryEdit = (
    id: string,
    data: any,
    options?: { onSuccess?: () => void },
  ) => openItemCategoryModal(data, true, { onSuccess: options?.onSuccess });
  const openWarehouseCreate = (options?: {
    parent?: string;
    onSuccess?: () => void;
  }) =>
    openWarehouseModal({ parent: options?.parent }, false, {
      onSuccess: options?.onSuccess,
    });
  const openWarehouseEdit = (
    id: string,
    data: any,
    options?: { onSuccess?: () => void },
  ) => openWarehouseModal(data, true, { onSuccess: options?.onSuccess });

  const sharedProps = {
    openInvoiceCreate,
    openInvoiceEdit,
    openProformaCreate,
    openProformaEdit,
    openQuotationCreate,
    openQuotationEdit,
    openSalesOrderCreate,
    openSalesOrderEdit,
    openCustomerCreate,
    openCustomerEdit,
    openSupplierCreate,
    openSupplierEdit,
    openPOCreate,
    openPOEdit,
    openPICreate,
    openPIEdit,
    openItemCreate,
    openItemEdit,
    openCategoryCreate,
    openCategoryEdit,
    openWarehouseCreate,
    openWarehouseEdit,
    handleInvoiceSubmit,
    handleQuotationSubmit,
    handleItemSubmit,
    handleCategorySubmit,
    handleWarehouseSubmit,
  };

  if (isPublicRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    );
  }

  return (
    <QuickAddProvider>
      <AppShell
        sidebar={<Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}
      >
        <AppMain sidebarOpen={sidebarOpen}>
          {/* ← wrapper div hataya — flex chain unbroken rehti hai ab */}
          <Suspense fallback={<PageLoader />}>
            <Outlet context={sharedProps} />
          </Suspense>
        </AppMain>
        <FloatingViewSwitch />
        <GlobalModalHandler />
        {FEATURES.CHAT_ENABLED && (
          <ChatWindow
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen((prev) => !prev)}
          />
        )}
      </AppShell>
      <FloatingMinimizedDock />
    </QuickAddProvider>
  );
};

export default AppLayout;
