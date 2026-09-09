import { Nav } from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-6 md:ml-60 md:max-w-3xl md:px-10 md:pb-10 md:pt-10">
        {children}
      </main>
    </div>
  );
}
