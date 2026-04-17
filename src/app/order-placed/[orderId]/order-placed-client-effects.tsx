"use client";

import { useEffect, useRef } from "react";
import { useCartActions } from "@/context/cartContext";
import { useNavigationLock } from "@/context/navigation-lock-provider";

export default function OrderPlacedClientEffects() {
  const { resetCartContext } = useCartActions();
  const { unlock } = useNavigationLock();
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    // Checkout uses navigation lock to prevent duplicate actions; ensure it is
    // released once the order placed route is mounted.
    unlock("order-placed-mounted");
    void resetCartContext();
  }, [resetCartContext, unlock]);

  return null;
}
