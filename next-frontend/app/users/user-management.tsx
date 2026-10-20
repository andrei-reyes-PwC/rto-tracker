"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, LoaderCircle, Plus, RefreshCw, Search, Shield, Trash2, UserRoundPen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import { createUser, deleteUser, getUsers } from "@/api/users";
import { useAuth } from "@/providers/AuthProvider";
import UserEditorSheet from "./user-editor-sheet";
import type { AvailableRole, ManagedUser, UserEditorMode, UserEditorValues } from "./user-types";

const defaultRoleCodes = ["USER"];
const pageSizeOptions = [10, 25, 50, 100];
const availableRoles: AvailableRole[] = [
  { code: "USER", protectedRole: false },
  { code: "ADMIN", protectedRole: false },
  { code: "SUPER_ADMIN", protectedRole: true },
];

export default function UserManagement() {
  const { user: signedInUser, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ mode: UserEditorMode; user?: ManagedUser } | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getUsers(page, pageSize);
      setUsers(result.content);
      setTotalUsers(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Could not load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((managedUser) =>
      managedUser.email.toLowerCase().includes(normalizedQuery)
      || managedUser.roles.some((role) => role.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, users]);

  async function handleEditorSave(values: UserEditorValues) {
    if (editor?.mode !== "create") {
      return "Editing users is not connected yet. No backend data was changed.";
    }

    try {
      await createUser({ email: values.email, password: values.password });
      setEditor(null);
      setError("");
      setNotice(`${values.email} was created.`);
      if (page === 0) {
        await load();
      } else {
        setPage(0);
      }
      return null;
    } catch (error: unknown) {
      return error instanceof Error ? error.message : "Could not create this user. Please try again.";
    }
  }

  async function confirmDelete() {
    if (!deletingUser || isDeleting) return;
    setIsDeleting(true);
    setError("");
    setNotice("");
    try {
      await deleteUser(deletingUser.email);
      setNotice(`${deletingUser.email} was deleted.`);
      setDeletingUser(null);
      if (users.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        await load();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Could not delete this user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const content = (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p>
          <h1 className="text-3xl font-semibold tracking-tight">User management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review registered accounts and their assigned roles.</p>
        </div>
        <Button onClick={() => setEditor({ mode: "create" })}><Plus /> Add user</Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p><span className="font-medium">User management requires SUPER_ADMIN access.</span> Add is connected; edit is not connected yet.</p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <Card className="min-w-0">
        <CardHeader className="gap-4 border-b">
          <div><CardTitle>People</CardTitle><CardDescription>Review account access and assigned roles.</CardDescription></div>
          <CardAction className="col-span-2 col-start-1 row-start-2 row-span-1 flex w-full items-center justify-between gap-2 justify-self-stretch sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:row-span-2 sm:w-auto sm:justify-self-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm sm:flex-none">
              <Users className="size-4 text-[#b83b00]" />
              <span className="font-semibold">{totalUsers}</span>
              <span className="text-muted-foreground">{totalUsers === 1 ? "user" : "users"}</span>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 rounded-xl" disabled={isLoading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
          </CardAction>
          <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this page by email or role" aria-label="Search users on this page" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Loading roster…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center"><Users className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{error ? "Users could not be loaded" : users.length ? "No users match this search" : "No users yet"}</p><p className="mt-1 text-sm text-muted-foreground">{error ? "Check your connection and try refreshing." : "No accounts are available."}</p></div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((managedUser) => {
                const isProtected = managedUser.roles.includes("SUPER_ADMIN");
                const isCurrentUser = signedInUser?.email.toLowerCase() === managedUser.email.toLowerCase();
                return (
                  <div key={managedUser.email} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={managedUser.email}>{managedUser.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {managedUser.roles.map((role) => <Badge key={role} variant={role === "ADMIN" || role === "SUPER_ADMIN" ? "secondary" : "outline"}>{role === "SUPER_ADMIN" && <Shield aria-hidden="true" />}{role}</Badge>)}
                      </div>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={isProtected} onClick={() => setEditor({ mode: "edit", user: managedUser })}><UserRoundPen /> Edit</Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        aria-label={`Delete ${managedUser.email}`}
                        title={isCurrentUser ? "You cannot delete your own account" : undefined}
                        disabled={isProtected || isCurrentUser || isAuthLoading}
                        onClick={() => setDeletingUser(managedUser)}
                      ><Trash2 /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p className="text-sm text-muted-foreground">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPage(0);
                  setPageSize(Number(value));
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[84px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={isLoading || page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={isLoading || page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </main>
  );

  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">Users</span>}>
      {content}
      <UserEditorSheet
        open={editor !== null}
        mode={editor?.mode ?? "create"}
        initialEmail={editor?.user?.email ?? ""}
        initialRoles={editor?.user?.roles ?? defaultRoleCodes}
        availableRoles={availableRoles}
        onOpenChange={(open) => { if (!open) setEditor(null); }}
        onSave={handleEditorSave}
      />
      <AlertDialog open={deletingUser !== null} onOpenChange={(open) => { if (!open) setDeletingUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {deletingUser?.email} from the backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {isDeleting ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarPageLayout>
  );
}
