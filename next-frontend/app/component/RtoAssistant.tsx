"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Bot, Send } from "lucide-react";
import { sendAssistantMessage } from "@/api/assistant";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = { role: "user" | "assistant"; text: string };

function buildConversationPrompt(messages: ChatMessage[], current: string) {
  const transcript = [...messages, { role: "user" as const, text: current }].slice(-8);
  let remaining = 6000;
  const lines: string[] = [];

  for (let index = transcript.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const item = transcript[index];
    const prefix = item.role === "user" ? "U: " : "A: ";
    const lineLength = prefix.length + item.text.length;
    if (lineLength <= remaining) {
      lines.unshift(`${prefix}${item.text}`);
      remaining -= lineLength + 2;
      continue;
    }
    if (index === transcript.length - 1 && item.role === "user") {
      const available = Math.max(0, remaining - prefix.length);
      lines.unshift(`${prefix}${item.text.slice(0, available)}`);
    }
    break;
  }

  return lines.join("\n\n");
}

export default function RtoAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const updateViewport = () => setIsMobile(mobileQuery.matches);
    updateViewport();
    mobileQuery.addEventListener("change", updateViewport);
    return () => mobileQuery.removeEventListener("change", updateViewport);
  }, []);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = message.trim();
    if (!prompt || isSending) return;

    setMessages((current) => [...current, { role: "user", text: prompt }]);
    setMessage("");
    setError("");
    setIsSending(true);
    try {
      const result = await sendAssistantMessage(buildConversationPrompt(messages, prompt));
      setMessages((current) => [...current, { role: "assistant", text: result.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not contact the RTO assistant.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} modal={isMobile}>
      <SheetTrigger asChild>
        <Button
          aria-label="Open RTO planning assistant"
          className="fixed right-5 bottom-5 z-40 h-12 w-12 gap-0 rounded-full p-0 shadow-lg sm:w-auto sm:gap-1.5 sm:px-5"
          size="lg"
        >
          <Bot aria-hidden="true" />
          <span className="hidden sm:inline">Ask assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        overlayClassName="pointer-events-auto bg-black/20 sm:pointer-events-none sm:bg-transparent"
        className="!top-auto !right-4 !bottom-20 !left-auto !h-[min(680px,calc(100dvh-6rem))] !w-[min(440px,calc(100vw-2rem))] !max-w-none gap-0 rounded-2xl border p-0 shadow-2xl data-[side=right]:data-open:slide-in-from-bottom-4"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-14">
          <SheetTitle className="flex items-center gap-2 text-sm sm:text-base"><Bot aria-hidden="true" className="size-4" /> RTO planning assistant</SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            Ask about your RTO schedule.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {messages.length > 0 && (
          <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`rounded-lg px-3 py-2 text-[13px] whitespace-pre-wrap sm:text-sm ${item.role === "user" ? "ml-8 bg-primary/10" : "mr-8 bg-background"}`}>
                <p className="mb-1 text-[10px] font-medium text-muted-foreground sm:text-xs">{item.role === "user" ? "You" : "Assistant"}</p>
                {item.text}
              </div>
            ))}
            {isSending && <p className="text-sm text-muted-foreground" role="status">Considering your events and team attendance…</p>}
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
            <p className="text-sm font-medium text-foreground">Hi! I can help you plan ahead.</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Review saved office days, events, and team attendance, or get future RTO date suggestions. Suggestions are for review and are not saved.
            </p>
          </div>
        )}
        <form onSubmit={submitMessage} className="shrink-0 space-y-2">
          <Textarea
            aria-label="Message for the RTO planning assistant"
            maxLength={500}
            rows={2}
            className="field-sizing-fixed min-h-20 resize-none placeholder:text-xs sm:placeholder:text-sm"
            placeholder="Ask about events or plan your office days…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isSending}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{message.length}/500</span>
            <Button type="submit" disabled={!message.trim() || isSending}>
              <Send aria-hidden="true" />
              {isSending ? "Generating…" : "Ask assistant"}
            </Button>
          </div>
        </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
