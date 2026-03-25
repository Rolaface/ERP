import  { useState } from "react";
import BankAccountSetup from "./BankAccountSetup";
import type { BankAccount } from "../../types/company";

const BankAccountPage = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  return (
    <BankAccountSetup
      bankAccounts={bankAccounts}
      setBankAccounts={setBankAccounts}
    />
  );
};

export default BankAccountPage;