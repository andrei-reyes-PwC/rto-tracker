"use client";

import { useState, type FormEvent } from "react";
import { Bot, Send } from "lucide-react";
import { sendAssistantMessage } from "@/api/assistant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = { role: "user" | "assistant"; text: string };

function buildConversationPrompt(messages: ChatMessage[], current: string) {
  const transcript = [...messages, { role: "user" as const, text: current }].slice(-8);
  let remaining = 4000;
  const lines: string[] = [];

  for (let index = transcript.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const item = transcript[index];
    const prefix = item.role === "user" ? "U: " : "A: ";
    const available = Math.max(0, remaining - prefix.length - 2);
    if (available === 0) break;
    const text = item.text.slice(-available);
    lines.unshift(`${prefix}${text}`);
    remaining -= prefix.length + text.length + 2;
  }

  return lines.join("\n\n");
}

export default function RtoAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot aria-hidden="true" className="size-4" /> RTO planning assistant</CardTitle>
        <CardDescription>
          Ask for a draft plan. The assistant can check your saved office days, visible events, and team attendance from today through the end of next month. Past office days are excluded; suggestions are not saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length > 0 && (
          <div aria-live="polite" className="max-h-72 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${item.role === "user" ? "ml-8 bg-primary/10" : "mr-8 bg-background"}`}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{item.role === "user" ? "You" : "Assistant"}</p>
                {item.text}
              </div>
            ))}
            {isSending && <p className="text-sm text-muted-foreground" role="status">Considering your events and team attendance…</p>}
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <form onSubmit={submitMessage} className="space-y-3">
          <Textarea
            aria-label="Message for the RTO planning assistant"
            maxLength={4000}
            rows={3}
            className="field-sizing-fixed min-h-24 resize-none"
            placeholder="For example: Plan 11 office days per month, preferring Wednesday to Friday and prioritizing required events."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isSending}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{message.length}/4000</span>
            <Button type="submit" disabled={!message.trim() || isSending}>
              <Send aria-hidden="true" />
              {isSending ? "Generating…" : "Ask assistant"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
