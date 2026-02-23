"use client";

import NextTopLoader from "nextjs-toploader";

export default function RouteProgress() {
  return (
    <NextTopLoader
      color="#fff"
      height={2}
      showSpinner={false}
      crawl
      crawlSpeed={200}
      easing="ease"
      speed={200}
    />
  );
}
