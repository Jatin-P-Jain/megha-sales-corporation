// app/providers/RouteProgress.tsx
"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false });

export default function RouteProgress() {
  const path = usePathname();
  useEffect(() => {
    // whenever the URL updates, finish the bar
    NProgress.done();
  }, [path]);
  return null;
}
