import type { ManagedUser } from "@/app/users/user-types";
import type { PlatformOption } from "@/api/platforms";

type ApiErrorResponse = {
  message?: string;
  details?: string[];
};

export type UserPage = {
  content: ManagedUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  platforms?: PlatformOption[];
};

export type UserManagementFilters = {
  platforms: PlatformOption[];
  workSchedules: PlatformOption[];
  roles: { code: string }[];
};

export type UserManagementListFilters = {
  platformId?: number;
  withoutPlatform?: boolean;
  workScheduleId?: number;
  withoutWorkSchedule?: boolean;
  roleCode?: string;
  search?: string;
};

export type CreateUserRequest = {
  email: string;
  password: string;
};

export type UpdateUserRequest = {
  email: string;
  roles: string[];
};

async function responseError(response: Response) {
  const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return error?.details?.join(" ") || error?.message || "Could not load users. Please try again.";
}

export async function deleteUser(email: string): Promise<void> {
  const response = await fetch(`/api/users/${encodeURIComponent(email)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error(await responseError(response));
}

export async function createUser(user: CreateUserRequest): Promise<ManagedUser> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as ManagedUser;
}

export async function updateUser(currentEmail: string, user: UpdateUserRequest): Promise<ManagedUser> {
  const response = await fetch(`/api/users/${encodeURIComponent(currentEmail)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error(await responseError(response));
  return (await response.json()) as ManagedUser;
}

export async function getUsers(page: number, size: number, platformId?: number, includePlatforms = true): Promise<UserPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (platformId !== undefined) params.set("platformId", String(platformId));
  if (!includePlatforms) params.set("includePlatforms", "false");
  const response = await fetch(`/api/users?${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await responseError(response));

  const payload: unknown = await response.json();
  if (Array.isArray(payload)) {
    const allUsers = payload as ManagedUser[];
    const totalPages = Math.ceil(allUsers.length / size);
    return {
      content: allUsers.slice(page * size, (page + 1) * size),
      totalElements: allUsers.length,
      totalPages,
      number: page,
      size,
      platforms: [],
    };
  }

  if (
    typeof payload === "object"
    && payload !== null
    && "content" in payload
    && Array.isArray(payload.content)
  ) {
    const result = payload as UserPage;
    return {
      content: result.content,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
      number: result.number,
      size: result.size,
      platforms: Array.isArray(result.platforms) ? result.platforms : [],
    };
  }

  throw new Error("The users service returned an unexpected response. Please refresh and try again.");
}

export async function getManageUsers(page: number, size: number, filters: UserManagementListFilters = {}, signal?: AbortSignal): Promise<UserPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (filters.platformId !== undefined) params.set("platformId", String(filters.platformId));
  if (filters.withoutPlatform) params.set("withoutPlatform", "true");
  if (filters.workScheduleId !== undefined) params.set("workScheduleId", String(filters.workScheduleId));
  if (filters.withoutWorkSchedule) params.set("withoutWorkSchedule", "true");
  if (filters.roleCode) params.set("roleCode", filters.roleCode);
  if (filters.search) params.set("search", filters.search);
  const response = await fetch(`/api/users/manage?${params}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(await responseError(response));

  const result = await response.json() as UserPage;
  if (!result || !Array.isArray(result.content)) {
    throw new Error("The users service returned an unexpected response. Please refresh and try again.");
  }
  return result;
}

export async function getManageUserFilters(signal?: AbortSignal): Promise<UserManagementFilters> {
  const response = await fetch("/api/users/manage/filters", {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(await responseError(response));
  const result = await response.json() as UserManagementFilters;
  if (!result || !Array.isArray(result.platforms) || !Array.isArray(result.workSchedules) || !Array.isArray(result.roles)) {
    throw new Error("The user filters service returned an unexpected response. Please refresh and try again.");
  }
  return result;
}

export async function getAllUsers(signal?: AbortSignal): Promise<ManagedUser[]> {
  const firstPage = await getManageUsers(0, 100, {}, signal);
  const allUsers = [...firstPage.content];
  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await getManageUsers(page, 100, {}, signal);
    allUsers.push(...result.content);
  }
  return allUsers;
}
