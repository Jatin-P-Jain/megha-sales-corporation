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
import SearchProducts from "./search-products";
import useIsMobile from "@/hooks/useIsMobile";

type NavBarProps = {
  children: ReactNode;
};

export default function NavBar({ children }: NavBarProps) {
  const isMobile = useIsMobile();
  return (
    <AuthProvider>
      <GoogleOneTapWrapper />
      <CartProvider>
        <nav className="fixed top-0 right-0 left-0 z-50 flex flex-wrap justify-between items-center bg-cyan-950 p-3 px-4 text-white shadow-md md:px-6 lg:px-10">
          {/* Left: logo + name, then Contact Us right beside it */}
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <Link
              href="/"
              className="flex items-center justify-end gap-2 text-lg tracking-wider uppercase md:gap-4 md:text-2xl"
            >
              <div className="relative h-10 w-7 md:h-12 md:w-9">
                <Image
                  src={JinendraLogo}
                  alt=""
                  width={100}
                  height={100}
                  className="object-center"
                />
              </div>
              <div className="relative h-10 w-8 md:h-12 md:w-10">
                <Image
                  src={BrandLogo}
                  alt=""
                  width={100}
                  height={100}
                  className="object-center"
                />
              </div>
              <div className="ml-1 flex flex-col text-sm md:text-lg md:tracking-[2px]">
                <span className="mt-1 font-semibold md:mt-2">Megha Sales</span>
                <span className="flex items-center justify-center text-xs tracking-[2px] md:text-sm md:tracking-[4px]">
                  Corporation
                </span>
              </div>
            </Link>

            <ContactUsLink />
          </div>

          {/* Right: Search then Account/Auth */}
          <div className="flex items-center gap-3">
            {!isMobile && <SearchProducts buttonClassName="text-primary font-medium md:!px-20" />}
            <div className="h-8 bg-accent w-px"/>
            <AuthButtons />
          </div>
        </nav>

        <div className="pt-18">{children}</div>
        {isMobile && <div className="fixed bottom-0 w-full z-50">
          <SearchProducts variant="default" buttonClassName="rounded-none h-12 w-full"/>
        </div>}
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
