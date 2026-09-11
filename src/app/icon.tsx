import { ImageResponse } from "next/og";
import { AppMark } from "@/components/AppMark";

// Browser tab icon. A barely-there margin, so the barbell reads at 32px.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppMark size={32} inset={0.06} />, { ...size });
}
