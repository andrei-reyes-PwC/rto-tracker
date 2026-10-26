"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSite, deleteSite, getSite, getSites, updateSite, type Site, type SiteDetails } from "@/api/sites";
import { getAllUsers } from "@/api/users";
import type { ManagedUser } from "@/app/users/user-types";
import { useCrudSearch } from "@/hooks/use-crud-search";

type Editor = { mode: "create" } | { mode: "edit"; site: SiteDetails };
type EditorRequest = { mode: "create" | "edit"; site?: Site };
type Value = { sites: Site[]; users: ManagedUser[]; search: string; setSearch: (search: string) => void; loading: boolean; loadError: string; editorLoadError: string; error: string; notice: string; setNotice: (message: string) => void; isLoadingEditorData: boolean; editor: Editor | null; closeEditor: () => void; deleting: Site | null; setDeleting: (site: Site | null) => void; isDeleting: boolean; load: (search?: string, signal?: AbortSignal) => Promise<void>; openEditor: (mode: "create" | "edit", site?: Site) => Promise<void>; retryEditorLoad: () => void; save: (name: string, userEmails: string[]) => Promise<string | null>; confirmDelete: () => Promise<void> };
const Context = createContext<Value | null>(null);

export function SiteManagementProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editorLoadError, setEditorLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoadingEditorData, setIsLoadingEditorData] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const editorRequest = useRef<EditorRequest | null>(null);
  const { search, setSearch, debouncedSearch } = useCrudSearch();

  const load = useCallback(async (query = debouncedSearch, signal?: AbortSignal) => {
    setLoading(true); setLoadError("");
    try {
      const result = await getSites(query, signal);
      if (!signal?.aborted) setSites(result);
    } catch (cause) { if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load sites. Please try again."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [debouncedSearch]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(debouncedSearch, controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load, debouncedSearch]);
  const openEditor = useCallback(async (mode: "create" | "edit", site?: Site) => {
    editorRequest.current = { mode, site };
    setIsLoadingEditorData(true); setEditorLoadError(""); setError(""); setEditor(null);
    try {
      const [allUsers, details] = await Promise.all([getAllUsers(), mode === "edit" && site ? getSite(site.id) : Promise.resolve(null)]);
      setUsers(allUsers);
      setEditor(mode === "edit" && details ? { mode, site: details } : { mode: "create" });
    } catch (cause) { setEditorLoadError(cause instanceof Error ? cause.message : "Could not load users for this site."); }
    finally { setIsLoadingEditorData(false); }
  }, []);
  const retryEditorLoad = useCallback(() => {
    if (editorRequest.current) void openEditor(editorRequest.current.mode, editorRequest.current.site);
  }, [openEditor]);
  const save = useCallback(async (name: string, userEmails: string[]) => {
    try {
      if (editor?.mode === "create") await createSite({ name, userEmails });
      else if (editor?.mode === "edit") await updateSite(editor.site.id, { name, userEmails });
      else return "Choose a site to save.";
      setEditor(null); setNotice(`“${name}” was ${editor.mode === "create" ? "created" : "updated"}.`); await load(debouncedSearch); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this site. Please try again."; }
  }, [editor, load, debouncedSearch]);
  const confirmDelete = useCallback(async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true); setError("");
    try { await deleteSite(deleting.id); setNotice(`“${deleting.name}” was deleted.`); setDeleting(null); await load(debouncedSearch); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete this site."); }
    finally { setIsDeleting(false); }
  }, [deleting, isDeleting, load, debouncedSearch]);
  const value = useMemo(() => ({ sites, users, search, setSearch, loading, loadError, editorLoadError, error, notice, setNotice, isLoadingEditorData, editor, closeEditor: () => setEditor(null), deleting, setDeleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete }), [sites, users, search, setSearch, loading, loadError, editorLoadError, error, notice, isLoadingEditorData, editor, deleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSiteManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("useSiteManagement must be used within SiteManagementProvider.");
  return value;
}
