"use client";

import { useEffect, useState } from "react";
import { setAccentPreference } from "@/app/actions/preferences";
import type { Accent } from "@/lib/preferences";

type Theme = "light" | "dark" | "system";

export function ThemeAccentToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [accent, setAccent] = useState<Accent>("green");

  // Theme stays client-only (localStorage) — not a per-user persisted
  // preference yet. Accent's initial value comes from the server-rendered
  // data-accent attribute (cookie), so we read that instead of localStorage
  // to stay in sync with SSR.
  useEffect(() => {
    const storedTheme = (localStorage.getItem("flow_theme") as Theme) || "system";
    setTheme(storedTheme);

    const current = document.documentElement.getAttribute("data-accent");
    if (current === "green" || current === "blue") setAccent(current);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    localStorage.setItem("flow_theme", theme);
  }, [theme]);

  function selectAccent(next: Accent) {
    setAccent(next);
    document.documentElement.setAttribute("data-accent", next); // instant, no reload
    setAccentPreference(next); // persist to cookie in the background
  }

  return (
    <div className="flex items-center gap-3">
      <button
        className="rounded-card border border-border bg-surface px-3 py-1.5 text-sm"
        onClick={() =>
          setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")
        }
      >
        Theme: {theme}
      </button>
      <div className="flex items-center gap-1.5" role="group" aria-label="Accent color">
        <button
          aria-label="Green accent"
          aria-pressed={accent === "green"}
          onClick={() => selectAccent("green")}
          className={`h-6 w-6 rounded-full border-2 ${accent === "green" ? "border-foreground" : "border-transparent"}`}
          style={{ backgroundColor: "#639922" }}
        />
        <button
          aria-label="Blue accent"
          aria-pressed={accent === "blue"}
          onClick={() => selectAccent("blue")}
          className={`h-6 w-6 rounded-full border-2 ${accent === "blue" ? "border-foreground" : "border-transparent"}`}
          style={{ backgroundColor: "#185fa5" }}
        />
      </div>
    </div>
  );
}
