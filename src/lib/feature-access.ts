const STUDIO_ALLOWED_EMAILS = new Set(["rotelliofficial@gmail.com"]);

export function canAccessStudio(email?: string | null) {
  if (!email) return false;
  return STUDIO_ALLOWED_EMAILS.has(email.trim().toLowerCase());
}

