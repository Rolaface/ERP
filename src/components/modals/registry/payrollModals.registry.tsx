import { lazy } from "react";
import type { SalaryComponent, PayrollPeriod, SalaryStructure } from "../../../api/payrollConfigApi";
import type { PayrollVerificationData } from "../../../api/payroll/payrollEntryApi";
import { getInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const NewPayrollEntry = lazy(() => import("../../../views/hr/payroll-system/Newpayrollentry"));
const SalaryComponentModal = lazy(() =>
  import("../../Hr/hrsetupmodals/Salarycomponentmodal").then((m) => ({
    default: m.SalaryComponentModal,
  })),
);
const SalaryStructureModal = lazy(() =>
  import("../../Hr/hrsetupmodals/Salarystructuremodal").then((m) => ({
    default: m.SalaryStructureModal,
  })),
);
const PayrollPeriodModal = lazy(() =>
  import("../../Hr/hrsetupmodals/PayrollPeriodModal").then((m) => ({
    default: m.PayrollPeriodModal,
  })),
);
const TaxConfigModal = lazy(() =>
  import("../../Hr/hrsetupmodals/TaxConfigModal").then((m) => ({
    default: m.TaxConfigModal,
  })),
);
const PayrollPreviewModal = lazy(() => import("../../../views/hr/payroll-system/PayrollPreview"));

export const payrollModalsRegistry: Record<string, ModalRenderFn> = {
  payroll: (modal, context, { handleClose }) => (
    <NewPayrollEntry
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onBack={handleClose}
      initialData={modal.initialData as any}
      isEdit={modal.isEdit}
      onSuccess={async (empIds: any, formData: any) => {
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
    />
  ),

  salaryComponent: (modal, context, { handleClose }) => (
    <SalaryComponentModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData<SalaryComponent>(modal.initialData)}
      isViewMode={context?.isViewMode ?? false}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),

  salaryStructure: (modal, context, { handleClose: _handleClose }) => (
    <SalaryStructureModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={_handleClose}
      initialData={getInitialData<SalaryStructure>(modal.initialData)}
      earningComponents={[]}
      deductionComponents={[]}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),

  Payrollperiod: (modal, context, { handleClose }) => (
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
    />
  ),

  taxConfig: (modal, context, { handleClose }) => (
    <TaxConfigModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),

  payrollPreview: (modal, context, { handleClose }) => (
    <PayrollPreviewModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      rawData={modal.initialData as PayrollVerificationData | null}
      loading={context?.loading as boolean | undefined}
    />
  ),
};