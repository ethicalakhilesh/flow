import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Flow — Personal Finance",
  description: "Track income, expenses, and balances across all your accounts.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E7C6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} font-body antialiased`}>
        <div className="min-h-screen md:flex">
          <Sidebar />
          <main className="flex-1 pb-24 md:pb-0">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
