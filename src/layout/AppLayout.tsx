import React, { useState, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/SideBar";
import PageLoader from "../components/ui/PageLoader";
import { ModalManagerProvider } from "../components/common/ModalManagerContext";
import { AppContentContainer, AppMain, AppShell } from "./layoutSystem";


import InvoiceModal from "../components/sales/InvoiceModal";
import ProformaInvoiceModal from "../components/sales/ProformaInvoiceModal";
import QuotationModal from "../components/sales/QuotationModal";
import CustomerModal from "../components/crm/CustomerModal";
import SupplierModal from "../components/procurement/supply/SupplierModal";
import PurchaseOrderModal from "../components/procurement/PurchaseOrderModal";
import PurchaseInvoiceModal from "../components/procurement/PurchaseInvoiceModal";
import ItemModal from "../components/inventory/ItemModal";
import ItemsCategoryModal from "../components/inventory/ItemsCategoryModal";
import { showApiError, showSuccess } from "../utils/alert";
import { createSalesInvoice } from "../api/salesApi";
import { createQuotation } from "../api/quotationApi";
import { createItemGroup, updateItemGroupById } from "../api/itemCategoryApi";

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const location = useLocation();
  const isRootDashboard = location.pathname === "/dashboard";

  // Sales modals
  const [invoiceModals, setInvoiceModals] = useState<{ id: string; initialData?: any }[]>([]);
  const [proformaModals, setProformaModals] = useState<{ id: string; initialData?: any }[]>([]);
  const [quotationModals, setQuotationModals] = useState<{ id: string; initialData?: any }[]>([]);

  // CRM modals
  const [customerModals, setCustomerModals] = useState<{ id: string; data?: any; isEdit: boolean }[]>([]);

  // Procurement modals
  const [supplierModals, setSupplierModals] = useState<{ id: string; data?: any; isEdit: boolean }[]>([]);
  const [poModals, setPoModals] = useState<{ id: string; poId?: string | number }[]>([]);
  const [piModals, setPiModals] = useState<{ id: string; pId?: string | number }[]>([]);

  // Sales handlers
  const openInvoiceCreate = () => {
    setInvoiceModals((prev) => [...prev, { id: `invoice-create-${Date.now()}` }]);
  };
  const openInvoiceEdit = (invoiceNumber: string, data: any) => {
    setInvoiceModals((prev) => [...prev, { id: `invoice-edit-${invoiceNumber}-${Date.now()}`, initialData: data }]);
  };
  const openProformaCreate = () => {
    setProformaModals((prev) => [...prev, { id: `proforma-create-${Date.now()}` }]);
  };
  const openProformaEdit = (proformaId: string, data: any) => {
    setProformaModals((prev) => [...prev, { id: `proforma-edit-${proformaId}-${Date.now()}`, initialData: data }]);
  };
  const openQuotationCreate = () => {
    setQuotationModals((prev) => [...prev, { id: `quotation-create-${Date.now()}` }]);
  };
  const openQuotationEdit = (quotationId: string, data: any) => {
    setQuotationModals((prev) => [...prev, { id: `quotation-edit-${quotationId}-${Date.now()}`, initialData: data }]);
  };

  // CRM handlers
  const openCustomerCreate = () => {
    setCustomerModals((prev) => [...prev, { id: `customer-create-${Date.now()}`, data: null, isEdit: false }]);
  };
  const openCustomerEdit = (id: string, data: any) => {
    setCustomerModals((prev) => [...prev, { id: `customer-edit-${id}-${Date.now()}`, data, isEdit: true }]);
  };

  // Procurement handlers
  const openSupplierCreate = () => {
    setSupplierModals((prev) => [...prev, { id: `supplier-create-${Date.now()}`, data: null, isEdit: false }]);
  };
  const openSupplierEdit = (id: string, data: any) => {
    setSupplierModals((prev) => [...prev, { id: `supplier-edit-${id}-${Date.now()}`, data, isEdit: true }]);
  };
  const openPOCreate = () => {
    setPoModals((prev) => [...prev, { id: `po-create-${Date.now()}`, poId: undefined }]);
  };
  // const openPOCreate = () => {
  //   setPoModals((prev) => [...prev, { id: `po-create-${Date.now()}`, poId: undefined }]);
  // };
  const openPOEdit = (poId: string | number) => {
    setPoModals((prev) => [...prev, { id: `po-edit-${poId}-${Date.now()}`, poId }]);
  };
  const openPICreate = () => {
    setPiModals((prev) => [...prev, { id: `pi-create-${Date.now()}`, pId: undefined }]);
  };
  const openPIEdit = (pId: string | number) => {
    setPiModals((prev) => [...prev, { id: `pi-edit-${pId}-${Date.now()}`, pId }]);
  };

  // Inventory modals
  const [itemModals, setItemModals] = useState<{ id: string; data?: any; isEdit: boolean }[]>([]);

  const openItemCreate = () => {
    setItemModals((prev) => [...prev, { id: `item-create-${Date.now()}`, data: null, isEdit: false }]);
  };
  const openItemEdit = (id: string, data: any) => {
    setItemModals((prev) => [...prev, { id: `item-edit-${id}-${Date.now()}`, data, isEdit: true }]);
  };

  // Item Category modals
  const [categoryModals, setCategoryModals] = useState<{ id: string; data?: any; isEdit: boolean }[]>([]);

  const openCategoryCreate = () => {
    setCategoryModals((prev) => [...prev, { id: `category-create-${Date.now()}`, data: null, isEdit: false }]);
  };
  const openCategoryEdit = (id: string, data: any) => {
    setCategoryModals((prev) => [...prev, { id: `category-edit-${id}-${Date.now()}`, data, isEdit: true }]);
  };

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

    showSuccess(response.message);
    return true;
  } catch (error: any) {
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

const handleProformaCreated = () => {
  
  };
  return (
    <ModalManagerProvider dockWidth="90">
      <AppShell sidebar={<Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}>
        <AppMain sidebarOpen={sidebarOpen}>
          <AppContentContainer viewportLocked={isRootDashboard}>
            <div className={isRootDashboard ? "flex min-h-0 flex-1 flex-col overflow-auto" : ""}>
              <Suspense fallback={<PageLoader />}>
                <Outlet
                  context={{
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
                  }}
                />
              </Suspense>
            </div>
          </AppContentContainer>
        </AppMain>

        {/* Sales Modals */}
        {invoiceModals.map((modal) => (
          <InvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setInvoiceModals((prev) => prev.filter((m) => m.id !== modal.id))}
            onSubmit={async (data) => {
              const didSave = await handleInvoiceSubmit(data);
              if (didSave) {
                setInvoiceModals((prev) => prev.filter((m) => m.id !== modal.id));
              }
              return didSave;
            }}
            initialData={modal.initialData}
            mode={modal.initialData ? "edit" : "create"}
          />
        ))}

        {proformaModals.map((modal) => (
          <ProformaInvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setProformaModals((prev) => prev.filter((m) => m.id !== modal.id))}
            onSubmit={() => {
              handleProformaCreated();
              setProformaModals((prev) => prev.filter((m) => m.id !== modal.id));
            }}
            initialData={modal.initialData}
            mode={modal.initialData ? "edit" : "create"}
          />
        ))}

        {quotationModals.map((modal) => (
          <QuotationModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setQuotationModals((prev) => prev.filter((m) => m.id !== modal.id))}
            onSubmit={handleQuotationSubmit}
            initialData={modal.initialData}
            mode={modal.initialData ? "edit" : "create"}
          />
        ))}

        {/* CRM Modals */}
        {customerModals.map((modal) => (
          <CustomerModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setCustomerModals((prev) => prev.filter((m) => m.id !== modal.id))}
            onSubmit={() => setCustomerModals((prev) => prev.filter((m) => m.id !== modal.id))}
            initialData={modal.data}
            isEditMode={modal.isEdit}
          />
        ))}

        {/* Procurement Modals */}
        {supplierModals.map((modal) => (
          <SupplierModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setSupplierModals((prev) => prev.filter((m) => m.id !== modal.id))}
            onSubmit={() => setSupplierModals((prev) => prev.filter((m) => m.id !== modal.id))}
            initialData={modal.data}
            isEditMode={modal.isEdit}
          />
        ))}

        {poModals.map((modal) => (
          <PurchaseOrderModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setPoModals((prev) => prev.filter((m) => m.id !== modal.id))}
            poId={modal.poId}
            onSubmit={() => setPoModals((prev) => prev.filter((m) => m.id !== modal.id))}
          />
        ))}

        {piModals.map((modal) => (
          <PurchaseInvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setPiModals((prev) => prev.filter((m) => m.id !== modal.id))}
            pId={modal.pId}
            onSubmit={() => setPiModals((prev) => prev.filter((m) => m.id !== modal.id))}
          />
        ))}

        {/* Inventory Modals */}
        {itemModals.map((modal) => (
          <ItemModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setItemModals((prev) => prev.filter((m) => m.id !== modal.id))}
            onSubmit={() => setItemModals((prev) => prev.filter((m) => m.id !== modal.id))}
            initialData={modal.data}
            isEditMode={modal.isEdit}
          />
        ))}

        {/* Item Category Modals */}
        {categoryModals.map((modal) => (
          <ItemsCategoryModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={() => setCategoryModals((prev) => prev.filter((m) => m.id !== modal.id))}
            onSubmit={async (data) => {
              await handleCategorySubmit(data, modal.isEdit, () => {
                setCategoryModals((prev) => prev.filter((m) => m.id !== modal.id));
              });
            }}
            initialData={modal.data}
            isEditMode={modal.isEdit}
          />
        ))}
      </AppShell>
    </ModalManagerProvider>
  );
};

export default AppLayout;
