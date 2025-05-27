"use client";

import useIsMobile from "@/hooks/useIsMobile";
import { PhoneIcon } from "lucide-react";
import Link from "next/link";

export default function ContactUsLink() {
  const isMobile = useIsMobile();
  return (
    <Link
      href="/contact-us"
      className="w-full text-sm tracking-wider uppercase hover:underline md:text-base whitespace-nowrap"
    >
      {isMobile ? <PhoneIcon className="size-5" /> : "Contact Us"}
    </Link>
  );
}
