"use client";

import { useEffect } from "react";
import { startAuthListener } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startAuthListener();
  }, []);

  return <>{children}</>;
}
