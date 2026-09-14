import { AuthGate } from "@/components/AuthGate";
import { AppFrame } from "@/components/AppFrame";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppFrame>{children}</AppFrame>
    </AuthGate>
  );
}
