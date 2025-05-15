"use client";

import Link from "next/link";

export default function ContactUsLink() {
  return (
    <Link
      href="/contact-us"
      className="text-sm tracking-wider uppercase hover:underline md:text-base"
    >
      Contact Us
    </Link>
  );
}
