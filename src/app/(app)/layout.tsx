import { Nav } from "@/components/Nav";
import { AuthGate } from "@/components/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Nav />
        {/* Installed on a phone the app draws under the status bar, putting the
            clock over the page heading. The bottom bar already allows for the
            home indicator; the top needs the same allowance. */}
        <main className="mx-auto max-w-2xl px-5 pb-24 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:ml-60 md:max-w-3xl md:px-10 md:pb-10 md:pt-10">
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
