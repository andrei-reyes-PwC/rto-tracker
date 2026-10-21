"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type DataLoadErrorProps = {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
};

export default function DataLoadError({ message, onRetry, retrying = false }: DataLoadErrorProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <span>{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
        <RefreshCw className={retrying ? "animate-spin" : undefined} />
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
