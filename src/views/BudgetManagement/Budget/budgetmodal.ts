import { defineModal } from "../../../store/modal/defineModal";
import BudgetModal from "../Budget/addBudgetModal";

export const openBudgetModal = defineModal("budgetForm", BudgetModal);