import { Nav } from "@/components/Nav";
import { OfflinePill } from "@/components/OfflinePill";

/** The signed-in app's furniture: navigation and the content column. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <OfflinePill />
      {/* Installed on a phone the app draws under the status bar, putting the
          clock over the page heading. The bottom allowance clears the floating
          tab bar and the home indicator, so content scrolls under the bar
          without the last card ending up behind it. */}
      <main className="mx-auto max-w-2xl px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)] md:ml-60 md:max-w-3xl md:px-10 md:pb-10 md:pt-10">
        {children}
      </main>
    </div>
  );
}
