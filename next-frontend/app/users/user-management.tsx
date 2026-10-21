"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Shield, Trash2, UserRoundPen, Users } from "lucide-react";
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
import CrudActionNotice from "@/components/CrudActionNotice";
import CrudListSkeleton from "@/components/CrudListSkeleton";
import DataLoadError from "@/components/DataLoadError";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { UserManagementProvider, useUserManagement } from "@/providers/UserManagementProvider";
import UserEditorSheet from "./user-editor-sheet";
import type { AvailableRole } from "./user-types";

const defaultRoleCodes = ["USER"];
const pageSizeOptions = [10, 25, 50, 100];
const availableRoles: AvailableRole[] = [
  { code: "USER", protectedRole: false },
  { code: "ADMIN", protectedRole: false },
  { code: "SUPER_ADMIN", protectedRole: true },
];

export default function UserManagement() {
  return <UserManagementProvider><UserManagementContent /></UserManagementProvider>;
}

function UserManagementContent() {
  const { users, platforms, totalUsers, totalPages, page, setPage, pageSize, setPageSize, isLoading, isLoadingPlatforms, loadError, retryLoad, error, notice, setNotice, isDeleting, editor, setEditor, deletingUser, setDeletingUser, saveUser, confirmDelete, signedInUser, isAuthLoading, platformId, setPlatformId } = useUserManagement();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((managedUser) =>
      managedUser.email.toLowerCase().includes(normalizedQuery)
      || managedUser.roles.some((role) => role.toLowerCase().includes(normalizedQuery)),
    );
  }, [debouncedQuery, users]);

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

      {loadError && <DataLoadError message={loadError} onRetry={retryLoad} retrying={isLoading || isLoadingPlatforms} />}
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      {notice && <CrudActionNotice message={notice} onDismiss={() => setNotice("")} />}

      <Card className="min-w-0">
        <CardHeader className="gap-4 border-b">
          <div><CardTitle>People</CardTitle><CardDescription>Review account access and assigned roles.</CardDescription></div>
          <CardAction className="col-span-2 col-start-1 row-start-2 row-span-1 flex w-full items-center justify-between gap-2 justify-self-stretch sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:row-span-2 sm:w-auto sm:justify-self-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm sm:flex-none">
              <Users className="size-4 text-[#b83b00]" />
              <span className="font-semibold">{totalUsers}</span>
              <span className="text-muted-foreground">{totalUsers === 1 ? "user" : "users"}</span>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 rounded-xl" disabled={isLoading || isLoadingPlatforms} onClick={retryLoad}><RefreshCw /> Refresh</Button>
          </CardAction>
          <div className="col-span-2 flex w-full flex-col gap-2 sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xl sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this page by email or role" aria-label="Search users on this page" className="pl-9" />
            </div>
            <Select value={platformId} onValueChange={(value) => { setPage(0); setPlatformId(value); }} disabled={isLoading}>
              <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filter users by platform"><SelectValue placeholder="All platforms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {platforms.map((platform) => <SelectItem key={platform.id} value={String(platform.id)}>{platform.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <CrudListSkeleton label="Loading user roster" rows={6} />
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center"><Users className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{loadError ? "Users could not be loaded" : users.length ? "No users match this search" : "No users yet"}</p><p className="mt-1 text-sm text-muted-foreground">{loadError ? "Check your connection and try refreshing." : "No accounts are available."}</p></div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((managedUser) => {
                const isProtected = managedUser.roles.includes("SUPER_ADMIN");
                const isCurrentUser = signedInUser?.email.toLowerCase() === managedUser.email.toLowerCase();
                const userPlatform = managedUser.platform;
                return (
                  <div key={managedUser.email} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={managedUser.email}>{managedUser.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {userPlatform
                          ? <Badge variant="outline">Platform: {userPlatform.name}</Badge>
                          : <span className="text-xs text-muted-foreground">Platform: None</span>}
                        {managedUser.workSchedule
                          ? <Badge variant="outline">Schedule: {managedUser.workSchedule.name}</Badge>
                          : <span className="text-xs text-muted-foreground">No work schedule</span>}
                      </div>
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
        onSave={saveUser}
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
