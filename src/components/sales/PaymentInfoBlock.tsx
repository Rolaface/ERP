import React from "react";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";

interface PaymentInfo {
  paymentTerms: string;
  paymentMethod: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export interface PaymentInfoBlockProps {
  data: PaymentInfo;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  paymentMethodOptions: readonly SelectOption[];
  showPaymentMethod?: boolean;
  showPaymentTerms?: boolean;
}

const PaymentInfoBlock: React.FC<PaymentInfoBlockProps> = ({
  data,
  onChange,
  paymentMethodOptions,
  showPaymentMethod = true,
  showPaymentTerms = true,
}) => {
  return (
    <div className="grid grid-cols-6 gap-3">
      {showPaymentTerms && (
        <ModalInput
          label="Payment Terms"
          name="paymentTerms"
          value={data.paymentTerms}
          onChange={onChange}
        />
      )}

      {showPaymentMethod && (
        <ModalSelect
          label="Payment Method"
          required
          name="paymentMethod"
          value={data.paymentMethod}
          onChange={onChange}
          options={[...paymentMethodOptions]}
        />
      )}

      <ModalInput
        label="Bank Name"
        name="bankName"
        value={data.bankName}
        onChange={onChange}
      />

      <ModalInput
        label="Account Number"
        name="accountNumber"
        value={data.accountNumber}
        onChange={onChange}
      />

      <ModalInput
        label="Routing Number / IBAN"
        name="routingNumber"
        value={data.routingNumber}
        onChange={onChange}
      />

      <ModalInput
        label="SWIFT / BIC"
        name="swiftCode"
        value={data.swiftCode}
        onChange={onChange}
      />
    </div>
  );
};

export default PaymentInfoBlock;
