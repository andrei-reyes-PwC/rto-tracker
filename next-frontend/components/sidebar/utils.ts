export function initialsFromEmail(email: string) {
  const localPart = email.split("@", 1)[0] ?? "";
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  if (parts.length > 1) {
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase() || "U";
}
