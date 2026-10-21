"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createWorkSchedule, deleteWorkSchedule, getWorkSchedule, getWorkSchedules, updateWorkSchedule, type WorkSchedule, type WorkScheduleDetails } from "@/api/work-schedules";
import { getAllUsers } from "@/api/users";
import type { ManagedUser } from "@/app/users/user-types";

type Editor = { mode: "create" } | { mode: "edit"; schedule: WorkScheduleDetails };
type EditorRequest = { mode: "create" | "edit"; schedule?: WorkSchedule };
type Value = { schedules: WorkSchedule[]; users: ManagedUser[]; loading: boolean; loadError: string; editorLoadError: string; error: string; notice: string; setNotice: (message: string) => void; isLoadingEditorData: boolean; editor: Editor | null; closeEditor: () => void; deleting: WorkSchedule | null; setDeleting: (schedule: WorkSchedule | null) => void; isDeleting: boolean; load: () => Promise<void>; openEditor: (mode: "create" | "edit", schedule?: WorkSchedule) => Promise<void>; retryEditorLoad: () => void; save: (name: string, userEmails: string[]) => Promise<string | null>; confirmDelete: () => Promise<void> };
const Context = createContext<Value | null>(null);

export function WorkScheduleManagementProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editorLoadError, setEditorLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoadingEditorData, setIsLoadingEditorData] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<WorkSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const editorRequest = useRef<EditorRequest | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setLoadError("");
    try {
      const result = await getWorkSchedules(signal);
      if (!signal?.aborted) setSchedules(result);
    } catch (cause) { if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "Could not load work schedules. Please try again."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);
  const openEditor = useCallback(async (mode: "create" | "edit", schedule?: WorkSchedule) => {
    editorRequest.current = { mode, schedule };
    setIsLoadingEditorData(true); setEditorLoadError(""); setError(""); setEditor(null);
    try {
      const [allUsers, details] = await Promise.all([getAllUsers(), mode === "edit" && schedule ? getWorkSchedule(schedule.id) : Promise.resolve(null)]);
      setUsers(allUsers);
      setEditor(mode === "edit" && details ? { mode, schedule: details } : { mode: "create" });
    } catch (cause) { setEditorLoadError(cause instanceof Error ? cause.message : "Could not load users for this work schedule."); }
    finally { setIsLoadingEditorData(false); }
  }, []);
  const retryEditorLoad = useCallback(() => {
    if (editorRequest.current) void openEditor(editorRequest.current.mode, editorRequest.current.schedule);
  }, [openEditor]);
  const save = useCallback(async (name: string, userEmails: string[]) => {
    try {
      if (editor?.mode === "create") await createWorkSchedule({ name, userEmails });
      else if (editor?.mode === "edit") await updateWorkSchedule(editor.schedule.id, { name, userEmails });
      else return "Choose a work schedule to save.";
      setEditor(null); setNotice(`“${name}” was ${editor.mode === "create" ? "created" : "updated"}.`); await load(); return null;
    } catch (cause) { return cause instanceof Error ? cause.message : "Could not save this work schedule. Please try again."; }
  }, [editor, load]);
  const confirmDelete = useCallback(async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true); setError("");
    try { await deleteWorkSchedule(deleting.id); setNotice(`“${deleting.name}” was deleted.`); setDeleting(null); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete this work schedule."); }
    finally { setIsDeleting(false); }
  }, [deleting, isDeleting, load]);
  const value = useMemo(() => ({ schedules, users, loading, loadError, editorLoadError, error, notice, setNotice, isLoadingEditorData, editor, closeEditor: () => setEditor(null), deleting, setDeleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete }), [schedules, users, loading, loadError, editorLoadError, error, notice, isLoadingEditorData, editor, deleting, isDeleting, load, openEditor, retryEditorLoad, save, confirmDelete]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkScheduleManagement() {
  const value = useContext(Context);
  if (!value) throw new Error("useWorkScheduleManagement must be used within WorkScheduleManagementProvider.");
  return value;
}
