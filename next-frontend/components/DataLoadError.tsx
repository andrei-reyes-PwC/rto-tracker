"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import InlineNotification from "@/components/InlineNotification";

type DataLoadErrorProps = {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  onDismiss?: () => void;
};

export default function DataLoadError({ message, onRetry, retrying = false, onDismiss }: DataLoadErrorProps) {
  return (
    <InlineNotification message={message} tone="error" onDismiss={onDismiss} action={
      <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
        <RefreshCw className={retrying ? "animate-spin" : undefined} />
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    } />
  );
}
