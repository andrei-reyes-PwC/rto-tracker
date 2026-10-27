/** Accept only same-origin absolute paths for post-authentication navigation. */
export function getSafeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;

  try {
    const url = new URL(value, "https://rto-tracker.invalid");
    if (url.origin !== "https://rto-tracker.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
