import { isQpayEnabled } from "@/services/payment";
import { CheckoutForm } from "./checkout-form";

// Rendered per request so the QPay option reflects the current Wire config
// rather than whatever was true at build time.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm qpayEnabled={isQpayEnabled()} />;
}
