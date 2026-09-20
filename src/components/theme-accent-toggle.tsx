"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Accent = "green" | "blue";

export function ThemeAccentToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [accent, setAccent] = useState<Accent>("green");

  useEffect(() => {
    const storedTheme = (localStorage.getItem("flow_theme") as Theme) || "system";
    const storedAccent = (localStorage.getItem("flow_accent") as Accent) || "green";
    setTheme(storedTheme);
    setAccent(storedAccent);
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

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("flow_accent", accent);
  }, [accent]);

  return (
    <div className="flex gap-2">
      <button
        className="rounded-card border border-border bg-surface px-3 py-1.5 text-sm"
        onClick={() =>
          setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")
        }
      >
        Theme: {theme}
      </button>
      <button
        className="rounded-card border border-border bg-surface px-3 py-1.5 text-sm"
        onClick={() => setAccent(accent === "green" ? "blue" : "green")}
      >
        Accent: {accent}
      </button>
    </div>
  );
}
