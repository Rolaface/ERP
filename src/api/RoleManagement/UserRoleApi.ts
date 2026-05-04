import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { UserRoleFormData } from "../../types/RoleManagement/UserRole";

import { API, ERP_BASE } from "../../config/api";
const api = createAxiosInstance(ERP_BASE);

export const UserRoleAPI = API.RoleManagement;

export interface CreateUserRoleResponse {
  message: {
    status: "success" | "error";
    data: {
      roleId: string;
    };
  };
}

export async function createUserRoles(
  payload: UserRoleFormData
): Promise<CreateUserRoleResponse> {
  const resp: AxiosResponse<CreateUserRoleResponse> = await api.post(
    UserRoleAPI.createUserRoles,
    payload
  );
  return resp.data;
}

export interface GetUserRolesResponse {
  status_code: number;
  status: "success" | "error";
  message: string;
  data: {
    Id: string;
    roleName: string;
    disabled: 0 | 1;
  }[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}


export async function getUserRoles(
  search?: string,
  page?: number,
  pageSize?: number
): Promise<GetUserRolesResponse> {
  const resp: AxiosResponse<GetUserRolesResponse> = await api.get(
    UserRoleAPI.getUserRoles,
    {
      params: {
        ...(search ? { search } : {}),
        ...(page ? { page } : {}),
        ...(pageSize ? { page_size: pageSize } : {}),
      },
    }
  );
  return resp.data;
}


export interface GetUserRoleByIdResponse {
  message: {
    status: "success" | "error";
    data: {
      roleId: string;
      roleName: string;
      permissions: {
        module: string;
        read: 0 | 1;
        write: 0 | 1;
        create: 0 | 1;
        delete: 0 | 1;
        report: 0 | 1;
        import: 0 | 1;
        export: 0 | 1;
      }[];
    };
  };
}

export async function getUserRoleById(id: string): Promise<GetUserRoleByIdResponse> {
  const resp: AxiosResponse<GetUserRoleByIdResponse> = await api.get(
    UserRoleAPI.getUserRolesbyId,
    { params: { id } }
  );
  return resp.data;
}


export async function updateUserRoles(
  payload: UserRoleFormData
): Promise<CreateUserRoleResponse> {
  const resp: AxiosResponse<CreateUserRoleResponse> = await api.put(
    UserRoleAPI.updateUserRoles,
    {
      role_id: payload.role, 
      permission: payload.permission,
    }

  );
  return resp.data;
}


export interface UpdateUserRoleStatusResponse {
  message: {
    status: "success" | "error";
    data: string;
  };
}

export async function updateUserRoleStatus(
  id: string,
  isDisabled: 0 | 1
): Promise<UpdateUserRoleStatusResponse> {
  const resp: AxiosResponse<UpdateUserRoleStatusResponse> = await api.put(
    UserRoleAPI.updateUserRolesStatus,
    { id, isDisabled }
  );
  return resp.data;
}