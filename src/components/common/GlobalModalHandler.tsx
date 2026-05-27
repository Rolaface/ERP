import React, { useEffect, Suspense, lazy } from "react";
import { useModalStore } from "../../store/modalStore";
import type { ModalInstance, ModalType } from "../../store/modalStore";
import type { ModalSubmitHandler } from "../../types/modal";
import { useQuickAdd } from "../../context/QuickAddContext";
import type { CustomerDetail } from "../../types/customer";
import type { Supplier } from "../../types/Supply/supplier";
import type { ItemInitialData } from "../inventory/ItemModal";
import type { FeedbackRow } from "../../components/Hr/performance/section/AddFeedbackModal";

import type { SetupRow } from "../../views/hr/performace/types";
import type { TaxCategoryFormData as TaxTemplateFormData } from "../../types/tax/taxTemplate";
import type { SalesTaxTemplateFormData } from "../../types/tax/salesTemplate";
import type { BankAccount } from "../../types/BankAccount/bank";
import type { UserRoleFormData } from "../../types/RoleManagement/UserRole";
import { createUserRoles } from "../../api/RoleManagement/UserRoleApi";
import { showSuccess } from "../../utils/alert";
const AddKRAModal = lazy(
  () => import("../../components/Hr/performance/section/AddKRAModal"),
)
import type { CreateUserFormData } from "../../types/RoleManagement/CreateUser";
const AddFeedbackModal = lazy(
  () => import("../../components/Hr/performance/section/AddFeedbackModal"),
);

import { createUser } from "../../api/RoleManagement/CreateUserApi";
import type { SalaryComponent, PayrollPeriod, SalaryStructure } from "../../api/payrollConfigApi";


import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import type { LeaveApplication } from "../../api/leaveApplicationApi";
import type { LeaveType } from "../../api/leaveConfigApi";

const CustomerModal = lazy(() => import("../crm/CustomerModal"));
const SupplierModal = lazy(() => import("../procurement/supply/SupplierModal"));
const InvoiceModal = lazy(() => import("../sales/InvoiceModal"));
const ProformaInvoiceModal = lazy(
  () => import("../sales/ProformaInvoiceModal"),
);
const ExpenseModal = lazy(
  () => import("../../components/expense/addExpenseModal"),
);
const QuotationModal = lazy(() => import("../sales/QuotationModal"));
const PurchaseOrderModal = lazy(
  () => import("../procurement/PurchaseOrderModal"),
);
const JournalEntriesModal = lazy(
  () => import("../JournalEntries/JournalEntriesModal"),
);
const PurchaseInvoiceModal = lazy(
  () => import("../procurement/PurchaseInvoiceModal"),
);
const ItemModal = lazy(() => import("../inventory/ItemModal"));
const ItemsCategoryModal = lazy(
  () => import("../inventory/ItemsCategoryModal"),
);
const WarehouseModal = lazy(() => import("../inventory/WarehouseModal"));
const TaxTemplateModalComponent = lazy(
  () => import("../../companies/taxMaintaince/TaxTemplateModal"),
);
const TaxCategoryModalComponent = lazy(
  () => import("../inventory/TaxCategoryModal"),
);
const SalesTaxTemplateModalComponent = lazy(
  () => import("../../companies/taxMaintaince/SalesTempleteModal"),
);
const AddBankAccountModal = lazy(
  () => import("../CompanySetup/AddBankAccountModal"),
);
const AddModeOfPaymentModal = lazy(
  () => import("../../views/Mode of Payment/AddModeOfPaymentModal"),
);
const PaymentEntryModal = lazy(
  () => import("../../views/PaymentEntry/PaymentEntryModal"),
);
const CurrencyConversionModal = lazy(
  () => import("../currencyconversion/CurrencyConversionModal"),
);
const AddAssetModal = lazy(
  () => import("../../components/FixedAsset/AddAssetModal"),
);
const AddAssetMovementModal = lazy(
  () => import("../../components/FixedAsset/Addassetmovementmodal "),
);
const RfqModal = lazy(() => import("../procurement/rfq/RfqModal"));
const CreditNoteModal = lazy(
  () => import("../../views/Sales/CreateCreditNoteModal"),
);
const DebitNoteModal = lazy(
  () => import("../../views/Sales/createDebitNoteModal"),
);
const AssignUserRoleModal = lazy(
  () => import("../../components/User/AssignUserRoleModal"),
);
const BankModal = lazy(() => import("../../components/BankModal"));
const CreateUserModal = lazy(
  () => import("../../components/User/CreateUserModal"),
);
const EmployeeModal = lazy(
  () => import("../../components/Hr/employeedirectorymodal/AddEmployeeModal"),
);

const NewPayrollEntry = lazy(
  () => import("../../views/hr/payroll-system/Newpayrollentry"),
);
const SalaryComponentModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/Salarycomponentmodal").then((m) => ({
      default: m.SalaryComponentModal,
    })),
);
const SalaryStructureModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/Salarystructuremodal").then((m) => ({
      default: m.SalaryStructureModal,
    })),
);
const LeaveApplyModal = lazy(
  () =>
    import("../../components/Hr/hrsetupmodals/LeaveApplyModal"),
);
const LeaveTypeModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/LeaveTypeModal").then((m) => ({
      default: m.LeaveTypeModal,
    })),
);
const LeavePeriodModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/LeavePeriodModal").then((m) => ({
      default: m.LeavePeriodModal,
    })),
);
const LeavePolicyModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/LeavePolicyModal").then((m) => ({
      default: m.LeavePolicyModal,
    })),
); const LeavePolicyAssignmentModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/LeavePolicyAssignmentModal").then((m) => ({
      default: m.LeavePolicyAssignmentModal,
    })),
);
const HolidayListModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/HolidayListModal").then((m) => ({
      default: m.HolidayListModal,
    })),
);
const ShiftTypeModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/ShiftTypeModal").then((m) => ({
      default: m.ShiftTypeModal,
    })),
);
const TaxConfigModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/TaxConfigModal").then((m) => ({
      default: m.TaxConfigModal,
    })),
);
const DepartmentModal = lazy(
  () =>
    import("../empployeesetupmodal/DepartmentModal").then((m) => ({
      default: m.DepartmentModal,
    })),
);
const modalFallback = (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);
const DesignationModal = lazy(
  () =>
    import("../empployeesetupmodal/DesignationModal").then((m) => ({
      default: m.DesignationModal,
    })),
);
const GradeModal = lazy(
  () =>
    import("../empployeesetupmodal/GradeModal").then((m) => ({
      default: m.GradeModal,
    })),
);
const EmployeeTypeModal = lazy(
  () =>
    import("../empployeesetupmodal/EmployeeTypeModal").then((m) => ({
      default: m.EmployeeTypeModal,
    })),
);
const PayrollPeriodModal = lazy(
  () =>
    import("../Hr/hrsetupmodals/PayrollPeriodModal").then((m) => ({
      default: m.PayrollPeriodModal,
    })),
);
const EmailTemplateModal = lazy(
  () => import("../../components/Email/EmailTemplatemodal"),
);
const ScanPIModal = lazy(
  () => import("../../views/Procurement/ScanPurchaseInvoiceModal"),
);
const NewCycleModal = lazy(
  () => import("../../components/Hr/performance/Newcyclemodal")
)

const AppraisalModal = lazy(() => import("../../components/Hr/performance/AppraisalFormModal"));
const FeedbackModal = lazy(() => import("../../components/Hr/performance/FeedbackModal"));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getInitialData = <T,>(value: unknown): T | null =>
  isRecord(value) ? (value as T) : null;

const getRecordInitialData = (
  value: unknown,
): Record<string, unknown> | null => (isRecord(value) ? value : null);
const ExpenseTypeModal = lazy(
  () => import("../../components/expense/addExpenseTypeModal"),
);

const getModalSeedValue = (
  value: unknown,
  key: string,
): string | number | undefined => {
  if (!isRecord(value)) return undefined;
  const seedValue = value[key];
  return typeof seedValue === "string" || typeof seedValue === "number"
    ? seedValue
    : undefined;
};

const toQuickAddText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const GlobalModalHandler: React.FC = () => {
  const { modals, closeModal, getModalContext } = useModalStore();
  const { pending, completeQuickAdd, cancelQuickAdd } = useQuickAdd();

  useEffect(() => {
    if (pending) {
      const entityTypeMap: Partial<Record<string, ModalType>> = {
        invoice: "invoice",
        proforma: "proforma",
        quotation: "quotation",
        purchaseOrder: "purchaseOrder",
        purchaseInvoice: "purchaseInvoice",
        JournalEntries: "JournalEntries",
        customer: "customer",
        supplier: "supplier",
        item: "item",
        customerGroup: "itemCategory",
        taxTemplate: "taxTemplate",
        taxCategory: "taxCategory",
        employeemodal: "employee",
        leaveApplymodal: "leaveApply",
      };

      const modalType = entityTypeMap[pending.entityType];
      if (modalType) {
        useModalStore.getState().openModal(modalType, null, false, {
          source: "quickAdd",
          fieldId: pending.fieldId,
          callback: pending.callback,
          onSuccess: (data) => {
            if (!isRecord(data)) return;
            completeQuickAdd({
              id: toQuickAddText(data.id || data.customerId),
              name: toQuickAddText(data.name),
            });
          },
        });
      }
    }
  }, [pending, completeQuickAdd]);

  const renderModal = (modal: ModalInstance) => {
    const context = modal.context || getModalContext(modal.id);

    const handleClose = () => {
      if (context?.source === "quickAdd") {
        cancelQuickAdd();
      }
      closeModal(modal.id);
    };

    const handleSubmit: ModalSubmitHandler = async (data) => {
      if (context?.onSuccess) {
        await context.onSuccess(data);
      }

      if (context?.callback) {
        await context.callback(data);
      }

      return true;
    };

    const wrappedModal = (modalContent: React.ReactNode) => (
      <Suspense fallback={modalFallback}>{modalContent}</Suspense>
    );

    switch (modal.type) {
      case "customer":
        return wrappedModal(
          <CustomerModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<CustomerDetail>(modal.initialData)}
            isEditMode={modal.isEdit}
          />,
        );

      case "supplier":
        return wrappedModal(
          <SupplierModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<Supplier>(modal.initialData)}
            isEditMode={modal.isEdit}
          />,
        );

      case "invoice":
        return wrappedModal(
          <InvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
            mode={modal.isEdit ? "edit" : "create"}
          />,
        );

      case "proforma":
        return wrappedModal(
          <ProformaInvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
          />,
        );

      case "quotation":
        return wrappedModal(
          <QuotationModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
          />,
        );

      case "purchaseOrder":
        return wrappedModal(
          <PurchaseOrderModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            poId={getModalSeedValue(modal.initialData, "poId")}
          />,
        );

      case "purchaseInvoice":
        return wrappedModal(
          <PurchaseInvoiceModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            pId={getModalSeedValue(modal.initialData, "pId")}
          />,
        );
      case "expense":
        return wrappedModal(
          <ExpenseModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
          />,
        );
      case "expenseType":
        return wrappedModal(
          <ExpenseTypeModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
          />,
        );
      case "JournalEntries":
        return wrappedModal(
          <JournalEntriesModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
          />,
        );
      case "item":
        return wrappedModal(
          <ItemModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<ItemInitialData>(modal.initialData)}
            isEditMode={modal.isEdit}
          />,
        );

      case "itemCategory":
        return wrappedModal(
          <ItemsCategoryModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getRecordInitialData(modal.initialData)}
            isEditMode={modal.isEdit}
          />,
        );

      case "taxTemplate":
        return wrappedModal(
          <TaxTemplateModalComponent
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<TaxTemplateFormData>(modal.initialData)}
            isEditMode={modal.isEdit}
          />,
        );

      case "warehouse":
        return wrappedModal(
          <WarehouseModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getRecordInitialData(modal.initialData)}
            isEditMode={modal.isEdit}
          />,
        );

      case "taxCategory":
        return wrappedModal(
          <TaxCategoryModalComponent
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={async (data) => {
              await handleSubmit(data);
            }}
          />,
        );
      case "salesTax":
        return wrappedModal(
          <SalesTaxTemplateModalComponent
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<SalesTaxTemplateFormData>(
              modal.initialData,
            )}
            isEditMode={modal.isEdit}
          />,
        );
      case "bankAccount": {
        const bankData = isRecord(modal.initialData) ? modal.initialData : null;
        return wrappedModal(
          <AddBankAccountModal
            key={modal.id}
            isViewMode={context?.isViewMode ?? false}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}

            onSubmit={handleSubmit}
            initialData={
              modal.isEdit
                ? getInitialData<BankAccount>(modal.initialData)
                : null
            }
            defaultAccountFor={bankData?.accountFor as any}
            partyName={bankData?.partyName as string | undefined}
            partyId={bankData?.partyId as string | undefined}
            currency={bankData?.currency as string | undefined}
          />,
        );
      }
      case "modeOfPayment":
        return wrappedModal(
          <AddModeOfPaymentModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getRecordInitialData(modal.initialData)}
            isEdit={modal.isEdit}
          />,
        );

      case "paymentEntry":
        return wrappedModal(
          <PaymentEntryModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            defaultValues={modal.initialData as any}
          />,
        );

      case "currencyExchange":
        return wrappedModal(
          <CurrencyConversionModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            editData={getInitialData(modal.initialData) as any}
            actionLoading={false}
          />,
        );
      case "fixedAsset":
        return wrappedModal(
          <AddAssetModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getRecordInitialData(modal.initialData) as any}
            mode={modal.isEdit ? "edit" : "create"}
          />,
        );
      case "assetMovement":
        return wrappedModal(
          <AddAssetMovementModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getRecordInitialData(modal.initialData) as any}
            mode={modal.isEdit ? "edit" : "create"}
          />,
        );
      case "Rfq":
        return wrappedModal(
          <RfqModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData as string}
            isEdit={modal.isEdit}
            isViewMode={context?.isViewMode ?? false}
          />,
        );

      case "CreditNote":
        return wrappedModal(
          <CreditNoteModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData as string}
            isEdit={modal.isEdit}
          />,
        );

      case "DebitNote":
        return wrappedModal(
          <DebitNoteModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData as string}
            isEdit={modal.isEdit}
          />,
        );

      case "UserRole":
        return wrappedModal(
          <AssignUserRoleModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={async (data: UserRoleFormData) => {
              if (modal.isEdit && context?.onSubmit) {
                await context.onSubmit(data);
                showSuccess("Role updated successfully");
              } else {
                const response = await createUserRoles(data);
                if (response.message.status !== "success") {
                  throw new Error("Operation failed");
                }
                showSuccess("Role created successfully");
              }
              if (context?.onSuccess) {
                await context.onSuccess(undefined);
              }
              handleClose();
            }}
            initialData={
              modal.isEdit && isRecord(modal.initialData)
                ? (modal.initialData as unknown as UserRoleFormData)
                : null
            }
            isEdit={modal.isEdit}
          />,
        );

      case "Bank":
        return wrappedModal(
          <BankModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={getInitialData<{
              bank_name: string;
              swift_number: string;
              name?: string;
            }>(modal.initialData)}
            isEditMode={modal.isEdit}
          />,
        );

      case "User":
        return wrappedModal(
          <CreateUserModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData<CreateUserFormData>(modal.initialData)}
            isEditMode={modal.isEdit}
            onSubmit={
              modal.isEdit && context?.onSubmit
                ? async (data: CreateUserFormData) => {
                  await context.onSubmit!(data);
                  showSuccess("User updated successfully");
                  useDataRefreshStore
                    .getState()
                    .triggerRefresh(REFRESH_KEYS.CREATE_USER_LIST);
                  if (context?.onSuccess) await context.onSuccess(undefined);
                  handleClose();
                }
                : async (data: CreateUserFormData) => {
                  const response = await createUser(data);
                  if (response.message.status === "success") {
                    showSuccess("User created successfully");
                    useDataRefreshStore
                      .getState()
                      .triggerRefresh(REFRESH_KEYS.CREATE_USER_LIST);
                    if (context?.onSuccess)
                      await context.onSuccess(response.message.data);
                    handleClose();
                  } else {
                    throw new Error("User creation failed");
                  }
                }
            }
          />,
        );

      case "employee":
        return wrappedModal(
          <EmployeeModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            editData={modal.isEdit ? modal.initialData : undefined}
            mode={modal.isEdit ? "edit" : "add"}
          />,
        );



      case "payroll":
        return wrappedModal(
          <NewPayrollEntry
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onBack={handleClose}
            initialData={modal.initialData as any}
            isEdit={modal.isEdit}
            onSuccess={async (empIds, formData) => {
              try {
                if (context?.onSubmit) {
                  await context.onSubmit({ empIds, formData });
                }
                handleClose();
              } catch (error) {
                console.error(error);
                throw error;
              }
            }}
          />,
        );
      case "salaryComponent":
        return wrappedModal(
          <SalaryComponentModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData<SalaryComponent>(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );
      case "salaryStructure":
        return wrappedModal(
          <SalaryStructureModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData<SalaryStructure>(modal.initialData)}
            earningComponents={[]}
            deductionComponents={[]}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
            }}
          />,
        );

      case "taxConfig":
        return wrappedModal(
          <TaxConfigModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
            }}
          />,
        );
      case "department":
        return wrappedModal(
          <DepartmentModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
            }}
          />,
        );

      case "designation":
        return wrappedModal(
          <DesignationModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
            }}
          />,
        );

      case "grade":
        return wrappedModal(
          <GradeModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
            }}
          />,
        );

      case "employeeType":
        return wrappedModal(
          <EmployeeTypeModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
            }}
          />,
        );

      case "leaveApply":
        return wrappedModal(
          <LeaveApplyModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData<LeaveApplication>(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );

      case "Payrollperiod":
        return wrappedModal(
          <PayrollPeriodModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData<PayrollPeriod>(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );

      case "leaveType":
        return wrappedModal(
          <LeaveTypeModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData<LeaveType>(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );

      case "leavePeriod":
        return wrappedModal(
          <LeavePeriodModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );

      case "leavePolicy":
        return wrappedModal(
          <LeavePolicyModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );

      case "leavePolicyAssignment":
        return wrappedModal(
          <LeavePolicyAssignmentModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );

      case "emailTemplate":
        return wrappedModal(
          <EmailTemplateModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            templateId={
              getModalSeedValue(modal.initialData, "templateId") as
              | string
              | undefined
            }
            isViewMode={context?.isViewMode ?? false}
          />,
        );



      case "holidayList":
        return wrappedModal(
          <HolidayListModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
            }}
          />,
        );

      case "shiftType":
        return wrappedModal(
          <ShiftTypeModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            initialData={getInitialData(modal.initialData)}
            onSuccess={() => {
              if (context?.onSuccess) context.onSuccess(undefined);

            }}
          />,
        );

      case "scanPI":
        return wrappedModal(
          <ScanPIModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            piId={
              getModalSeedValue(
                modal.initialData,
                "pId",
              ) as string | undefined
            }
          />,
        );
      case "KRA":
        return wrappedModal(
          <AddKRAModal
            key={modal.id}
            modalId={modal.id}
            selectedKRA={getInitialData<SetupRow>(modal.initialData)}
            isViewMode={modal.context?.isViewMode ?? false}
            onClose={handleClose}
            onAdd={(row) => {
              if (context?.onSuccess) context.onSuccess(row);
              handleClose();
            }}
          />,
        );
      // Add case in renderModal switch:
      case "feedback":
        return wrappedModal(
          <AddFeedbackModal
            key={modal.id}
            modalId={modal.id}
            selectedFeedback={getInitialData<FeedbackRow>(modal.initialData)}
            isViewMode={modal.context?.isViewMode ?? false}
            onClose={handleClose}
            onAdd={() => {
              if (context?.onSuccess) context.onSuccess(undefined);
              handleClose();
            }}
          />,
        );
      case "appraisalCycle":
        return wrappedModal(
          <NewCycleModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSave={async (payload) => {
              if (context?.onSubmit) await context.onSubmit(payload);
              handleClose();
            }}
          />,
        );

      case "appraisal":
        return wrappedModal(
          <AppraisalModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
            mode={modal.isEdit ? "edit" : "create"}
          />,
        );

      case "employeeFeedback":
        return wrappedModal(
          <FeedbackModal
            key={modal.id}
            modalId={modal.id}
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={modal.initialData}
            mode={modal.isEdit ? "edit" : "create"}
          />,
        );

    }
  };

  return (
    <>
      {modals.map((modal) => (
        <React.Fragment key={modal.id}>{renderModal(modal)}</React.Fragment>
      ))}
    </>
  );
};

export default GlobalModalHandler;
