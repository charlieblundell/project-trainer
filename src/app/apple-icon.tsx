import { ImageResponse } from "next/og";
import { AppMark } from "@/components/AppMark";

// iPhone and iPad home-screen icon. iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppMark size={180} inset={0.14} />, { ...size });
}
