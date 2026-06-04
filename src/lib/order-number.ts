/** Human-friendly order number, e.g. "LC-5K3J9A". */
export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `LC-${stamp}${rand}`;
}
