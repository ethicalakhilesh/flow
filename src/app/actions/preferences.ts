"use server";

import { cookies } from "next/headers";
import { ACCENT_COOKIE, isAccent } from "@/lib/preferences";

export async function setAccentPreference(accent: string) {
  if (!isAccent(accent)) return;
  cookies().set(ACCENT_COOKIE, accent, {
    httpOnly: false, // client needs to read it for instant client-side theming
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
