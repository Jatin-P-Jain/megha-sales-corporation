import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Poppins } from "next/font/google";
import NavBar from "@/components/custom/nav-bar";
import { ServiceWorkerRegister } from "./service-worker-register";
import InstallPWAButton from "@/components/custom/install-pwa-button";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Megha Sales Corporation",
  description: "Auto accessories store in Raipur, Chhattisgarh",
  icons: "/brand-logo.svg",
  manifest:'/manifest.json'
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Megha Sales Corporation"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${poppins.className} max-h-screen min-h-[100dvh] antialiased`}
      >
        <ServiceWorkerRegister />
        <InstallPWAButton />
        <NavBar>{children}</NavBar>
        <div id="recaptcha-container" className="opacity-0" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
