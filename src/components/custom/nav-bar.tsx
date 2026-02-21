"use client";
import React, { ReactNode, Suspense } from "react";
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

type NavBarProps = {
  children: ReactNode;
};

export default function NavBar({ children }: NavBarProps) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <GoogleOneTapWrapper />
      </Suspense>
      <CartProvider>
        <nav className="fixed top-0 right-0 left-0 z-50 flex flex-wrap items-center justify-between bg-cyan-950 p-3 px-4 text-white shadow-md md:px-6 lg:px-10">
          {/* Left: logo + name, then Contact Us right beside it */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6">
            <Link
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
              {/* <div className="relative h-10 w-7 md:h-12 md:w-9 bg-white rounded-sm">
                <Image
                  src={JinendraLogo}
                  alt="Jai Jinendra Logo"
                  width={100}
                  height={100}
                  className="object-center"
                />
              </div>
              <div className="relative h-10 w-8 md:h-10 md:w-9">
                <Image
                  src={BrandLogo}
                  alt="Megha Sales Corporation Logo"
                  width={60}
                  height={60}
                  className="object-fill"
                />
              </div> */}
              <div className="my-auto flex flex-col text-sm md:text-lg md:tracking-[2px]">
                <span className="font-semibold">Megha Sales</span>
                <span className="flex items-center justify-center text-xs tracking-[2px] md:text-sm md:tracking-[4px]">
                  Corporation
                </span>
              </div>
            </Link>
            <div className="bg-muted hidden h-12 w-px md:inline-flex" />
            <ContactUsLink />
          </div>

          {/* Right: Search then Account/Auth */}
          <div className="inline-flex h-full items-center gap-2 md:gap-4">
            <SearchProducts buttonClassName="text-primary font-medium md:!px-20" />
            <div className="bg-accent h-8 w-px" />
            <AuthButtons />
          </div>
        </nav>

        <div className="py-18 pb-0">{children}</div>
        {/* {isMobile && (
          <div className="fixed bottom-5 z-50 mx-auto w-full px-4">
            <SearchProducts
              variant="default"
              buttonClassName="rounded-md h-12 w-full"
            />
          </div>
        )} */}
      </CartProvider>

      <Toaster
        expand
        visibleToasts={6}
        richColors
        closeButton
        position="top-right"
        offset={{ top: 100 }}
        style={{ top: 70 }}
      />
    </AuthProvider>
  );
}
