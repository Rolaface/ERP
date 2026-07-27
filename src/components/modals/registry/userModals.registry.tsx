import { lazy } from "react";
import type { UserRoleFormData } from "../../../types/RoleManagement/UserRole";
import type { CreateUserFormData } from "../../../types/RoleManagement/CreateUser";
import { createUserRoles } from "../../../api/RoleManagement/UserRoleApi";
import { createUser } from "../../../api/RoleManagement/CreateUserApi";
import { showSuccess } from "../../../utils/alert";
import { useDataRefreshStore, REFRESH_KEYS } from "../../../store/dataRefreshStore";
import { isRecord } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const AssignUserRoleModal = lazy(() => import("../../User/AssignUserRoleModal"));
const CreateUserModal = lazy(() => import("../../User/CreateUserModal"));

export const userModalsRegistry: Record<string, ModalRenderFn> = {
  UserRole: (modal, context, { handleClose }) => (
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
        isRecord(modal.initialData)
          ? (modal.initialData as unknown as UserRoleFormData)
          : null
      }
      isEdit={modal.isEdit}
    />
  ),

  User: (modal, context, { handleClose }) => (
    <CreateUserModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={
        isRecord(modal.initialData)
          ? (modal.initialData as unknown as CreateUserFormData)
          : null
      }
      isEditMode={modal.isEdit}
      isViewMode={modal.context?.isViewMode ?? false}
      onSubmit={
        modal.isEdit && context?.onSubmit
          ? async (data: CreateUserFormData) => {
              await context.onSubmit!(data);
              showSuccess("User updated successfully");
              useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.CREATE_USER_LIST);

              if (context?.onSuccess) {
                await context.onSuccess(undefined);
              }
              handleClose();
            }
          : async (data: CreateUserFormData) => {
              const response = await createUser(data);

              if (response.message.status !== "success") {
                throw new Error(response.message.data || "User creation failed");
              }

              showSuccess("User created successfully");
              useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.CREATE_USER_LIST);

              if (context?.onSuccess) {
                await context.onSuccess(response.message.data);
              }
              handleClose();
            }
      }
    />
  ),
};