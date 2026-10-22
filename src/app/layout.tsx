import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MUVO Admin",
  description: "Painel administrativo MUVO",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
