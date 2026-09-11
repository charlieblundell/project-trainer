"use client";

import { useEffect } from "react";
import { startAuthListener } from "@/lib/auth";
import { startInstallListener } from "@/lib/install";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startAuthListener();
    // Mounted at the root so the browser's one-time install prompt isn't missed.
    startInstallListener();
  }, []);

  return <>{children}</>;
}
