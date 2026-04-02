"use client";

import React, { Suspense } from "react";
import { Toaster } from "sonner";

import AuthClientProvider from "@/context/AuthClientProvider";
import { CartProvider } from "@/context/cartContext";
import GoogleOneTapWrapper from "@/app/(auth)/google-one-tap-wrapper";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthClientProvider>
      <Suspense fallback={null}>
        <GoogleOneTapWrapper />
      </Suspense>

      <CartProvider>{children}</CartProvider>

      <Toaster
        expand
        visibleToasts={6}
        richColors
        closeButton
        position="top-right"
        offset={{ top: 100 }}
        style={{ top: 70 }}
      />
    </AuthClientProvider>
  );
}
