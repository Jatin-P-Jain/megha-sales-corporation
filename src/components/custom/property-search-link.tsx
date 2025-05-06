"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PropertySearchLink() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768); // Tailwind's md breakpoint
    };

    checkScreenSize(); // Initial check
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isLargeScreen) return null;

  return (
    <Link
      href="/property-search"
      className="text-sm md:text-base uppercase tracking-wider hover:underline"
    >
      About Us
    </Link>
  );
}
