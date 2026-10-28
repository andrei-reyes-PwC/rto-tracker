export type AssistantReply = {
  reply: string;
  model_id: string;
  usage: { input_tokens: number; output_tokens: number; total_tokens: number };
};

type ApiErrorResponse = { message?: string; detail?: string | unknown[]; details?: string[] };

async function errorMessage(response: Response): Promise<string> {
  if (response.status >= 500) return "Assistant is temporarily unavailable. Please try again.";
  if (response.status === 401 || response.status === 403) {
    return "Your session has expired. Please sign in again.";
  }
  if (response.status === 429) return "The assistant is busy. Please try again shortly.";

  const result = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  if (result?.message) return result.message;
  if (typeof result?.detail === "string") return result.detail;
  if (result?.details?.length) return result.details.join(" ");
  return "The RTO assistant could not answer right now.";
}

export async function sendAssistantMessage(message: string): Promise<AssistantReply> {
  const tokenResponse = await fetch("/api/auth/assistant-token", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error(await errorMessage(tokenResponse));
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Could not start an authenticated assistant session.");

  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.access_token}`,
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  const result = (await response.json().catch(() => null)) as AssistantReply | null;
  if (!result?.reply) throw new Error("The RTO assistant returned an empty response.");
  return result;
}
