import type { Metadata } from "next";
import { defaultLocale, localeDirections } from "@/lib/constants/locales";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabFlow Dental CRM",
  description: "Cloud dental laboratory CRM and production management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale} dir={localeDirections[defaultLocale]}>
      <body>{children}</body>
    </html>
  );
}
