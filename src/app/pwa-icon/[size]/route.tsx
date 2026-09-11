import { ImageResponse } from "next/og";
import { AppMark } from "@/components/AppMark";

/**
 * Home-screen icons referenced by the web app manifest. The maskable version
 * keeps the barbell well inside the safe zone, because Android crops these
 * into circles and squircles.
 */
const VARIANTS = {
  "192": { size: 192, inset: 0.1 },
  "512": { size: 512, inset: 0.1 },
  maskable: { size: 512, inset: 0.2 },
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const variant = VARIANTS[size as keyof typeof VARIANTS];
  if (!variant) return new Response("Not found", { status: 404 });

  return new ImageResponse(<AppMark size={variant.size} inset={variant.inset} />, {
    width: variant.size,
    height: variant.size,
  });
}
