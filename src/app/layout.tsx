import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";

import Providers from "./providers";
import { ServiceWorkerRegister } from "./service-worker-register";
import InstallPWAButton from "@/components/custom/install-pwa-button";
import NetworkBanner from "@/components/custom/network-banner";
import { Footer } from "@/components/custom/footer";
import { NavBar } from "@/components/custom/navbar/nav-bar";
import RouteProgress from "@/components/custom/route-progress";
import { NavigationLockProvider } from "@/context/navigation-lock-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Megha Sales Corporation",
  description: "Auto accessories store in Raipur, Chhattisgarh",
  icons: "/favicon.svg",
  manifest: "/site.webmanifest.json",
  alternates: {
    canonical: "https://www.meghasalescorporation.in/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
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
        <link rel="manifest" href="/site.webmanifest.json" />

        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Megha Sales Corporation",
              url: "https://www.meghasalescorporation.in",
              logo: "https://www.meghasalescorporation.in/favicon.png",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+91-9425505557",
                contactType: "sales",
                areaServed: "IN",
                availableLanguage: ["en", "hi"],
              },
            }),
          }}
        />
      </head>

      <body
        className={`${poppins.className} no-scrollbar max-h-screen min-h-[100dvh] antialiased`}
      >
        <Providers>
          <ServiceWorkerRegister />
          <Suspense fallback={null}>
            <NavigationLockProvider>
              <InstallPWAButton />

              <RouteProgress />
              <NavBar />
              <div className="mx-auto max-w-screen-lg px-4 pt-20 pb-8 md:p-8 md:pt-28">
                {children}
              </div>

              <Footer />
              <NetworkBanner />
            </NavigationLockProvider>
          </Suspense>
        </Providers>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
