/**
 * Shared user display helpers.
 * Used by AppHeader, AppSidebar, and any other component that needs to
 * derive display values from a user email address.
 */

/**
 * Derive 2-character initials from an email address.
 * "john.doe@example.com" → "JD"
 * "alice@example.com"    → "AL"
 */
export function getInitials(email: string): string {
  const local = email.split('@')[0];
  const parts = local.split(/[._\-+]/);
  if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || '?';
}

/**
 * Return the local part of an email address (before @).
 * "john.doe@example.com" → "john.doe"
 */
export function getDisplayName(email: string): string {
  return email.split('@')[0];
}
