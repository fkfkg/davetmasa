import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Etkinlik Oturma Düzeni",
  description:
    "Etkinlikleriniz için profesyonel oturma düzeni oluşturun",
  keywords: [
    "masa planı",
    "düğün",
    "oturma düzeni",
    "salon",
    "organizasyon",
    "misafir listesi",
    "QR kod",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-cream-50 text-navy-700 antialiased">
        {children}
      </body>
    </html>
  );
}
