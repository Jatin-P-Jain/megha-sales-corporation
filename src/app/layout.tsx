import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Poppins } from "next/font/google";
import NavBar from "@/components/custom/nav-bar";

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
        <NavBar>{children}</NavBar>
        <div id="recaptcha-container" className="opacity-0" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
