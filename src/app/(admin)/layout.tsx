import { Sidebar } from "@/components/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 min-w-0 bg-background flex justify-center">
        <div className="w-full max-w-5xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
