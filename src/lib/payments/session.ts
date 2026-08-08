/**
 * sessionStorage key holding the buyer's payment token for one order.
 *
 * The token gates /api/payments/*. Keeping it in sessionStorage rather than the
 * URL means it survives a refresh of the QR page but never appears in browser
 * history, access logs or a Referer header. Shared by the checkout form (which
 * writes it) and the QR page (which reads it).
 */
export function paymentTokenKey(orderNumber: string): string {
  return `lining:pay:${orderNumber}`;
}
