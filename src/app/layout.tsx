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
import { AuthProvider } from "@/context/auth";
import AboutUsLink from "@/components/custom/about-us-link";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Megha Sales Corporation",
  description: "Auto accessories store in Raipur, Chhattisgarh",
  icons: "/brand-logo.svg",
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
      <body
        className={`${poppins.className} antialiased min-h-[100dvh] max-h-screen`}
      >
        <AuthProvider>
          <nav className="bg-cyan-950 text-white p-3 px-3 md:px-6 lg:px-10 flex flex-wrap justify-between items-center relative z-10">
            <Link
              href={"/"}
              className="flex items-center text-lg md:text-2xl tracking-wider gap-2 md:gap-4 uppercase justify-end"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 relative">
                <Image src={BrandLogo} alt="" fill className="object-center" />
              </div>
              <div className="flex flex-col  text-sm md:text-lg md:tracking-[2px]">
                <span className=" font-semibold mt-1 md:mt-2">Megha Sales</span>
                <span className="text-xs md:text-sm flex items-center justify-center tracking-[2px] md:tracking-[4px]">
                  Corporation
                </span>
              </div>
            </Link>
            <ul className="flex flex-wrap gap-4 md:gap-6 items-center mt-2 md:mt-0">
              <li>
                <AboutUsLink />
              </li>
              <li>
                <AuthButtons />
              </li>
            </ul>
          </nav>
          {children}
          <Toaster richColors closeButton></Toaster>
        </AuthProvider>
        <div id="recaptcha-container" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
