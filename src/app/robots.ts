import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin-dashboard/", // Block folders you don't want indexed (like an admin panel)
    },
    sitemap: "https://www.meghasalescorporation.in/sitemap.xml",
  };
}
