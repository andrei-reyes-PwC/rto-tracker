"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, LoaderCircle, Plus, RefreshCw, Search, Trash2, UserRoundPen, Users } from "lucide-react";
import { createWorkSchedule, deleteWorkSchedule, getWorkSchedule, getWorkSchedules, updateWorkSchedule, type WorkSchedule, type WorkScheduleDetails } from "@/api/work-schedules";
import { getAllUsers } from "@/api/users";
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

type Editor = { mode: "create" } | { mode: "edit"; schedule: WorkScheduleDetails };
const pageSizeOptions = [10, 25, 50];

export default function WorkScheduleManagement() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingEditorData, setIsLoadingEditorData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<WorkSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSchedules(await getWorkSchedules());
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Could not load work schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function openEditor(mode: "create" | "edit", schedule?: WorkSchedule) {
    setIsLoadingEditorData(true);
    setError("");
    setEditor(null);
    try {
      const [allUsers, details] = await Promise.all([
        getAllUsers(),
        mode === "edit" && schedule ? getWorkSchedule(schedule.id) : Promise.resolve(null),
      ]);
      setUsers(allUsers);
      if (mode === "edit" && details) setEditor({ mode, schedule: details });
      else setEditor({ mode: "create" });
    } catch (editorError: unknown) {
      setError(editorError instanceof Error ? editorError.message : "Could not load users for this work schedule.");
    } finally {
      setIsLoadingEditorData(false);
    }
  }

  const filtered = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    return normalized ? schedules.filter((schedule) => schedule.name.toLowerCase().includes(normalized)) : schedules;
  }, [schedules, debouncedQuery]);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleSchedules = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => { setPage(0); }, [debouncedQuery, pageSize]);
  useEffect(() => { setPage((current) => Math.min(current, Math.max(totalPages - 1, 0))); }, [totalPages]);

  async function save(name: string, userEmails: string[]) {
    try {
      if (editor?.mode === "create") await createWorkSchedule({ name, userEmails });
      else if (editor?.mode === "edit") await updateWorkSchedule(editor.schedule.id, { name, userEmails });
      else return "Choose a work schedule to save.";
      setEditor(null);
      setNotice(`“${name}” was ${editor.mode === "create" ? "created" : "updated"}.`);
      await load();
      return null;
    } catch (saveError: unknown) {
      return saveError instanceof Error ? saveError.message : "Could not save this work schedule. Please try again.";
    }
  }

  async function confirmDelete() {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteWorkSchedule(deleting.id);
      setNotice(`“${deleting.name}” was deleted. Its users are now unassigned.`);
      setDeleting(null);
      await load();
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this work schedule.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">Work schedules</span>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Work schedule management</h1><p className="mt-2 text-sm text-muted-foreground">Create named schedules and assign users to at most one schedule.</p></div>
          <Button disabled={isLoadingEditorData} onClick={() => void openEditor("create")}><Plus /> Add work schedule</Button>
        </div>
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {notice && <CrudActionNotice message={notice} onDismiss={() => setNotice("")} />}
        <Card>
          <CardHeader className="gap-4 border-b">
            <div><CardTitle>Work schedules</CardTitle><CardDescription>Each user can have zero or one work schedule.</CardDescription></div>
            <CardAction className="col-span-2 col-start-1 row-start-2 flex w-full items-center justify-between gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
              <div className="flex items-center gap-2 text-sm"><CalendarDays className="size-4 text-[#b83b00]" /><span className="font-semibold">{schedules.length}</span><span className="text-muted-foreground">{schedules.length === 1 ? "schedule" : "schedules"}</span></div>
              <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
            </CardAction>
            <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search work schedules" aria-label="Search work schedules" className="pl-9" /></div></div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Loading work schedules…</div>
              : filtered.length === 0 ? <div className="px-6 py-16 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{error ? "Work schedules could not be loaded" : schedules.length ? "No work schedules match this search" : "No work schedules yet"}</p><p className="mt-1 text-sm text-muted-foreground">{error ? "Check your connection and try refreshing." : "Create a work schedule and assign users to it."}</p></div>
                : <div className="divide-y">{visibleSchedules.map((schedule) => <div key={schedule.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{schedule.name}</p><div className="mt-2"><Badge variant="secondary"><Users /> {schedule.userCount} {schedule.userCount === 1 ? "user" : "users"}</Badge></div></div><div className="flex w-full gap-2 sm:w-auto sm:shrink-0"><Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={isLoadingEditorData} onClick={() => void openEditor("edit", schedule)}><UserRoundPen /> Edit</Button><Button variant="destructive" size="icon-sm" aria-label={`Delete ${schedule.name}`} disabled={isLoadingEditorData} onClick={() => setDeleting(schedule)}><Trash2 /></Button></div></div>)}</div>}
          </CardContent>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <p className="text-sm text-muted-foreground">Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}</p>
              <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Rows per page</span><Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))} disabled={loading}><SelectTrigger className="w-[84px]" aria-label="Rows per page"><SelectValue /></SelectTrigger><SelectContent align="end">{pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled={loading || currentPage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button><Button variant="outline" size="sm" disabled={loading || currentPage + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>
          </div>
        </Card>
      </main>
      <WorkScheduleEditor open={editor !== null} editor={editor} users={users} isMobile={isMobile} onClose={() => setEditor(null)} onSave={save} />
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this work schedule?</AlertDialogTitle><AlertDialogDescription>This deletes “{deleting?.name}”. Its users will remain and become unassigned.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>{isDeleting ? "Deleting…" : "Delete work schedule"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SidebarPageLayout>
  );
}

function WorkScheduleEditor({ open, editor, users, isMobile, onClose, onSave }: {
  open: boolean; editor: Editor | null; users: ManagedUser[]; isMobile: boolean;
  onClose: () => void; onSave: (name: string, userEmails: string[]) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebouncedValue(filter);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editor?.mode === "edit" ? editor.schedule.name : "");
    setSelected(editor?.mode === "edit" ? editor.schedule.userEmails : []);
    setFilter("");
    setError("");
  }, [open, editor]);

  const visibleUsers = useMemo(() => {
    const normalized = debouncedFilter.trim().toLowerCase();
    return normalized ? users.filter((user) => user.email.toLowerCase().includes(normalized)) : users;
  }, [debouncedFilter, users]);
  const currentScheduleId = editor?.mode === "edit" ? editor.schedule.id : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) { setError("Enter a work schedule name."); return; }
    setSubmitting(true);
    setError("");
    try {
      const saveError = await onSave(normalizedName, selected);
      if (saveError) setError(saveError);
    } finally {
      setSubmitting(false);
    }
  }

  return <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !submitting) onClose(); }}><SheetContent side={isMobile ? "bottom" : "right"} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl p-0 sm:max-w-md sm:rounded-none md:h-full md:max-h-none"><SheetHeader className="border-b px-6 py-5"><SheetTitle>{editor?.mode === "edit" ? "Edit work schedule" : "Add a work schedule"}</SheetTitle><SheetDescription>Choose a name and assign users. Each user can belong to at most one work schedule.</SheetDescription></SheetHeader><form className="space-y-5 px-6 py-5" onSubmit={submit}><div className="space-y-2"><Label htmlFor="work-schedule-name">Work schedule name</Label><Input id="work-schedule-name" required maxLength={10} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Hybrid" aria-describedby="work-schedule-name-limit" /><p id="work-schedule-name-limit" className="text-xs text-muted-foreground">Required, up to 10 characters.</p></div><fieldset className="space-y-3"><legend className="text-sm font-medium">Users ({selected.length})</legend><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter users by email" aria-label="Filter users" />{users.length === 0 ? <p className="text-sm text-muted-foreground">No users are available.</p> : <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">{visibleUsers.map((user) => { const otherSchedule = user.workSchedule?.id !== currentScheduleId ? user.workSchedule : null; const checked = selected.includes(user.email); return <label key={user.email} className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm ${otherSchedule ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/60"}`}><input type="checkbox" checked={checked} disabled={Boolean(otherSchedule)} onChange={() => setSelected((current) => current.includes(user.email) ? current.filter((email) => email !== user.email) : [...current, user.email])} className="size-4 accent-[#e65300]" /><span className="min-w-0 flex-1 truncate">{user.email}</span>{otherSchedule && <span className="shrink-0 text-xs text-muted-foreground">{otherSchedule.name}</span>}</label>; })}</div>}</fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2 pt-1"><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : editor?.mode === "edit" ? "Save changes" : "Create work schedule"}</Button><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button></div></form></SheetContent></Sheet>;
}
