"use client";
import React, { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import BrandLogo from "../../../public/brand-logo.svg";
import JinendraLogo from "../../../public/jai-jinendra.png";
import ContactUsLink from "./contact-us-link";
import AuthButtons from "./auth-buttons";
import { AuthProvider } from "@/context/useAuth";
import { CartProvider } from "@/context/cartContext";
import GoogleOneTapWrapper from "@/app/(auth)/google-one-tap-wrapper";

type NavBarProps = {
  children: ReactNode;
};

export default function NavBar({ children }: NavBarProps) {
  return (
    <AuthProvider>
      <GoogleOneTapWrapper />
      <CartProvider>
        <nav className="fixed top-0 right-0 left-0 z-50 flex flex-wrap items-center justify-between bg-cyan-950 p-3 px-4 text-white shadow-md md:px-6 lg:px-10">
          <Link
            href="/"
            className="flex items-center justify-end gap-0 text-lg tracking-wider uppercase md:gap-2 md:text-2xl"
          >
            <div className="relative h-8 w-6 md:h-10 md:w-8">
              <Image src={JinendraLogo} alt="" fill className="object-center" />
            </div>
            <div className="relative h-8 w-8 md:h-10 md:w-10">
              <Image src={BrandLogo} alt="" fill className="object-center" />
            </div>
            <div className="ml-1 flex flex-col text-sm md:text-lg md:tracking-[2px]">
              <span className="mt-1 font-semibold md:mt-2">Megha Sales</span>
              <span className="flex items-center justify-center text-xs tracking-[2px] md:text-sm md:tracking-[4px]">
                Corporation
              </span>
            </div>
          </Link>
          <ul className="flex items-center justify-between gap-4 md:mt-0">
            <li className="">
              <ContactUsLink />
            </li>
            {/* <li className="">
              <SearchBar onSearch={() => {}} />
            </li> */}
            <li className="flex w-fit items-center justify-center">
              <AuthButtons />
            </li>
          </ul>
        </nav>
        <div className="pt-18">{children}</div>
      </CartProvider>
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
