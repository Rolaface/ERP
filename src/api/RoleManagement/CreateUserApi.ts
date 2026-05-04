import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type { CreateUserFormData } from "../../types/RoleManagement/CreateUser";

const api = createAxiosInstance(ERP_BASE);

export interface LanguageOption {
    value: string;
    description: string;
    label: string;
}

export interface GetLanguagesResponse {
    message: LanguageOption[];
}

export async function getLanguages(search?: string): Promise<LanguageOption[]> {
    const resp: AxiosResponse<GetLanguagesResponse> = await api.get(
        API.RoleManagement.Language,
        {
            params: {
                txt: search ?? "",
                doctype: "Language",
                reference_doctype: "User",
                page_length: 20,
                link_fieldname: "language",
            },
        }
    );
    return resp.data.message ?? [];
}


export interface CreateUserResponse {
    message: {
        status: "success" | "error";
        data: string;
    };
}

export async function createUser(
    payload: CreateUserFormData
): Promise<CreateUserResponse> {
    const params = new URLSearchParams();

    params.append("email", payload.email);
    params.append("username", payload.username);
    params.append("language", payload.language);
    params.append("firstName", payload.firstName);
    params.append("middleName", payload.middleName ?? "");
    params.append("lastName", payload.lastName ?? "");
    params.append("gender", payload.gender ?? "");
    params.append("phone", payload.phone ?? "");
    params.append("dob", payload.dob ?? "");
    params.append("timezone", payload.timezone ?? "");
    params.append("mobile_no", payload.mobile_no ?? "");
    params.append("roleIds", JSON.stringify(payload.roleIds));

    const resp: AxiosResponse<CreateUserResponse> = await api.post(
        `${API.RoleManagement.createUser}?${params.toString()}`
    );
    return resp.data;
}


export interface UserRow {
    id: string;
    email: string;
    name: string;
    username: string;
    enabled: 0 | 1;
    creation: string;
}

export interface GetUsersResponse {
    status_code: number;
    status: "success" | "error";
    message: string;
    data: UserRow[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export async function getUsers(
    search?: string,
    page = 1,
    pageSize = 10
): Promise<GetUsersResponse> {
    const resp: AxiosResponse<GetUsersResponse> = await api.get(
        API.RoleManagement.getUser,
        {
            params: {
                search: search || undefined,
                page,
                page_size: pageSize,
            },
        }
    );
    return resp.data;
}

export interface GetUserByIdResponse {
    message: {
        status: "success" | "error";
        data: {
            firstName: string;
            lastName: string;
            fullName: string;
            middleName: string;
            email: string;
            gender: string;
            username: string;
            language: string;
            timezone: string;
            dob: string | null;
            phone: string;
            mobile_no: string | null;
            roles: string[]; 
        };
    };
}

export async function getUserById(id: string): Promise<GetUserByIdResponse> {
    const resp: AxiosResponse<GetUserByIdResponse> = await api.get(
        API.RoleManagement.getUserbyId,
        { params: { id } }
    );
    return resp.data;
}

export async function updateUser(
    id: string,
    payload: CreateUserFormData
): Promise<CreateUserResponse> {
    const params = new URLSearchParams();

    params.append("id", id);
    params.append("username", payload.username);
    params.append("language", payload.language);
    params.append("firstName", payload.firstName);
    params.append("middleName", payload.middleName ?? "");
    params.append("lastName", payload.lastName ?? "");
    params.append("gender", payload.gender ?? "");
    params.append("phone", payload.phone ?? "");
    params.append("dob", payload.dob ?? "");
    params.append("timezone", payload.timezone ?? "");
    params.append("mobile_no", payload.mobile_no ?? "");
    params.append("roleIds", JSON.stringify(payload.roleIds));

    const resp: AxiosResponse<CreateUserResponse> = await api.put(
        `${API.RoleManagement.updateUser}?${params.toString()}`
    );
    return resp.data;
}

export async function deleteUser(id: string): Promise<any> {
  const resp: AxiosResponse = await api.post(API.RoleManagement.deleteUser, {
    name: id,
    doctype: "User",
  });

  return resp;
}
