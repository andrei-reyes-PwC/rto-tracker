"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import UserEditorForm from "./user-editor-form";
import type { AvailableRole, UserEditorMode, UserEditorValues } from "./user-types";
import type { PlatformOption } from "@/api/platforms";

type UserEditorSheetProps = {
  open: boolean;
  mode: UserEditorMode;
  isSelf: boolean;
  initialEmail: string;
  initialRoles: string[];
  initialPlatformId: number | null;
  initialWorkScheduleId: number | null;
  availableRoles: AvailableRole[];
  platforms: PlatformOption[];
  workSchedules: PlatformOption[];
  onOpenChange: (open: boolean) => void;
  onSave: (values: UserEditorValues) => string | null | Promise<string | null>;
};

export default function UserEditorSheet({
  open,
  mode,
  isSelf,
  initialEmail,
  initialRoles,
  initialPlatformId,
  initialWorkScheduleId,
  availableRoles,
  platforms,
  workSchedules,
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
              : isSelf ? "Update your email, additional roles, platform, and work schedule. SUPER_ADMIN access is retained."
                : "Update this user’s email, roles, platform, and work schedule."}
          </SheetDescription>
        </SheetHeader>
        <UserEditorForm
          key={`${mode}:${initialEmail}`}
          open={open}
          mode={mode}
          isSelf={isSelf}
          initialEmail={initialEmail}
          initialRoles={initialRoles}
          initialPlatformId={initialPlatformId}
          initialWorkScheduleId={initialWorkScheduleId}
          availableRoles={availableRoles}
          platforms={platforms}
          workSchedules={workSchedules}
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      </SheetContent>
    </Sheet>
  );
}
