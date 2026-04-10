import React, { Suspense } from "react";
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

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
  const location = useLocation();
  const isRootDashboard = location.pathname === "/dashboard";

  const handleInvoiceSubmit = async (payload: any) => {
    try {
      const response = await createSalesInvoice(payload);
      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return false;
      }
      showSuccess(response.message);
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
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    }
  };

  const handleItemSubmit = async (payload: any, isEdit: boolean, onSuccess: () => void) => {
    try {
      if (isEdit) {
        await updateItemGroupById(payload.id, payload);
        showSuccess("Item group updated successfully!");
      } else {
        await createItemGroupNode(payload);
        showSuccess("Item group created successfully!");
      }
      onSuccess();
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    }
  };

  const handleCategorySubmit = async (payload: any, isEdit: boolean, onSuccess: () => void) => {
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

      const isSuccess = response && [200, 201, 202].includes(response.status_code || response.status);

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
      
      onSuccess();
      return true;
    } catch (error: any) {
      showApiError(error);
      return false;
    }
  };

  const handleWarehouseSubmit = async (payload: any, isEdit: boolean, onSuccess: () => void) => {
    try {
      const response = isEdit
        ? await updateWarehouseById(payload.id, payload)
        : await createWarehouseNode(payload);
      const isSuccess = response && [200, 201, 202].includes(response.status_code || response.status);

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
      
      onSuccess();
      return true;
    } catch (error: any) {
      showApiError(error);
      return false;
    }
  };

  // Sales handlers - using Zustand modal store
  const openInvoiceCreate = () => openInvoiceModal();
  const openInvoiceEdit = (invoiceNumber: string, data: any) => openInvoiceModal({ invoiceNumber }, true);
  const openProformaCreate = () => openProformaModal();
  const openProformaEdit = (proformaId: string, data: any) => openProformaModal({ proformaId }, true);
  const openQuotationCreate = () => openQuotationModal();
  const openQuotationEdit = (quotationId: string, data: any) => openQuotationModal({ quotationId }, true);

  // CRM handlers
  const openCustomerCreate = () => openCustomerModal();
  const openCustomerEdit = (id: string, data: any) => openCustomerModal(data, true);

  // Procurement handlers
  const openSupplierCreate = () => openSupplierModal();
  const openSupplierEdit = (id: string, data: any) => openSupplierModal(data, true);
  const openPOCreate = () => openPurchaseOrderModal();
  const openPOEdit = (poId: string | number) => openPurchaseOrderModal(poId);
  const openPICreate = () => openPurchaseInvoiceModal();
  const openPIEdit = (pId: string | number) => openPurchaseInvoiceModal(pId);

  // Inventory handlers
  const openItemCreate = (context?: ModalContext) =>
    openItemModal(undefined, false, context);
  const openItemEdit = (id: string, data: any, context?: ModalContext) =>
    openItemModal(data, true, context);
  const openCategoryCreate = () => openItemCategoryModal();
  const openCategoryEdit = (id: string, data: any) => openItemCategoryModal(data, true);
  const openWarehouseCreate = (initialData?: { parent: string }) => openWarehouseModal(initialData);
  const openWarehouseEdit = (id: string, data: any) => openWarehouseModal(data, true);

  const sharedProps = {
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
  };

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
        <GlobalModalHandler />
      </AppShell>
    </QuickAddProvider>
  );
};

export default AppLayout;
