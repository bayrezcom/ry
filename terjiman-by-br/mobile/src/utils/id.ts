/**
 * Local-only identifier for history records. Not security sensitive: it just
 * needs to be unique on one device, so time plus randomness is enough.
 */
export function createId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}-${random}`;
}
