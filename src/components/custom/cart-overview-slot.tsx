"use client";

import React from "react";
import CartOverview from "@/components/custom/cart-overview";

export default function CartOverviewSlot({
  isUser,
  isAdmin,
}: {
  isUser: boolean;
  isAdmin: boolean;
}) {
  if (!isUser) return null;
  if (isAdmin) return null;
  return <CartOverview />;
}
