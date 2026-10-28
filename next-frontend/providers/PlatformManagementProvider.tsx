"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPlatform, deletePlatform, getPlatforms, updatePlatform, type Platform } from "@/api/platforms";
import { useCrudSearch } from "@/hooks/use-crud-search";

type Editor = { mode: "create" } | { mode: "edit"; platform: Platform };
type Value = { platforms: Platform[]; search: string; setSearch: (search: string) => void; loading: boolean; loadError: string; error: string; notice: string; setNotice: (message: string) => void; editor: Editor | null; closeEditor: () => void; deleting: Platform | null; setDeleting: (platform: Platform | null) => void; isDeleting: boolean; load: (search?: string, signal?: AbortSignal) => Promise<void>; openEditor: (mode: "create" | "edit", platform?: Platform) => void; save: (name: string) => Promise<string | null>; confirmDelete: () => Promise<void> };
const Context = createContext<Value | null>(null);

export function PlatformManagementProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Platform | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { search, setSearch, debouncedSearch } = useCrudSearch();

  const load = useCallback(async (query = debouncedSearch, signal?: AbortSignal) => {
    setLoading(true); setLoadError("");
    try {
      const result = await getPlatforms(query, signal);
      if (!signal?.aborted) setPlatforms(result);
    } catch (cause) { if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load platforms. Please try again."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [debouncedSearch]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(debouncedSearch, controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load, debouncedSearch]);

  const openEditor = useCallback((mode: "create" | "edit", platform?: Platform) => {
    setError(""); setEditor(mode === "edit" && platform ? { mode, platform } : { mode: "create" });
  }, []);
  const save = useCallback(async (name: string) => {
    try {
      if (editor?.mode === "create") await createPlatform({ name });
      else if (editor?.mode === "edit") await updatePlatform(editor.platform.id, { name });
      else return "Choose a platform to save.";
      setEditor(null); setNotice(`“${name}” was ${editor.mode === "create" ? "created" : "updated"}.`); await load(debouncedSearch); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this platform. Please try again."; }
  }, [editor, load, debouncedSearch]);
  const confirmDelete = useCallback(async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true); setError("");
    try { await deletePlatform(deleting.id); setNotice(`“${deleting.name}” was deleted.`); setDeleting(null); await load(debouncedSearch); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete this platform."); }
    finally { setIsDeleting(false); }
  }, [deleting, isDeleting, load, debouncedSearch]);
  const value = useMemo(() => ({ platforms, search, setSearch, loading, loadError, error, notice, setNotice, editor, closeEditor: () => setEditor(null), deleting, setDeleting, isDeleting, load, openEditor, save, confirmDelete }), [platforms, search, setSearch, loading, loadError, error, notice, editor, deleting, isDeleting, load, openEditor, save, confirmDelete]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePlatformManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("usePlatformManagement must be used within PlatformManagementProvider.");
  return value;
}
