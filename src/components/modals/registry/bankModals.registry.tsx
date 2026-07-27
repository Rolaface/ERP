import { lazy } from "react";
import type { BankAccount } from "../../../types/BankAccount/bank";
import type { COAAccount } from "../../../types/coa";
import { getInitialData, getRecordInitialData, isRecord } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const AddBankAccountModal = lazy(() => import("../../CompanySetup/AddBankAccountModal"));
const AddModeOfPaymentModal = lazy(() => import("../../../views/Mode of Payment/AddModeOfPaymentModal"));
const PaymentEntryModal = lazy(() => import("../../../views/PaymentEntry/PaymentEntryModal"));
const CurrencyConversionModal = lazy(() => import("../../currencyconversion/CurrencyConversionModal"));
const BankModal = lazy(() => import("../../BankModal"));
const CoaGLAccountModal = lazy(() => import("../../Coa/NewAccountModal"));

export const bankModalsRegistry: Record<string, ModalRenderFn> = {
  bankAccount: (modal, context, { handleClose, handleSubmit }) => {
    const bankData = isRecord(modal.initialData) ? modal.initialData : null;
    return (
      <AddBankAccountModal
        key={modal.id}
        isViewMode={context?.isViewMode ?? false}
        modalId={modal.id}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialData={
          modal.isEdit ? getInitialData<BankAccount>(modal.initialData) : null
        }
        defaultAccountFor={bankData?.accountFor as any}
        partyName={bankData?.partyName as string | undefined}
        partyId={bankData?.partyId as string | undefined}
        currency={bankData?.currency as string | undefined}
      />
    );
  },

  modeOfPayment: (modal, context, { handleClose, handleSubmit }) => (
    <AddModeOfPaymentModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={getRecordInitialData(modal.initialData)}
      isEdit={modal.isEdit}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  paymentEntry: (modal, _context, { handleClose, handleSubmit }) => (
    <PaymentEntryModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      defaultValues={modal.initialData as any}
    />
  ),

  currencyExchange: (modal, context, { handleClose, handleSubmit }) => (
    <CurrencyConversionModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      editData={getInitialData(modal.initialData) as any}
      actionLoading={false}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  Bank: (modal, context, { handleClose, handleSubmit }) => (
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
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  coaGLAccount: (modal, context, { handleClose }) => {
    const d = isRecord(modal.initialData) ? modal.initialData : {};
    return (
      <CoaGLAccountModal
        key={modal.id}
        modalId={modal.id}
        isOpen={true}
        onClose={handleClose}
        onSuccess={() => {
          if (context?.onSuccess) context.onSuccess(undefined);
        }}
        parentAccount={(d.parentAccount as COAAccount) ?? null}
        editAccount={(d.editAccount as COAAccount) ?? null}
      />
    );
  },
};