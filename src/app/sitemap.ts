import type { MetadataRoute } from "next";
import { FINDINGS } from "@/lib/evidence";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/research`, changeFrequency: "monthly", priority: 0.8 },
    ...FINDINGS.map((finding) => ({
      url: `${SITE_URL}/research/${finding.id}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
