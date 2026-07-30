const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a well-formed UUID v4.
 * Used to reject obviously invalid IDs before they reach the database layer.
 */
export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}
