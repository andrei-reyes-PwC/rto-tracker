import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CrudActionNotice({ message, onDismiss }: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 rounded-lg border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <span>{message}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="-mr-1 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
