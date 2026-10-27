"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createWorkSchedule, deleteWorkSchedule, getWorkSchedules, updateWorkSchedule, type WorkSchedule } from "@/api/work-schedules";
import { useCrudSearch } from "@/hooks/use-crud-search";

type Editor = { mode: "create" } | { mode: "edit"; schedule: WorkSchedule };
type Value = { schedules: WorkSchedule[]; search: string; setSearch: (search: string) => void; loading: boolean; loadError: string; error: string; notice: string; setNotice: (message: string) => void; editor: Editor | null; closeEditor: () => void; deleting: WorkSchedule | null; setDeleting: (schedule: WorkSchedule | null) => void; isDeleting: boolean; load: (search?: string, signal?: AbortSignal) => Promise<void>; openEditor: (mode: "create" | "edit", schedule?: WorkSchedule) => void; save: (name: string) => Promise<string | null>; confirmDelete: () => Promise<void> };
const Context = createContext<Value | null>(null);

export function WorkScheduleManagementProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<WorkSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { search, setSearch, debouncedSearch } = useCrudSearch();

  const load = useCallback(async (query = debouncedSearch, signal?: AbortSignal) => {
    setLoading(true); setLoadError("");
    try {
      const result = await getWorkSchedules(query, signal);
      if (!signal?.aborted) setSchedules(result);
    } catch (cause) { if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load work schedules. Please try again."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [debouncedSearch]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(debouncedSearch, controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load, debouncedSearch]);
  const openEditor = useCallback((mode: "create" | "edit", schedule?: WorkSchedule) => {
    setError(""); setEditor(mode === "edit" && schedule ? { mode, schedule } : { mode: "create" });
  }, []);
  const save = useCallback(async (name: string) => {
    try {
      if (editor?.mode === "create") await createWorkSchedule({ name });
      else if (editor?.mode === "edit") await updateWorkSchedule(editor.schedule.id, { name });
      else return "Choose a work schedule to save.";
      setEditor(null); setNotice(`“${name}” was ${editor.mode === "create" ? "created" : "updated"}.`); await load(debouncedSearch); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this work schedule. Please try again."; }
  }, [editor, load, debouncedSearch]);
  const confirmDelete = useCallback(async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true); setError("");
    try { await deleteWorkSchedule(deleting.id); setNotice(`“${deleting.name}” was deleted.`); setDeleting(null); await load(debouncedSearch); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete this work schedule."); }
    finally { setIsDeleting(false); }
  }, [deleting, isDeleting, load, debouncedSearch]);
  const value = useMemo(() => ({ schedules, search, setSearch, loading, loadError, error, notice, setNotice, editor, closeEditor: () => setEditor(null), deleting, setDeleting, isDeleting, load, openEditor, save, confirmDelete }), [schedules, search, setSearch, loading, loadError, error, notice, editor, deleting, isDeleting, load, openEditor, save, confirmDelete]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkScheduleManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("useWorkScheduleManagement must be used within WorkScheduleManagementProvider.");
  return value;
}
