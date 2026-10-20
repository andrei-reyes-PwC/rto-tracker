"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Boxes, LoaderCircle, Plus, RefreshCw, Search, Trash2, UserRoundPen, Users } from "lucide-react";
import { getPlatforms, createPlatform, deletePlatform, updatePlatform, type Platform } from "@/api/platforms";
import { getUsers } from "@/api/users";
import type { ManagedUser } from "@/app/users/user-types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarPageLayout from "@/components/SidebarPageLayout";

type Editor = { mode: "create" } | { mode: "edit"; platform: Platform };

export default function PlatformManagement() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Platform | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [platformResults, firstUserPage] = await Promise.all([getPlatforms(), getUsers(0, 100)]);
      const allUsers = [...firstUserPage.content];
      for (let page = 1; page < firstUserPage.totalPages; page += 1) {
        const result = await getUsers(page, 100);
        allUsers.push(...result.content);
      }
      setPlatforms(platformResults);
      setUsers(allUsers);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Could not load platforms. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? platforms.filter((platform) => platform.name.toLowerCase().includes(normalized)
      || platform.userEmails.some((email) => email.toLowerCase().includes(normalized))) : platforms;
  }, [platforms, query]);

  async function save(name: string, userEmails: string[]) {
    try {
      if (editor?.mode === "create") await createPlatform({ name, userEmails });
      else if (editor?.mode === "edit") await updatePlatform(editor.platform.id, { name, userEmails });
      else return "Choose a platform to save.";
      setEditor(null);
      setNotice(`“${name}” was ${editor.mode === "create" ? "created" : "updated"}.`);
      await load();
      return null;
    } catch (saveError: unknown) {
      return saveError instanceof Error ? saveError.message : "Could not save this platform. Please try again.";
    }
  }

  async function confirmDelete() {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      await deletePlatform(deleting.id);
      setNotice(`“${deleting.name}” was deleted.`);
      setDeleting(null);
      await load();
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this platform.");
    } finally { setIsDeleting(false); }
  }

  return (
    <SidebarPageLayout headerContent={<span className="text-sm font-medium">Platforms</span>}>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b83b00] uppercase">Administration</p><h1 className="text-3xl font-semibold tracking-tight">Platform management</h1><p className="mt-2 text-sm text-muted-foreground">Group users into platforms and manage their membership.</p></div>
          <Button onClick={() => setEditor({ mode: "create" })}><Plus /> Add platform</Button>
        </div>
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {notice && <div role="status" className="rounded-lg border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
        <Card>
          <CardHeader className="gap-4 border-b">
            <div><CardTitle>Platforms</CardTitle><CardDescription>Each user can belong to multiple platforms.</CardDescription></div>
            <CardAction className="col-span-2 col-start-1 row-start-2 flex w-full items-center justify-between gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
              <div className="flex items-center gap-2 text-sm"><Boxes className="size-4 text-[#b83b00]" /><span className="font-semibold">{platforms.length}</span><span className="text-muted-foreground">{platforms.length === 1 ? "platform" : "platforms"}</span></div>
              <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw /> Refresh</Button>
            </CardAction>
            <div className="col-span-2 w-full sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:max-w-xs"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search platforms or members" aria-label="Search platforms" className="pl-9" /></div></div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Loading platforms…</div>
              : filtered.length === 0 ? <div className="px-6 py-16 text-center"><Boxes className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{error ? "Platforms could not be loaded" : platforms.length ? "No platforms match this search" : "No platforms yet"}</p><p className="mt-1 text-sm text-muted-foreground">{error ? "Check your connection and try refreshing." : "Create a platform to group workspace users."}</p></div>
                : <div className="divide-y">{filtered.map((platform) => <div key={platform.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{platform.name}</p><div className="mt-2 flex flex-wrap items-center gap-1.5"><Badge variant="secondary"><Users /> {platform.userEmails.length} {platform.userEmails.length === 1 ? "member" : "members"}</Badge>{platform.userEmails.slice(0, 5).map((email) => <Badge key={email} variant="outline">{email}</Badge>)}{platform.userEmails.length > 5 && <Badge variant="outline">+{platform.userEmails.length - 5} more</Badge>}</div></div><div className="flex w-full gap-2 sm:w-auto sm:shrink-0"><Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setEditor({ mode: "edit", platform })}><UserRoundPen /> Edit</Button><Button variant="destructive" size="icon-sm" aria-label={`Delete ${platform.name}`} onClick={() => setDeleting(platform)}><Trash2 /></Button></div></div>)}</div>}
          </CardContent>
        </Card>
      </main>
      <PlatformEditor open={editor !== null} editor={editor} users={users} isMobile={isMobile} onClose={() => setEditor(null)} onSave={save} />
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this platform?</AlertDialogTitle><AlertDialogDescription>This deletes “{deleting?.name}” and its membership links. User accounts are kept.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>{isDeleting ? "Deleting…" : "Delete platform"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SidebarPageLayout>
  );
}

function PlatformEditor({ open, editor, users, isMobile, onClose, onSave }: {
  open: boolean; editor: Editor | null; users: ManagedUser[]; isMobile: boolean;
  onClose: () => void; onSave: (name: string, userEmails: string[]) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!open) return;
    setName(editor?.mode === "edit" ? editor.platform.name : "");
    setSelected(editor?.mode === "edit" ? editor.platform.userEmails : []);
    setFilter(""); setError("");
  }, [open, editor]);

  const visibleUsers = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    return normalized ? users.filter((user) => user.email.toLowerCase().includes(normalized)) : users;
  }, [filter, users]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) { setError("Enter a platform name."); return; }
    setSubmitting(true); setError("");
    try { const saveError = await onSave(normalizedName, selected); if (saveError) setError(saveError); }
    finally { setSubmitting(false); }
  }

  return <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !submitting) onClose(); }}><SheetContent side={isMobile ? "bottom" : "right"} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl p-0 sm:max-w-md sm:rounded-none md:h-full md:max-h-none"><SheetHeader className="border-b px-6 py-5"><SheetTitle>{editor?.mode === "edit" ? "Edit platform" : "Add a platform"}</SheetTitle><SheetDescription>Choose a name and the users who belong to this group.</SheetDescription></SheetHeader><form className="space-y-5 px-6 py-5" onSubmit={submit}><div className="space-y-2"><Label htmlFor="platform-name">Platform name</Label><Input id="platform-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Technology" /></div><fieldset className="space-y-3"><legend className="text-sm font-medium">Members ({selected.length})</legend><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter users by email" aria-label="Filter users" />{users.length === 0 ? <p className="text-sm text-muted-foreground">No users are available.</p> : <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">{visibleUsers.map((user) => <label key={user.email} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/60"><input type="checkbox" checked={selected.includes(user.email)} onChange={() => setSelected((current) => current.includes(user.email) ? current.filter((email) => email !== user.email) : [...current, user.email])} className="size-4 accent-[#e65300]" /><span className="truncate">{user.email}</span></label>)}</div>}</fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2 pt-1"><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : editor?.mode === "edit" ? "Save changes" : "Create platform"}</Button><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button></div></form></SheetContent></Sheet>;
}
