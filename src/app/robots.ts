import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Search engines get the public pages. Everything behind sign-in is of no use to them. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/home",
        "/train",
        "/plan",
        "/progress",
        "/coach",
        "/settings",
        "/evidence",
        "/upgrade",
        "/billing",
        "/onboarding",
        "/generating",
        "/account-deleted",
        "/offline",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
