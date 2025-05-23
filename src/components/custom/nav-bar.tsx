"use client";
import React, { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import BrandLogo from "../../../public/brand-logo.svg";
import ContactUsLink from "./contact-us-link";
import AuthButtons from "./auth-buttons";
import { AuthProvider } from "@/context/useAuth";

type NavBarProps = {
  children: ReactNode;
};

export default function NavBar({ children }: NavBarProps) {
  return (
    <AuthProvider>
      <nav className="fixed top-0 right-0 left-0 z-50 flex flex-wrap items-center justify-between bg-cyan-950 p-3 px-4 text-white shadow-md md:px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center justify-end gap-2 text-lg tracking-wider uppercase md:gap-4 md:text-2xl"
        >
          <div className="relative h-10 w-10 md:h-14 md:w-14">
            <Image src={BrandLogo} alt="" fill className="object-center" />
          </div>
          <div className="flex flex-col text-sm md:text-lg md:tracking-[2px]">
            <span className="mt-1 font-semibold md:mt-2">Megha Sales</span>
            <span className="flex items-center justify-center text-xs tracking-[2px] md:text-sm md:tracking-[4px]">
              Corporation
            </span>
          </div>
        </Link>
        <ul className="flex flex-wrap items-center justify-center gap-4 md:mt-0 md:gap-6">
          <li>
            <ContactUsLink />
          </li>
          <li className="flex items-center justify-center">
            <AuthButtons />
          </li>
        </ul>
      </nav>
      <div className="pt-18">{children}</div>
      <Toaster
        richColors
        closeButton
        position="top-right"
        offset={{ top: 100 }}
        style={{ top: 70 }}
      />
    </AuthProvider>
  );
}
