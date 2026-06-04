"use client";

import { useEffect, useState } from "react";

/** True after first client mount — guards against hydration mismatches for
 *  client-only state such as the persisted cart. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
