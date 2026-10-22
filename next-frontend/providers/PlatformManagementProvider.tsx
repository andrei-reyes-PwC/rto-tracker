"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPlatform, deletePlatform, getPlatform, getPlatforms, updatePlatform, type Platform, type PlatformDetails } from "@/api/platforms";
import { getAllUsers } from "@/api/users";
import type { ManagedUser } from "@/app/users/user-types";
import { useCrudSearch } from "@/hooks/use-crud-search";

type Editor = { mode: "create" } | { mode: "edit"; platform: PlatformDetails };
type EditorRequest = { mode: "create" | "edit"; platform?: Platform };
type Value = { platforms: Platform[]; users: ManagedUser[]; search: string; setSearch: (search: string) => void; loading: boolean; loadError: string; editorLoadError: string; error: string; notice: string; setNotice: (message: string) => void; isLoadingEditorData: boolean; editor: Editor | null; closeEditor: () => void; deleting: Platform | null; setDeleting: (platform: Platform | null) => void; isDeleting: boolean; load: (search?: string, signal?: AbortSignal) => Promise<void>; openEditor: (mode: "create" | "edit", platform?: Platform) => Promise<void>; retryEditorLoad: () => void; save: (name: string, userEmails: string[]) => Promise<string | null>; confirmDelete: () => Promise<void> };
const Context = createContext<Value | null>(null);

export function PlatformManagementProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editorLoadError, setEditorLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoadingEditorData, setIsLoadingEditorData] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Platform | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const editorRequest = useRef<EditorRequest | null>(null);
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

  const openEditor = useCallback(async (mode: "create" | "edit", platform?: Platform) => {
    editorRequest.current = { mode, platform };
    setIsLoadingEditorData(true); setEditorLoadError(""); setError(""); setEditor(null);
    try {
      const [allUsers, details] = await Promise.all([getAllUsers(), mode === "edit" && platform ? getPlatform(platform.id) : Promise.resolve(null)]);
      setUsers(allUsers);
      setEditor(mode === "edit" && details ? { mode, platform: details } : { mode: "create" });
    } catch (cause) { setEditorLoadError(cause instanceof Error ? cause.message : "Could not load users for this platform."); }
    finally { setIsLoadingEditorData(false); }
  }, []);
  const retryEditorLoad = useCallback(() => {
    if (editorRequest.current) void openEditor(editorRequest.current.mode, editorRequest.current.platform);
  }, [openEditor]);
  const save = useCallback(async (name: string, userEmails: string[]) => {
    try {
      if (editor?.mode === "create") await createPlatform({ name, userEmails });
      else if (editor?.mode === "edit") await updatePlatform(editor.platform.id, { name, userEmails });
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
  const value = useMemo(() => ({ platforms, users, search, setSearch, loading, loadError, editorLoadError, error, notice, setNotice, isLoadingEditorData, editor, closeEditor: () => setEditor(null), deleting, setDeleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete }), [platforms, users, search, setSearch, loading, loadError, editorLoadError, error, notice, isLoadingEditorData, editor, deleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePlatformManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("usePlatformManagement must be used within PlatformManagementProvider.");
  return value;
}
