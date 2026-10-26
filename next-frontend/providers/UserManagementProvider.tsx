"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlatformOption } from "@/api/platforms";
import { createUser, deleteUser, getManageUserFilters, getManageUsers, updateUser } from "@/api/users";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/AuthProvider";
import type { ManagedUser, UserEditorMode, UserEditorValues } from "@/app/users/user-types";

type Editor = { mode: UserEditorMode; user?: ManagedUser } | null;
type UserManagementContextValue = {
  users: ManagedUser[]; platforms: PlatformOption[]; workSchedules: PlatformOption[]; sites: PlatformOption[]; roles: { code: string }[]; totalUsers: number; totalPages: number;
  page: number; setPage: (page: number | ((current: number) => number)) => void;
  pageSize: number; setPageSize: (size: number) => void; platformId: string; workScheduleId: string; siteId: string; roleCode: string; keyword: string;
  setPlatformId: (id: string) => void; setWorkScheduleId: (id: string) => void; setSiteId: (id: string) => void; setRoleCode: (code: string) => void; setKeyword: (keyword: string) => void; isLoading: boolean; isLoadingFilters: boolean; loadError: string; retryLoad: () => void; dismissLoadError: () => void; error: string; notice: string;
  setNotice: (notice: string) => void; isDeleting: boolean; editor: Editor;
  setEditor: (editor: Editor) => void; deletingUser: ManagedUser | null;
  setDeletingUser: (user: ManagedUser | null) => void; refresh: () => Promise<void>;
  saveUser: (values: UserEditorValues) => Promise<string | null>; confirmDelete: () => Promise<void>;
  signedInUser: ReturnType<typeof useAuth>["user"]; isAuthLoading: boolean;
};

const UserManagementContext = createContext<UserManagementContextValue | null>(null);

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const { user: signedInUser, isLoading: isAuthLoading, refreshUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [workSchedules, setWorkSchedules] = useState<PlatformOption[]>([]);
  const [sites, setSites] = useState<PlatformOption[]>([]);
  const [roles, setRoles] = useState<{ code: string }[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [platformId, setPlatformId] = useState("all");
  const [workScheduleId, setWorkScheduleId] = useState("all");
  const [siteId, setSiteId] = useState("all");
  const [roleCode, setRoleCode] = useState("all");
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filterLoadError, setFilterLoadError] = useState("");
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [filterRetry, setFilterRetry] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const result = await getManageUsers(page, pageSize, {
        platformId: platformId !== "all" && platformId !== "none" ? Number(platformId) : undefined,
        withoutPlatform: platformId === "none",
        workScheduleId: workScheduleId !== "all" && workScheduleId !== "none" ? Number(workScheduleId) : undefined,
        withoutWorkSchedule: workScheduleId === "none",
        siteId: siteId !== "all" && siteId !== "none" ? Number(siteId) : undefined,
        withoutSite: siteId === "none",
        roleCode: roleCode === "all" ? undefined : roleCode,
        search: debouncedKeyword.trim() || undefined,
      }, signal);
      if (signal?.aborted) return;
      setUsers(result.content);
      setTotalUsers(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (cause) {
      if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load users. Please try again.");
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [page, pageSize, platformId, workScheduleId, siteId, roleCode, debouncedKeyword]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void refresh(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingFilters(true);
    setFilterLoadError("");
    getManageUserFilters(controller.signal).then((options) => {
      if (!controller.signal.aborted) {
        setPlatforms(options.platforms);
        setWorkSchedules(options.workSchedules);
        setSites(options.sites);
        setRoles(options.roles);
      }
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setFilterLoadError(cause instanceof Error ? cause.message : "Could not load user filters.");
    }).finally(() => { if (!controller.signal.aborted) setIsLoadingFilters(false); });
    return () => controller.abort();
  }, [filterRetry]);

  const retryLoad = useCallback(() => {
    void refresh();
    setFilterRetry((current) => current + 1);
  }, [refresh]);
  const dismissLoadError = useCallback(() => {
    setLoadError("");
    setFilterLoadError("");
  }, []);

  const saveUser = useCallback(async (values: UserEditorValues) => {
    try {
      if (editor?.mode === "create") await createUser({ email: values.email, password: values.password });
      else if (editor?.mode === "edit" && editor.user) {
        const isSelf = signedInUser?.email.toLowerCase() === editor.user.email.toLowerCase();
        await updateUser(editor.user.email, {
          email: values.email,
          roles: values.roles,
          assignments: { platformId: values.platformId, workScheduleId: values.workScheduleId, siteId: values.siteId },
        });
        if (isSelf) await refreshUser();
      }
      else return "Select a user to edit and try again.";
      setEditor(null); setError(""); setNotice(`${values.email} was ${editor.mode === "create" ? "created" : "updated"}.`);
      if (page === 0) await refresh(); else setPage(0);
      return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this user. Please try again."; }
  }, [editor, page, refresh, refreshUser, signedInUser]);

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

  const value = useMemo(() => ({ users, platforms, workSchedules, sites, roles, totalUsers, totalPages, page, setPage, pageSize, setPageSize, platformId, workScheduleId, siteId, roleCode, keyword, setPlatformId, setWorkScheduleId, setSiteId, setRoleCode, setKeyword, isLoading, isLoadingFilters, loadError: loadError || filterLoadError, retryLoad, dismissLoadError, error, notice, setNotice, isDeleting, editor, setEditor, deletingUser, setDeletingUser, refresh, saveUser, confirmDelete, signedInUser, isAuthLoading }), [users, platforms, workSchedules, sites, roles, totalUsers, totalPages, page, pageSize, platformId, workScheduleId, siteId, roleCode, keyword, isLoading, isLoadingFilters, loadError, filterLoadError, retryLoad, dismissLoadError, error, notice, isDeleting, editor, deletingUser, refresh, saveUser, confirmDelete, signedInUser, isAuthLoading]);
  return <UserManagementContext.Provider value={value}>{children}</UserManagementContext.Provider>;
}

export function useUserManagement() {
  const value = useContext(UserManagementContext);
  if (!value) throw new Error("useUserManagement must be used within UserManagementProvider.");
  return value;
}
