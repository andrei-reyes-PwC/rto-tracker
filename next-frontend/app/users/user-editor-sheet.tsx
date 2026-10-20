"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import UserEditorForm from "./user-editor-form";
import type { AvailableRole, UserEditorMode, UserEditorValues } from "./user-types";

type UserEditorSheetProps = {
  open: boolean;
  mode: UserEditorMode;
  initialEmail: string;
  initialRoles: string[];
  availableRoles: AvailableRole[];
  onOpenChange: (open: boolean) => void;
  onSave: (values: UserEditorValues) => string | null;
};

export default function UserEditorSheet({
  open,
  mode,
  initialEmail,
  initialRoles,
  availableRoles,
  onOpenChange,
  onSave,
}: UserEditorSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl p-0 sm:max-w-md sm:rounded-none md:h-full md:max-h-none"
      >
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{mode === "create" ? "Add a user" : "Edit account"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Create an account for the workspace."
              : "Update this user’s email and assigned roles."}
          </SheetDescription>
        </SheetHeader>
        <UserEditorForm
          key={`${mode}:${initialEmail}`}
          open={open}
          mode={mode}
          initialEmail={initialEmail}
          initialRoles={initialRoles}
          availableRoles={availableRoles}
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      </SheetContent>
    </Sheet>
  );
}
