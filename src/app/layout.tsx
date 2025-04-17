import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

import AuthButtons from "@/components/custom/auth-buttons";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import HomeLogo from "../../public/home-logo.svg";
import { AuthProvider } from "@/context/auth";
import PropertySearchLink from "@/components/custom/property-search-link";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Hot Homes",
  description: "Created with Next.js, Firebase and Tailwind CSS",
  icons: "/home-logo.svg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, height=device-height"
      />
      <body className={`${poppins.className} antialiased min-h-[100dvh]`}>
        <AuthProvider>
          <nav className="bg-sky-950 text-white p-3 flex flex-wrap justify-between items-center relative z-10">
            <Link
              href={"/"}
              className="flex items-center text-lg md:text-2xl tracking-wider gap-2 uppercase justify-end"
            >
              <div className="w-8 h-8 md:w-12 md:h-12 relative">
                <Image src={HomeLogo} alt="" fill className="object-center" />
              </div>
              <span className="mt-1 md:mt-2">Hot Homes</span>
            </Link>
            <ul className="flex flex-wrap gap-4 md:gap-6 items-center mt-2 md:mt-0">
              <li>
                <PropertySearchLink />
              </li>
              <li>
                <AuthButtons />
              </li>
            </ul>
          </nav>
          {children}
          <Toaster richColors closeButton></Toaster>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
