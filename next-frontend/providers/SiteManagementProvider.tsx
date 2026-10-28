"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSite, deleteSite, getSites, updateSite, type Site } from "@/api/sites";
import { useCrudSearch } from "@/hooks/use-crud-search";

type Editor = { mode: "create" } | { mode: "edit"; site: Site };
type Value = { sites: Site[]; search: string; setSearch: (search: string) => void; loading: boolean; loadError: string; error: string; notice: string; setNotice: (message: string) => void; editor: Editor | null; closeEditor: () => void; deleting: Site | null; setDeleting: (site: Site | null) => void; isDeleting: boolean; load: (search?: string, signal?: AbortSignal) => Promise<void>; openEditor: (mode: "create" | "edit", site?: Site) => void; save: (name: string) => Promise<string | null>; confirmDelete: () => Promise<void> };
const Context = createContext<Value | null>(null);

export function SiteManagementProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const openEditor = useCallback((mode: "create" | "edit", site?: Site) => {
    setError(""); setEditor(mode === "edit" && site ? { mode, site } : { mode: "create" });
  }, []);
  const save = useCallback(async (name: string) => {
    try {
      if (editor?.mode === "create") await createSite({ name });
      else if (editor?.mode === "edit") await updateSite(editor.site.id, { name });
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
  const value = useMemo(() => ({ sites, search, setSearch, loading, loadError, error, notice, setNotice, editor, closeEditor: () => setEditor(null), deleting, setDeleting, isDeleting, load, openEditor, save, confirmDelete }), [sites, search, setSearch, loading, loadError, error, notice, editor, deleting, isDeleting, load, openEditor, save, confirmDelete]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSiteManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("useSiteManagement must be used within SiteManagementProvider.");
  return value;
}
