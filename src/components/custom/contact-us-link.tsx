"use client";

import useIsMobile from "@/hooks/useIsMobile";
import Link from "next/link";
import AboutUsContactIcon from "@/assets/icons/about-contact.svg";
import Image from "next/image";

export default function ContactUsLink() {
  const isMobile = useIsMobile();
  return (
    <Link
      href="/about-contact"
      className="w-full text-sm tracking-wider whitespace-nowrap uppercase hover:underline md:text-base"
    >
      {isMobile ? (
        <div className="relative size-5">
          <Image
            src={AboutUsContactIcon}
            alt=""
            fill
            className="object-center"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <div className="relative size-6">
            <Image
              src={AboutUsContactIcon}
              alt=""
              fill
              className="object-center"
            />
          </div>
          About & Contact
        </div>
      )}
    </Link>
  );
}
