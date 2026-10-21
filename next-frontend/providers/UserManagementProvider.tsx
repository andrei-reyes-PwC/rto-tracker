"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getPlatformOptions, type PlatformOption } from "@/api/platforms";
import { createUser, deleteUser, getManageUsers, updateUser } from "@/api/users";
import { useAuth } from "@/providers/AuthProvider";
import type { ManagedUser, UserEditorMode, UserEditorValues } from "@/app/users/user-types";

type Editor = { mode: UserEditorMode; user?: ManagedUser } | null;
type UserManagementContextValue = {
  users: ManagedUser[]; platforms: PlatformOption[]; totalUsers: number; totalPages: number;
  page: number; setPage: (page: number | ((current: number) => number)) => void;
  pageSize: number; setPageSize: (size: number) => void; platformId: string;
  setPlatformId: (id: string) => void; isLoading: boolean; isLoadingPlatforms: boolean; loadError: string; retryLoad: () => void; error: string; notice: string;
  setNotice: (notice: string) => void; isDeleting: boolean; editor: Editor;
  setEditor: (editor: Editor) => void; deletingUser: ManagedUser | null;
  setDeletingUser: (user: ManagedUser | null) => void; refresh: () => Promise<void>;
  saveUser: (values: UserEditorValues) => Promise<string | null>; confirmDelete: () => Promise<void>;
  signedInUser: ReturnType<typeof useAuth>["user"]; isAuthLoading: boolean;
};

const UserManagementContext = createContext<UserManagementContextValue | null>(null);

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const { user: signedInUser, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [platformId, setPlatformId] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [platformLoadError, setPlatformLoadError] = useState("");
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [platformRetry, setPlatformRetry] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const result = await getManageUsers(page, pageSize, platformId === "all" ? undefined : Number(platformId), signal);
      if (signal?.aborted) return;
      setUsers(result.content);
      setPlatforms(result.platforms ?? []);
      setTotalUsers(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (cause) {
      if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load users. Please try again.");
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [page, pageSize, platformId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void refresh(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingPlatforms(true);
    setPlatformLoadError("");
    getPlatformOptions(controller.signal).then((options) => { if (!controller.signal.aborted) setPlatforms(options); }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setPlatformLoadError(cause instanceof Error ? cause.message : "Could not load platform filters.");
    }).finally(() => { if (!controller.signal.aborted) setIsLoadingPlatforms(false); });
    return () => controller.abort();
  }, [platformRetry]);

  const retryLoad = useCallback(() => {
    void refresh();
    setPlatformRetry((current) => current + 1);
  }, [refresh]);

  const saveUser = useCallback(async (values: UserEditorValues) => {
    try {
      if (editor?.mode === "create") await createUser({ email: values.email, password: values.password });
      else if (editor?.mode === "edit" && editor.user) await updateUser(editor.user.email, { email: values.email, roles: values.roles });
      else return "Select a user to edit and try again.";
      setEditor(null); setError(""); setNotice(`${values.email} was ${editor.mode === "create" ? "created" : "updated"}.`);
      if (page === 0) await refresh(); else setPage(0);
      return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this user. Please try again."; }
  }, [editor, page, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!deletingUser || isDeleting) return;
    setIsDeleting(true); setError(""); setNotice("");
    try {
      await deleteUser(deletingUser.email);
      setNotice(`${deletingUser.email} was deleted.`); setDeletingUser(null);
      if (users.length === 1 && page > 0) setPage((current) => current - 1); else await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete this user. Please try again."); }
    finally { setIsDeleting(false); }
  }, [deletingUser, isDeleting, page, refresh, users.length]);

  const value = useMemo(() => ({ users, platforms, totalUsers, totalPages, page, setPage, pageSize, setPageSize, platformId, setPlatformId, isLoading, isLoadingPlatforms, loadError: loadError || platformLoadError, retryLoad, error, notice, setNotice, isDeleting, editor, setEditor, deletingUser, setDeletingUser, refresh, saveUser, confirmDelete, signedInUser, isAuthLoading }), [users, platforms, totalUsers, totalPages, page, pageSize, platformId, isLoading, isLoadingPlatforms, loadError, platformLoadError, retryLoad, error, notice, isDeleting, editor, deletingUser, refresh, saveUser, confirmDelete, signedInUser, isAuthLoading]);
  return <UserManagementContext.Provider value={value}>{children}</UserManagementContext.Provider>;
}

export function useUserManagement() {
  const value = useContext(UserManagementContext);
  if (!value) throw new Error("useUserManagement must be used within UserManagementProvider.");
  return value;
}
