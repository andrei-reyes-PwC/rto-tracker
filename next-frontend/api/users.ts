import type { ManagedUser } from "@/app/users/user-types";

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

export async function getUsers(page: number, size: number, platformId?: number): Promise<UserPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (platformId !== undefined) params.set("platformId", String(platformId));
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
    };
  }

  throw new Error("The users service returned an unexpected response. Please refresh and try again.");
}
