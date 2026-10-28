import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InlineNotificationProps = {
  message: string;
  tone?: "success" | "error";
  onDismiss?: () => void;
  action?: ReactNode;
};

export default function InlineNotification({ message, tone = "error", onDismiss, action }: InlineNotificationProps) {
  const positive = tone === "success";
  return (
    <div
      role={positive ? "status" : "alert"}
      aria-live={positive ? "polite" : "assertive"}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        positive ? "border-emerald-600/20 bg-emerald-50 text-emerald-800" : "border-destructive/30 bg-destructive/5 text-destructive",
      )}
    >
      <span className="min-w-0 flex-1">{message}</span>
      {action}
      {onDismiss && <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={cn(
          "-mr-1",
          positive ? "text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900" : "text-destructive hover:bg-destructive/10 hover:text-destructive",
        )}
        aria-label="Dismiss notification"
        onClick={onDismiss}
      ><X aria-hidden="true" /></Button>}
    </div>
  );
}
