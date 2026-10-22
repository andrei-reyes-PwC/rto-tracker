"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Boxes, Plus, RefreshCw, Search, Trash2, UserRoundPen, Users } from "lucide-react";
import type { PlatformDetails } from "@/api/platforms";
import type { ManagedUser } from "@/app/users/user-types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import CrudActionNotice from "@/components/CrudActionNotice";
import CrudListSkeleton from "@/components/CrudListSkeleton";
import DataLoadError from "@/components/DataLoadError";
import { PlatformManagementProvider, usePlatformManagement } from "@/providers/PlatformManagementProvider";

type Editor = { mode: "create" } | { mode: "edit"; platform: PlatformDetails };
const pageSizeOptions = [10, 25, 50];

export default function PlatformManagement() {
  return <PlatformManagementProvider><PlatformManagementContent /></PlatformManagementProvider>;
}

function PlatformManagementContent() {
  const { platforms, users, search, setSearch, isLoadingEditorData, loading, loadError, editorLoadError, error, notice, setNotice, editor, closeEditor, deleting, setDeleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete } = usePlatformManagement();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const isMobile = useIsMobile();

  const filtered = platforms;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visiblePlatforms = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">Platforms</span>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Platform management</h1><p className="mt-2 text-sm text-muted-foreground">Group users into platforms and manage their membership.</p></div>
          <Button disabled={isLoadingEditorData} onClick={() => void openEditor("create")}><Plus /> Add platform</Button>
        </div>
        {loadError && <DataLoadError message={loadError} onRetry={() => void load()} retrying={loading} />}
        {editorLoadError && <DataLoadError message={editorLoadError} onRetry={retryEditorLoad} retrying={isLoadingEditorData} />}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {notice && <CrudActionNotice message={notice} onDismiss={() => setNotice("")} />}
        <Card>
          <CardHeader className="gap-4 border-b">
            <div><CardTitle>Platforms</CardTitle><CardDescription>Each user can belong to at most one platform.</CardDescription></div>
            <CardAction className="col-span-2 col-start-1 row-start-2 flex w-full items-center justify-between gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
              <div className="flex items-center gap-2 text-sm"><Boxes className="size-4 text-[#b83b00]" /><span className="font-semibold">{platforms.length}</span><span className="text-muted-foreground">{platforms.length === 1 ? "platform" : "platforms"}</span></div>
              <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
            </CardAction>
            <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setPage(0); setSearch(event.target.value); }} placeholder="Search platforms" aria-label="Search platforms" className="pl-9" /></div></div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <CrudListSkeleton label="Loading platforms" />
              : filtered.length === 0 ? <div className="px-6 py-16 text-center"><Boxes className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{loadError ? "Platforms could not be loaded" : search.trim() ? "No platforms match this search" : "No platforms yet"}</p><p className="mt-1 text-sm text-muted-foreground">{loadError ? "Check your connection and try again." : "Create a platform to group workspace users."}</p></div>
                : <div className="divide-y">{visiblePlatforms.map((platform) => <div key={platform.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{platform.name}</p><div className="mt-2"><Badge variant="secondary"><Users /> {platform.userCount} {platform.userCount === 1 ? "user" : "users"}</Badge></div></div><div className="flex w-full gap-2 sm:w-auto sm:shrink-0"><Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={isLoadingEditorData} onClick={() => void openEditor("edit", platform)}><UserRoundPen /> Edit</Button><Button variant="destructive" size="icon-sm" aria-label={`Delete ${platform.name}`} disabled={isLoadingEditorData} onClick={() => setDeleting(platform)}><Trash2 /></Button></div></div>)}</div>}
          </CardContent>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <p className="text-sm text-muted-foreground">Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(value) => { setPage(0); setPageSize(Number(value)); }} disabled={loading}>
                  <SelectTrigger className="w-[84px]" aria-label="Rows per page"><SelectValue /></SelectTrigger>
                  <SelectContent align="end">{pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={loading || currentPage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={loading || currentPage + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      </main>
      {editor && <PlatformEditor editor={editor} users={users} isMobile={isMobile} onClose={closeEditor} onSave={save} />}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this platform?</AlertDialogTitle><AlertDialogDescription>This deletes “{deleting?.name}” and its membership links. User accounts are kept.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>{isDeleting ? "Deleting…" : "Delete platform"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SidebarPageLayout>
  );
}

function PlatformEditor({ editor, users, isMobile, onClose, onSave }: {
  editor: Editor; users: ManagedUser[]; isMobile: boolean;
  onClose: () => void; onSave: (name: string, userEmails: string[]) => Promise<string | null>;
}) {
  const [name, setName] = useState(editor.mode === "edit" ? editor.platform.name : "");
  const [selected, setSelected] = useState<string[]>(editor.mode === "edit" ? editor.platform.userEmails : []);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebouncedValue(filter);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const visibleUsers = useMemo(() => {
    const normalized = debouncedFilter.trim().toLowerCase();
    return normalized
      ? users.filter((user) => user.email.toLowerCase().includes(normalized)).slice(0, 10)
      : [];
  }, [debouncedFilter, users]);
  const currentPlatformId = editor.mode === "edit" ? editor.platform.id : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) { setError("Enter a platform name."); return; }
    setSubmitting(true); setError("");
    try { const saveError = await onSave(normalizedName, selected); if (saveError) setError(saveError); }
    finally { setSubmitting(false); }
  }

  return <Sheet open onOpenChange={(nextOpen) => { if (!nextOpen && !submitting) onClose(); }}><SheetContent side={isMobile ? "bottom" : "right"} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl p-0 sm:max-w-md sm:rounded-none md:h-full md:max-h-none"><SheetHeader className="border-b px-6 py-5"><SheetTitle>{editor.mode === "edit" ? "Edit platform" : "Add a platform"}</SheetTitle><SheetDescription>Choose a name and the users who belong to this group. Each user can belong to one platform.</SheetDescription></SheetHeader><form className="space-y-5 px-6 py-5" onSubmit={submit}><div className="space-y-2"><Label htmlFor="platform-name">Platform name</Label><Input id="platform-name" required maxLength={20} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Technology" aria-describedby="platform-name-limit" /><p id="platform-name-limit" className="text-xs text-muted-foreground">Required, up to 20 characters.</p></div><fieldset className="space-y-3"><legend className="text-sm font-medium">Members ({selected.length})</legend><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search users by email" aria-label="Search users" />{users.length === 0 ? <p className="text-sm text-muted-foreground">No users are available.</p> : !debouncedFilter.trim() ? <p className="text-sm text-muted-foreground">Search by email to find users.</p> : visibleUsers.length === 0 ? <p className="text-sm text-muted-foreground">No users match this search.</p> : <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">{visibleUsers.map((user) => { const otherPlatform = user.platform?.id !== currentPlatformId ? user.platform : null; const checked = selected.includes(user.email); return <label key={user.email} className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm ${otherPlatform ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/60"}`}><input type="checkbox" checked={checked} disabled={Boolean(otherPlatform)} onChange={() => setSelected((current) => current.includes(user.email) ? current.filter((email) => email !== user.email) : [...current, user.email])} className="size-4 accent-[#e65300]" /><span className="min-w-0 flex-1 truncate">{user.email}</span>{otherPlatform && <span className="shrink-0 text-xs text-muted-foreground">{otherPlatform.name}</span>}</label>; })}</div>}</fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2 pt-1"><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : editor.mode === "edit" ? "Save changes" : "Create platform"}</Button><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button></div></form></SheetContent></Sheet>;
}
