"use client";

import { useState, type FormEvent } from "react";
import { MapPin, Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import type { Site } from "@/api/sites";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import CrudActionNotice from "@/components/CrudActionNotice";
import CrudListSkeleton from "@/components/CrudListSkeleton";
import DataLoadError from "@/components/DataLoadError";
import PaginationControls from "@/components/PaginationControls";
import { SiteManagementProvider, useSiteManagement } from "@/providers/SiteManagementProvider";

type Editor = { mode: "create" } | { mode: "edit"; site: Site };
const pageSizeOptions = [10, 25, 50];

export default function SiteManagement() {
  return <SiteManagementProvider><SiteManagementContent /></SiteManagementProvider>;
}

function SiteManagementContent() {
  const { sites, search, setSearch, loading, loadError, error, notice, setNotice, editor, closeEditor, deleting, setDeleting, isDeleting, load, openEditor, save, confirmDelete } = useSiteManagement();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const isMobile = useIsMobile();

  const filtered = sites;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleSites = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);




  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">Sites</span>} managementTabs={{ active: "sites", isSuperAdmin: true }}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Site management</h1><p className="mt-2 text-sm text-muted-foreground">Create and manage sites. Assign users from Manage Users.</p></div>
          <Button onClick={() => openEditor("create")}><Plus /> Add site</Button>
        </div>
        {loadError && <DataLoadError message={loadError} onRetry={() => void load()} retrying={loading} />}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {notice && <CrudActionNotice message={notice} onDismiss={() => setNotice("")} />}
        <Card>
          <CardHeader className="gap-4 border-b">
            <div><CardTitle>Sites</CardTitle><CardDescription>Each user can have zero or one site. Manage assignments from Manage Users.</CardDescription></div>
            <CardAction className="col-span-2 col-start-1 row-start-2 flex w-full items-center justify-between gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
              <div className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-[#b83b00]" /><span className="font-semibold">{sites.length}</span><span className="text-muted-foreground">{sites.length === 1 ? "site" : "sites"}</span></div>
              <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
            </CardAction>
            <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setPage(0); setSearch(event.target.value); }} placeholder="Search sites" aria-label="Search sites" className="pl-9" /></div></div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <CrudListSkeleton label="Loading sites" />
              : filtered.length === 0 ? <div className="px-6 py-16 text-center"><MapPin className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{loadError ? "Sites could not be loaded" : search.trim() ? "No sites match this search" : "No sites yet"}</p><p className="mt-1 text-sm text-muted-foreground">{loadError ? "Check your connection and try again." : "Create a site to get started."}</p></div>
                : <div className="divide-y">{visibleSites.map((site) => <div key={site.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{site.name}</p><div className="mt-2"><Badge variant="secondary"><Users /> {site.userCount} {site.userCount === 1 ? "user" : "users"}</Badge></div></div><div className="flex w-full gap-2 sm:w-auto sm:shrink-0"><Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => openEditor("edit", site)}><Pencil /> Edit</Button><Button variant="destructive" size="icon-sm" aria-label={`Delete ${site.name}`} onClick={() => setDeleting(site)}><Trash2 /></Button></div></div>)}</div>}
          </CardContent>
          <PaginationControls page={currentPage} totalPages={totalPages} pageSize={pageSize} pageSizeOptions={pageSizeOptions} disabled={loading} onPageChange={setPage} onPageSizeChange={(size) => { setPage(0); setPageSize(size); }} />
        </Card>
      </main>
      {editor && <SiteEditor editor={editor} isMobile={isMobile} onClose={closeEditor} onSave={save} />}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this site?</AlertDialogTitle><AlertDialogDescription>This deletes “{deleting?.name}”. Its users will remain and become unassigned.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>{isDeleting ? "Deleting…" : "Delete site"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SidebarPageLayout>
  );
}

function SiteEditor({ editor, isMobile, onClose, onSave }: {
  editor: Editor; isMobile: boolean; onClose: () => void; onSave: (name: string) => Promise<string | null>;
}) {
  const [name, setName] = useState(editor.mode === "edit" ? editor.site.name : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) { setError("Enter a site name."); return; }
    setSubmitting(true);
    setError("");
    try {
      const saveError = await onSave(normalizedName);
      if (saveError) setError(saveError);
    } finally {
      setSubmitting(false);
    }
  }

  return <Sheet open onOpenChange={(nextOpen) => { if (!nextOpen && !submitting) onClose(); }}><SheetContent side={isMobile ? "bottom" : "right"} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl p-0 sm:max-w-md sm:rounded-none md:h-full md:max-h-none"><SheetHeader className="border-b px-6 py-5"><SheetTitle>{editor.mode === "edit" ? "Edit site" : "Add a site"}</SheetTitle><SheetDescription>Set the site name. Assign users from Manage Users.</SheetDescription></SheetHeader><form className="space-y-5 px-6 py-5" onSubmit={submit}><div className="space-y-2"><Label htmlFor="site-name">Site name</Label><Input id="site-name" required maxLength={25} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Manila" aria-describedby="site-name-limit" /><p id="site-name-limit" className="text-xs text-muted-foreground">Required, unique, and up to 25 characters.</p></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2 pt-1"><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : editor.mode === "edit" ? "Save changes" : "Create site"}</Button><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button></div></form></SheetContent></Sheet>;
}
