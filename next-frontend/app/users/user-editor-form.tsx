"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AvailableRole, UserEditorMode, UserEditorValues } from "./user-types";

const emailPattern = /^[^@\s]+@(?:[^@.\s]+\.)+[^@.\s]+$/;

type UserEditorFormProps = {
  open: boolean;
  mode: UserEditorMode;
  initialEmail: string;
  initialRoles: string[];
  availableRoles: AvailableRole[];
  onCancel: () => void;
  onSave: (values: UserEditorValues) => string | null | Promise<string | null>;
};

export default function UserEditorForm({
  open,
  mode,
  initialEmail,
  initialRoles,
  availableRoles,
  onCancel,
  onSave,
}: UserEditorFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState(initialRoles);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialRolesKey = initialRoles.join("|");
  const assignableRoles = useMemo(
    () => availableRoles.filter((role) => !role.protectedRole),
    [availableRoles],
  );

  useEffect(() => {
    if (!open) return;
    setEmail(initialEmail);
    setPassword("");
    setSelectedRoles(initialRoles);
    setError("");
  }, [open, initialEmail, initialRoles, initialRolesKey]);

  function toggleRole(role: string) {
    setSelectedRoles((current) => current.includes(role)
      ? current.filter((item) => item !== role)
      : [...current, role]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid work email address.");
      return;
    }
    if (mode === "create" && (password.length < 8 || password.length > 72)) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }
    if (mode === "edit" && selectedRoles.length === 0) {
      setError("Select at least one role.");
      return;
    }

    setIsSubmitting(true);
    try {
      const saveError = await onSave({
        email: normalizedEmail,
        password,
        roles: mode === "create" ? ["USER"] : selectedRoles,
      });
      if (saveError) setError(saveError);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Could not save this user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="user-editor-email">Email address</Label>
        <Input
          id="user-editor-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      {mode === "create" ? (
        <div className="space-y-2">
          <Label htmlFor="user-editor-password">Temporary password</Label>
          <Input
            id="user-editor-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Use 8 to 72 characters.</p>
          <p className="text-xs text-muted-foreground">New accounts start with the USER role.</p>
        </div>
      ) : (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Roles</legend>
          {assignableRoles.map((role) => (
            <label key={role.code} className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm hover:bg-muted/60">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.code)}
                onChange={() => toggleRole(role.code)}
                className="size-4 accent-[#e65300]"
              />
              <span className="font-medium">{role.code}</span>
            </label>
          ))}
          <p className="text-xs leading-5 text-muted-foreground">Protected roles cannot be changed in this preview.</p>
        </fieldset>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : mode === "create" ? "Create user" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
