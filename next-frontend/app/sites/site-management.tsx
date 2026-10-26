"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ChevronDown, MapPin, Plus, RefreshCw, Search, Trash2, UserRoundPen, Users } from "lucide-react";
import type { SiteDetails } from "@/api/sites";
import type { ManagedUser } from "@/app/users/user-types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import CrudActionNotice from "@/components/CrudActionNotice";
import CrudListSkeleton from "@/components/CrudListSkeleton";
import DataLoadError from "@/components/DataLoadError";
import PaginationControls from "@/components/PaginationControls";
import { SiteManagementProvider, useSiteManagement } from "@/providers/SiteManagementProvider";

type Editor = { mode: "create" } | { mode: "edit"; site: SiteDetails };
const pageSizeOptions = [10, 25, 50];

export default function SiteManagement() {
  return <SiteManagementProvider><SiteManagementContent /></SiteManagementProvider>;
}

function SiteManagementContent() {
  const { sites, users, search, setSearch, isLoadingEditorData, loading, loadError, editorLoadError, error, notice, setNotice, editor, closeEditor, deleting, setDeleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete } = useSiteManagement();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const isMobile = useIsMobile();

  const filtered = sites;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleSites = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);




  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">Sites</span>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Site management</h1><p className="mt-2 text-sm text-muted-foreground">Create named sites and assign users to at most one site.</p></div>
          <Button disabled={isLoadingEditorData} onClick={() => void openEditor("create")}><Plus /> Add site</Button>
        </div>
        {loadError && <DataLoadError message={loadError} onRetry={() => void load()} retrying={loading} />}
        {editorLoadError && <DataLoadError message={editorLoadError} onRetry={retryEditorLoad} retrying={isLoadingEditorData} />}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {notice && <CrudActionNotice message={notice} onDismiss={() => setNotice("")} />}
        <Card>
          <CardHeader className="gap-4 border-b">
            <div><CardTitle>Sites</CardTitle><CardDescription>Each user can have zero or one site.</CardDescription></div>
            <CardAction className="col-span-2 col-start-1 row-start-2 flex w-full items-center justify-between gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
              <div className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-[#b83b00]" /><span className="font-semibold">{sites.length}</span><span className="text-muted-foreground">{sites.length === 1 ? "site" : "sites"}</span></div>
              <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
            </CardAction>
            <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setPage(0); setSearch(event.target.value); }} placeholder="Search sites" aria-label="Search sites" className="pl-9" /></div></div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <CrudListSkeleton label="Loading sites" />
              : filtered.length === 0 ? <div className="px-6 py-16 text-center"><MapPin className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{loadError ? "Sites could not be loaded" : search.trim() ? "No sites match this search" : "No sites yet"}</p><p className="mt-1 text-sm text-muted-foreground">{loadError ? "Check your connection and try again." : "Create a site and assign users to it."}</p></div>
                : <div className="divide-y">{visibleSites.map((site) => <div key={site.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{site.name}</p><div className="mt-2"><Badge variant="secondary"><Users /> {site.userCount} {site.userCount === 1 ? "user" : "users"}</Badge></div></div><div className="flex w-full gap-2 sm:w-auto sm:shrink-0"><Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={isLoadingEditorData} onClick={() => void openEditor("edit", site)}><UserRoundPen /> Edit</Button><Button variant="destructive" size="icon-sm" aria-label={`Delete ${site.name}`} disabled={isLoadingEditorData} onClick={() => setDeleting(site)}><Trash2 /></Button></div></div>)}</div>}
          </CardContent>
          <PaginationControls page={currentPage} totalPages={totalPages} pageSize={pageSize} pageSizeOptions={pageSizeOptions} disabled={loading} onPageChange={setPage} onPageSizeChange={(size) => { setPage(0); setPageSize(size); }} />
        </Card>
      </main>
      {editor && <SiteEditor editor={editor} users={users} isMobile={isMobile} onClose={closeEditor} onSave={save} />}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this site?</AlertDialogTitle><AlertDialogDescription>This deletes “{deleting?.name}”. Its users will remain and become unassigned.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>{isDeleting ? "Deleting…" : "Delete site"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SidebarPageLayout>
  );
}

function SiteEditor({ editor, users, isMobile, onClose, onSave }: {
  editor: Editor; users: ManagedUser[]; isMobile: boolean;
  onClose: () => void; onSave: (name: string, userEmails: string[]) => Promise<string | null>;
}) {
  const [name, setName] = useState(editor.mode === "edit" ? editor.site.name : "");
  const [selected, setSelected] = useState<string[]>(editor.mode === "edit" ? editor.site.userEmails : []);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebouncedValue(filter);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assignedUsersOpen, setAssignedUsersOpen] = useState(false);
  const visibleUsers = useMemo(() => {
    const normalized = debouncedFilter.trim().toLowerCase();
    return normalized
      ? users.filter((user) => user.email.toLowerCase().includes(normalized)).slice(0, 10)
      : [];
  }, [debouncedFilter, users]);
  const currentSiteId = editor.mode === "edit" ? editor.site.id : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) { setError("Enter a site name."); return; }
    setSubmitting(true);
    setError("");
    try {
      const saveError = await onSave(normalizedName, selected);
      if (saveError) setError(saveError);
    } finally {
      setSubmitting(false);
    }
  }

  return <Sheet open onOpenChange={(nextOpen) => { if (!nextOpen && !submitting) onClose(); }}><SheetContent side={isMobile ? "bottom" : "right"} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl p-0 sm:max-w-md sm:rounded-none md:h-full md:max-h-none"><SheetHeader className="border-b px-6 py-5"><SheetTitle>{editor.mode === "edit" ? "Edit site" : "Add a site"}</SheetTitle><SheetDescription>Choose a unique name and assign users. Each user can belong to at most one site.</SheetDescription></SheetHeader><form className="space-y-5 px-6 py-5" onSubmit={submit}><div className="space-y-2"><Label htmlFor="site-name">Site name</Label><Input id="site-name" required maxLength={25} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Manila" aria-describedby="site-name-limit" /><p id="site-name-limit" className="text-xs text-muted-foreground">Required, unique, and up to 25 characters.</p></div><fieldset className="space-y-3"><legend className="text-sm font-medium">Users ({selected.length})</legend><section className="rounded-lg border"><Button type="button" variant="ghost" className="flex w-full justify-between" aria-expanded={assignedUsersOpen} aria-controls="site-assigned-users" onClick={() => setAssignedUsersOpen((open) => !open)}><span>Show assigned users ({selected.length})</span><ChevronDown className={`size-4 transition-transform ${assignedUsersOpen ? "rotate-180" : ""}`} /></Button>{assignedUsersOpen && <div id="site-assigned-users" className="max-h-36 space-y-1 overflow-y-auto border-t p-3 text-sm">{selected.length ? selected.map((email) => <p key={email} className="truncate">{email}</p>) : <p className="text-muted-foreground">No users assigned yet.</p>}</div>}</section><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search users by email" aria-label="Search users" />{users.length === 0 ? <p className="text-sm text-muted-foreground">No users are available.</p> : !debouncedFilter.trim() ? <p className="text-sm text-muted-foreground">Search by email to find users.</p> : visibleUsers.length === 0 ? <p className="text-sm text-muted-foreground">No users match this search.</p> : <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">{visibleUsers.map((user) => { const otherSite = user.site?.id !== currentSiteId ? user.site : null; const checked = selected.includes(user.email); return <label key={user.email} className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm ${otherSite ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/60"}`}><input type="checkbox" checked={checked} disabled={Boolean(otherSite)} onChange={() => setSelected((current) => current.includes(user.email) ? current.filter((email) => email !== user.email) : [...current, user.email])} className="size-4 accent-[#e65300]" /><span className="min-w-0 flex-1 truncate">{user.email}</span>{otherSite && <span className="shrink-0 text-xs text-muted-foreground">{otherSite.name}</span>}</label>; })}</div>}</fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2 pt-1"><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : editor.mode === "edit" ? "Save changes" : "Create site"}</Button><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button></div></form></SheetContent></Sheet>;
}
