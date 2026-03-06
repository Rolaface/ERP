import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import type {
  ApplyLeavePayload,
  UpdateLeaveStatusPayload,
  UpdateLeaveStatusResponse,
  PendingLeaveResponse,
  UpdateLeaveApplicationPayload,
  UpdateLeaveApplicationResponse,
  CreateLeaveAllocationPayload,
  CreateLeaveAllocationResponse,
  LeaveAllocationListResponse,
} from "../types/leave/leave";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const LeaveAPI = API.leave;

export async function applyLeave(payload: ApplyLeavePayload): Promise<any> {
  const resp: AxiosResponse = await api.post(LeaveAPI.create, payload);
  return resp.data;
}

export async function getAllEmployeeLeaveHistory(
  page: number = 1,
  pageSize: number = 100,
): Promise<any> {
  const resp: AxiosResponse = await api.get(LeaveAPI.getAll, {
    params: {
      page,
      page_size: pageSize,
    },
  });

  return resp.data;
}

export async function updateLeaveStatus(
  payload: UpdateLeaveStatusPayload,
): Promise<UpdateLeaveStatusResponse> {
  const resp = await api.patch(LeaveAPI.updateStatus, payload);

  return resp.data;
}

export async function getPendingLeaveRequests(
  page: number = 1,
  pageSize: number = 100,
): Promise<PendingLeaveResponse> {
  const resp: AxiosResponse = await api.get(LeaveAPI.getPending, {
    params: {
      page,
      page_size: pageSize,
    },
  });

  return resp.data;
}

export async function getLeaveHistoryByEmployee(
  employeeId: string,
  page: number = 1,
  pageSize: number = 10,
) {
  const resp: AxiosResponse = await api.get(LeaveAPI.getByEmployee, {
    params: {
      employeeId,
      page,
      pageSize,
    },
  });

  return resp.data;
}

export async function getLeaveById(leaveId: string) {
  const resp: AxiosResponse = await api.get(LeaveAPI.getById, {
    params: { leaveId },
  });

  return resp.data;
}

export async function cancelLeave(leaveId: string) {
  const resp = await api.patch(LeaveAPI.cancel, { leaveId });

  return resp.data;
}

export async function updateLeaveApplication(
  payload: UpdateLeaveApplicationPayload,
): Promise<UpdateLeaveApplicationResponse> {
  const resp = await api.patch(LeaveAPI.update, payload);

  return resp.data;
}

export async function createLeaveAllocation(
  payload: CreateLeaveAllocationPayload,
): Promise<CreateLeaveAllocationResponse> {
  const resp = await api.post(LeaveAPI.createAllocation, payload);

  return resp.data;
}

export async function getLeaveAllocationsByEmployee(
  employeeId: string,
  page = 1,
  pageSize = 10,
): Promise<LeaveAllocationListResponse> {
  const resp = await api.get(LeaveAPI.getAllocationsByEmployee, {
    params: {
      employeeId,
      page,
      pageSize,
    },
  });

  return resp.data;
}

export async function getEmployeeLeaveBalanceReport(params: {
  employeeId: string;
  fromDate: string;
  toDate: string;
  page?: number;
  page_size?: number;
}) {
  const resp = await api.get(LeaveAPI.getBalance, {
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 100,
      employeeId: params.employeeId,
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
  });

  return resp.data;
}

export async function getHolidays(params?: {
  page?: number;
  page_size?: number;
}) {
  const resp: AxiosResponse = await api.get(LeaveAPI.getHolidays, {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 20,
    },
  });

  return resp.data;
}
