import { salesModalsRegistry } from "./salesModals.registry";
import { procurementModalsRegistry } from "./procurementModals.registry";
import { inventoryModalsRegistry } from "./inventoryModals.registry";
import { taxModalsRegistry } from "./taxModals.registry";
import { fixedAssetModalsRegistry } from "./fixedAssetModals.registry";
import { bankModalsRegistry } from "./bankModals.registry";
import { accountingModalsRegistry } from "./accountingModals.registry";
import { employeeModalsRegistry } from "./employeeModals.registry";
import { payrollModalsRegistry } from "./payrollModals.registry";
import { leaveModalsRegistry } from "./leaveModals.registry";
import { employeeSetupModalsRegistry } from "./employeeSetupModals.registry";
import { performanceModalsRegistry } from "./performanceModals.registry";
import { userModalsRegistry } from "./userModals.registry";
import { expenseModalsRegistry } from "./expenseModals.registry";
import { emailModalsRegistry } from "./emailModals.registry";
import { schedulerModalsRegistry } from "./schedulerModals.registry";
import { importModalsRegistry } from "./importModalsRegistry";
import type { ModalRenderFn } from "./registryTypes";

export const modalRegistry: Record<string, ModalRenderFn> = {
  ...salesModalsRegistry,
  ...procurementModalsRegistry,
  ...inventoryModalsRegistry,
  ...taxModalsRegistry,
  ...fixedAssetModalsRegistry,
  ...bankModalsRegistry,
  ...accountingModalsRegistry,
  ...employeeModalsRegistry,
  ...payrollModalsRegistry,
  ...leaveModalsRegistry,
  ...employeeSetupModalsRegistry,
  ...performanceModalsRegistry,
  ...userModalsRegistry,
  ...expenseModalsRegistry,
  ...emailModalsRegistry,
  ...schedulerModalsRegistry,
  ...importModalsRegistry,
};