import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AuthButtons from "@/components/custom/auth-buttons";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import BrandLogo from "../../public/brand-logo.svg";
import ContactUsLink from "@/components/custom/contact-us-link";
import { AuthProvider } from "@/context/auth-context";
import { getUserFromDB } from "@/data/user";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Megha Sales Corporation",
  description: "Auto accessories store in Raipur, Chhattisgarh",
  icons: "/brand-logo.svg",
};

export default async function RootLayout({
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
      <body
        className={`${poppins.className} max-h-screen min-h-[100dvh] antialiased`}
      >
        <AuthProvider>
          <nav className="fixed top-0 right-0 left-0 z-50 flex flex-wrap items-center justify-between bg-cyan-950 p-3 px-4 text-white shadow-md md:px-6 lg:px-10">
            <Link
              href={"/"}
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
              <li className="">
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
          ></Toaster>
        </AuthProvider>
        <div id="recaptcha-container" className="opacity-100" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
