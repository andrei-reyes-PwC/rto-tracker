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
import SidebarPageLayout from "@/components/SidebarPageLayout";
import UserEditorSheet from "./user-editor-sheet";
import type { AvailableRole, ManagedUser, UserEditorMode, UserEditorValues } from "./user-types";

const previewStorageKey = "rto-user-management-preview";
const defaultRoleCodes = ["USER"];
const previewRoles: AvailableRole[] = [
  { code: "USER", protectedRole: false },
  { code: "ADMIN", protectedRole: false },
  { code: "SUPER_ADMIN", protectedRole: true },
];
const previewUsers: ManagedUser[] = [
  { email: "alex.morgan@example.com", roles: ["USER"] },
  { email: "jamie.lee@example.com", roles: ["USER", "ADMIN"] },
  { email: "system.owner@example.com", roles: ["SUPER_ADMIN"] },
];

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ mode: UserEditorMode; user?: ManagedUser } | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError("");
    try {
      const savedUsers = window.localStorage.getItem(previewStorageKey);
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers) as ManagedUser[];
        setUsers(parsed);
      } else {
        setUsers(previewUsers);
        window.localStorage.setItem(previewStorageKey, JSON.stringify(previewUsers));
      }
    } catch {
      setUsers(previewUsers);
      window.localStorage.setItem(previewStorageKey, JSON.stringify(previewUsers));
      setError("Preview data could not be read, so the sample roster was restored.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function saveUsers(nextUsers: ManagedUser[]) {
    setUsers(nextUsers);
    window.localStorage.setItem(previewStorageKey, JSON.stringify(nextUsers));
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((managedUser) =>
      managedUser.email.toLowerCase().includes(normalizedQuery)
      || managedUser.roles.some((role) => role.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, users]);

  function beginCreate() {
    setError("");
    setNotice("");
    setEditor({ mode: "create" });
  }

  function beginEdit(managedUser: ManagedUser) {
    setError("");
    setNotice("");
    setEditor({ mode: "edit", user: managedUser });
  }

  function handleEditorSave(values: UserEditorValues) {
    if (!editor) return "Choose an add or edit action first.";
    setError("");
    setNotice("");
    const email = values.email.trim().toLowerCase();
    const originalEmail = editor.user?.email;
    if (users.some((managedUser) => managedUser.email === email && managedUser.email !== originalEmail)) {
      return "A user with this email already exists.";
    }

    if (editor.mode === "create") {
      saveUsers([...users, { email, roles: ["USER"] }]);
      setNotice(`${email} was added to this browser's preview roster.`);
    } else if (originalEmail) {
      saveUsers(users.map((managedUser) => managedUser.email === originalEmail
        ? { email, roles: values.roles }
        : managedUser));
      setNotice(`Preview changes saved for ${email}.`);
    }
    setEditor(null);
    return null;
  }

  function handleDelete(managedUser: ManagedUser) {
    setError("");
    setNotice("");
    setDeletingUser(managedUser);
  }

  function confirmDelete() {
    if (!deletingUser) return;
    saveUsers(users.filter((item) => item.email !== deletingUser.email));
    setNotice(`${deletingUser.email} was removed from the preview roster.`);
    if (editor?.user?.email === deletingUser.email) setEditor(null);
    setDeletingUser(null);
  }

  const content = (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p>
          <h1 className="text-3xl font-semibold tracking-tight">User management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create accounts, update access, and keep the workspace roster current.</p>
        </div>
        <Button onClick={beginCreate}><Plus /> Add user</Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p><span className="font-medium">UI preview.</span> Changes are saved in this browser only and are not sent to the backend.</p>
      </div>

      {(error || notice) && (
        <div role={error ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-600/20 bg-emerald-50 text-emerald-800"}`}>
          {error || notice}
        </div>
      )}

      <Card className="min-w-0">
        <CardHeader className="gap-4 border-b">
          <div><CardTitle>People</CardTitle><CardDescription>Review account access and assigned roles.</CardDescription></div>
          <CardAction className="col-span-2 col-start-1 row-start-2 row-span-1 flex w-full items-center justify-between gap-2 justify-self-stretch sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:row-span-2 sm:w-auto sm:justify-self-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm sm:flex-none">
              <Users className="size-4 text-[#b83b00]" />
              <span className="font-semibold">{users.length}</span>
              <span className="text-muted-foreground">{users.length === 1 ? "user" : "users"}</span>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 rounded-xl" disabled={isLoading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
          </CardAction>
          <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email or role" aria-label="Search users" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Loading roster…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center"><Users className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{users.length ? "No users match this search" : "No users yet"}</p><p className="mt-1 text-sm text-muted-foreground">Create an account to get started.</p></div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((managedUser) => {
                const isProtected = managedUser.roles.includes("SUPER_ADMIN");
                return (
                  <div key={managedUser.email} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={managedUser.email}>{managedUser.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {managedUser.roles.map((role) => <Badge key={role} variant={role === "ADMIN" || role === "SUPER_ADMIN" ? "secondary" : "outline"}>{role === "SUPER_ADMIN" && <Shield aria-hidden="true" />}{role}</Badge>)}
                      </div>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={isProtected} onClick={() => beginEdit(managedUser)}><UserRoundPen /> Edit</Button>
                      <Button variant="destructive" size="icon-sm" aria-label={`Delete ${managedUser.email}`} disabled={isProtected} onClick={() => void handleDelete(managedUser)}><Trash2 /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
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
            availableRoles={previewRoles}
            onOpenChange={(open) => { if (!open) setEditor(null); }}
            onSave={handleEditorSave}
          />
          <AlertDialog open={deletingUser !== null} onOpenChange={(open) => { if (!open) setDeletingUser(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deletingUser?.email} will be removed from this browser’s preview roster. This does not change backend data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={confirmDelete}
                >
                  Delete user
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    </SidebarPageLayout>
  );
}
