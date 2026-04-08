import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/SideBar";
import PageLoader from "../components/ui/PageLoader";
import { ModalManagerProvider } from "../components/common/ModalManagerContext";
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
  openProformaModal 
} from "../store/modalStore";
import { AppMain, AppShell, AppContentContainer, RightPanel } from "./layoutSystem";
import GlobalModalHandler from "../components/common/GlobalModalHandler";
import { showApiError, showSuccess } from "../utils/alert";
import { createSalesInvoice } from "../api/salesApi";
import { createQuotation } from "../api/quotationApi";
import { createItemGroup, updateItemGroupById } from "../api/itemCategoryApi";
import { createItemGroupNode, getItemGroupTree } from "../api/itemGroupApi";

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
        await createItemGroup(payload);
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
      const response = isEdit
        ? await updateItemGroupById(payload.id, payload)
        : await createItemGroup(payload);

      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return false;
      }

      showSuccess(response.message);
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
  const openItemCreate = () => openItemModal();
  const openItemEdit = (id: string, data: any) => openItemModal(data, true);
  const openCategoryCreate = () => openItemCategoryModal();
  const openCategoryEdit = (id: string, data: any) => openItemCategoryModal(data, true);

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
    getItemGroupTree,
    // Submit handlers
    handleInvoiceSubmit,
    createItemGroupNode,
  

    handleQuotationSubmit,
    handleItemSubmit,
    handleCategorySubmit,
  };

  return (
    <ModalManagerProvider>
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
    </ModalManagerProvider>
  );
};

export default AppLayout;