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
      className="text-sm tracking-wider whitespace-nowrap uppercase hover:underline md:text-base"
    >
      {isMobile ? (
        <div className="relative h-full">
          <Image
            src={AboutUsContactIcon}
            alt=""
            width={25}
            height={25}
            className="object-center"
          />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center gap-2">
          <div className="relative h-full">
            <Image
              src={AboutUsContactIcon}
              alt=""
              width={30}
              height={30}
              className="h-full object-center"
            />
          </div>
          <span className="hidden lg:flex">About & Contact</span>
        </div>
      )}
    </Link>
  );
}
