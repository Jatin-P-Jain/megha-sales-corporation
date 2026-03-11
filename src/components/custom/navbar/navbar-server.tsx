import React from "react";
import Image from "next/image";
import BrandLogo from "../../../../public/brand-logo.svg";
import JinendraLogo from "../../../../public/jai-jinendra.png";
import ContactUsLink from "../contact-us-link";
import NavBarClientRight from "./navbar-client-right";
import { SafeLink } from "../utility/SafeLink";

export default function NavBarServer() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-60 flex flex-wrap items-center justify-between bg-cyan-950 p-3 px-4 text-white shadow-md lg:px-8">
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        <SafeLink
          href="/"
          className="flex items-center justify-center gap-1 text-lg tracking-wider uppercase md:gap-4 md:text-2xl"
        >
          <div className="relative flex h-10 w-8 items-center justify-center md:h-15 md:w-auto">
            <Image
              src={JinendraLogo}
              alt="Jai Jinendra Logo"
              width={60}
              height={60}
              className="block h-full w-full object-contain"
            />
          </div>

          <div className="relative flex h-10 w-8 items-center justify-center md:h-15 md:w-auto">
            <Image
              src={BrandLogo}
              alt="Megha Sales Corporation Logo"
              width={60}
              height={60}
              className="block h-full w-full object-contain"
            />
          </div>

          <div className="my-auto flex flex-col text-base md:text-lg md:tracking-[2px]">
            <span className="font-semibold">Megha Sales</span>
            <span className="flex items-center justify-center text-sm tracking-[2px] md:text-base md:tracking-[4px]">
              Corporation
            </span>
          </div>
        </SafeLink>

        <div className="bg-muted hidden h-12 w-px md:inline-flex" />
        <ContactUsLink />
      </div>

      <NavBarClientRight />
    </nav>
  );
}
