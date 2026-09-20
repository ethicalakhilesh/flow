import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ACCENT_COOKIE, isAccent } from "@/lib/preferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flow",
  description: "Flow — personal finance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stored = cookies().get(ACCENT_COOKIE)?.value;
  const accent = isAccent(stored) ? stored : "green";

  return (
    <html lang="en" data-accent={accent}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
