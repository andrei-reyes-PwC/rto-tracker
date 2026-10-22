"use client";
import { useState, type FormEvent } from "react";
import { CalendarDays, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { type CalendarEvent, type EventInput } from "@/api/events";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import CrudActionNotice from "@/components/CrudActionNotice";
import CrudListSkeleton from "@/components/CrudListSkeleton";
import DataLoadError from "@/components/DataLoadError";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventManagementProvider, useEventManagement } from "@/providers/EventManagementProvider";

function today() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
type Draft = EventInput;
const pageSizeOptions = [10, 25, 50];
function fresh(): Draft { return { date: today(), title: "", kind: "Company event", time: "All day", place: "", required: false, scope: "GLOBAL", platformId: null }; }
export default function EventManagement() { return <EventManagementProvider><Content /></EventManagementProvider>; }

function Content() {
  const { events, platforms, search, setSearch, loading, error: loadError, notice, setNotice, load, save, remove } = useEventManagement();
  const [editor, setEditor] = useState<CalendarEvent | "new" | null>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const mobile = useIsMobile();
  const matching = events;
  const totalPages = Math.ceil(matching.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleEvents = matching.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = new FormData(formEvent.currentTarget);
    const scope = String(data.get("scope")) as Draft["scope"];
    const input: Draft = { date: String(data.get("date")), title: String(data.get("title")).trim(), kind: String(data.get("kind")).trim(), time: String(data.get("time")).trim(), place: String(data.get("place")).trim(), required: data.get("required") === "on", scope, platformId: scope === "PLATFORM" ? Number(data.get("platformId")) : null };
    if (scope === "PLATFORM" && !input.platformId) { setError("Choose a platform for this event."); return; }
    setWorking(true); setError("");
    const result = await save(input, typeof editor === "object" && editor ? editor.id : undefined);
    if (result) setError(result); else setEditor(null);
    setWorking(false);
  }
  async function confirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await remove(deleting);
    if (result) setError(result); else setDeleting(null);
    setIsDeleting(false);
  }
  return <SidebarPageLayout headerContent={<span className="text-sm font-medium">Events</span>}>
    <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Event management</h1><p className="mt-2 text-sm text-muted-foreground">Manage global events and events for a specific platform.</p></div><Button onClick={() => { setError(""); setEditor("new"); }}><Plus /> Add event</Button></div>
      {loadError && <DataLoadError message={loadError} onRetry={() => void load()} retrying={loading} />}
      {error && !editor && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      {notice && <CrudActionNotice message={notice} onDismiss={() => setNotice("")} />}
      <Card><CardHeader className="gap-4 border-b">
        <div><CardTitle>Events</CardTitle><CardDescription>Global events appear for everyone; platform events appear only for their platform.</CardDescription></div>
        <CardAction className="col-span-2 col-start-1 row-start-2 flex w-full items-center justify-between gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
          <div className="flex items-center gap-2 text-sm"><CalendarDays className="size-4 text-[#b83b00]" /><span className="font-semibold">{events.length}</span><span className="text-muted-foreground">{events.length === 1 ? "event" : "events"}</span></div>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </CardAction>
        <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder="Search events" aria-label="Search events" className="pl-9" /></div></div>
      </CardHeader><CardContent className="p-0">
        {loading ? <CrudListSkeleton label="Loading events" /> : matching.length === 0 ? <div className="px-6 py-16 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{search.trim() ? "No events match this search" : "No events yet"}</p><p className="mt-1 text-sm text-muted-foreground">Add an event to show it in the schedule planner.</p></div> : <div className="divide-y">{visibleEvents.map((e) => <div key={e.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold">{e.title}</p><p className="mt-1 text-xs text-muted-foreground">{e.date} · {e.time} · {e.place}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant="outline">{e.kind}</Badge><Badge variant="secondary">{e.scope === "GLOBAL" ? "Global" : e.platformName}</Badge>{e.required && <Badge variant="destructive">Required in office</Badge>}</div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setError(""); setEditor(e); }}>Edit</Button><Button variant="destructive" size="icon-sm" aria-label={"Delete " + e.title} onClick={() => setDeleting(e)}><Trash2 /></Button></div></div>)}</div>}
      </CardContent>
      <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <p className="text-sm text-muted-foreground">Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}</p>
          <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Rows per page</span><Select value={String(pageSize)} onValueChange={(value) => { setPage(0); setPageSize(Number(value)); }} disabled={loading}><SelectTrigger className="w-[84px]" aria-label="Rows per page"><SelectValue /></SelectTrigger><SelectContent align="end">{pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="flex gap-2"><Button variant="outline" size="sm" disabled={loading || currentPage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button><Button variant="outline" size="sm" disabled={loading || currentPage + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>
      </div>
      </Card>
    </main>
    {editor && <Editor key={typeof editor === "object" ? editor.id : "new"} initial={typeof editor === "object" ? editor : null} platforms={platforms} mobile={mobile} working={working} error={error} close={() => { if (!working) { setEditor(null); setError(""); } }} submit={submit} />}
    <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this event?</AlertDialogTitle><AlertDialogDescription>This permanently deletes “{deleting?.title}”.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90" onClick={(e) => { e.preventDefault(); void confirmDelete(); }}>{isDeleting ? "Deleting…" : "Delete event"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </SidebarPageLayout>;
}

function Editor({ initial, platforms, mobile, working, error, close, submit }: { initial: CalendarEvent | null; platforms: { id: number; name: string }[]; mobile: boolean; working: boolean; error: string; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  const draft = initial ?? fresh();
  const [scope, setScope] = useState(draft.scope);
  const field = (name: string, label: string, value: string, type = "text", maxLength?: number) => <div className="space-y-2"><Label htmlFor={"event-" + name}>{label}</Label><Input id={"event-" + name} name={name} type={type} defaultValue={value} maxLength={maxLength} required /></div>;
  return <Sheet open onOpenChange={(open) => { if (!open) close(); }}><SheetContent side={mobile ? "bottom" : "right"} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl p-0 sm:max-w-md sm:rounded-none md:h-full md:max-h-none"><SheetHeader className="border-b px-6 py-5"><SheetTitle>{initial ? "Edit event" : "Add an event"}</SheetTitle><SheetDescription>Choose who sees the event and whether office attendance is required.</SheetDescription></SheetHeader><form className="space-y-4 px-6 py-5" onSubmit={submit}>
    {field("title", "Title", draft.title, "text", 120)}
    <div className="grid grid-cols-2 gap-3">{field("date", "Date", draft.date, "date")}{field("time", "Time", draft.time, "text", 30)}</div>
    <div className="grid grid-cols-2 gap-3">{field("kind", "Event type", draft.kind, "text", 40)}{field("place", "Location", draft.place, "text", 120)}</div>
    <div className="space-y-2"><Label htmlFor="event-scope">Scope</Label><select id="event-scope" name="scope" value={scope} onChange={(event) => setScope(event.target.value as Draft["scope"])} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="GLOBAL">Global</option><option value="PLATFORM">Platform</option></select></div>
    {scope === "PLATFORM" && <div className="space-y-2"><Label htmlFor="event-platform">Platform</Label><select id="event-platform" name="platformId" defaultValue={draft.platformId ?? ""} required className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select a platform</option>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}
    <label className="flex items-center gap-2 text-sm"><input name="required" type="checkbox" defaultChecked={draft.required} className="size-4 accent-[#e65300]" /> Required in office</label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2"><Button type="submit" disabled={working}>{working ? "Saving…" : initial ? "Save changes" : "Create event"}</Button><Button type="button" variant="outline" disabled={working} onClick={close}>Cancel</Button></div>
  </form></SheetContent></Sheet>;
}
