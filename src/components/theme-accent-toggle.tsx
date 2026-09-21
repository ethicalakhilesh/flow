"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const storedTheme = (localStorage.getItem("flow_theme") as Theme) || "system";
    setTheme(storedTheme);
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

  return (
    <button
      className="rounded-card border border-border bg-surface px-3 py-1.5 text-sm"
      onClick={() =>
        setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")
      }
    >
      Theme: {theme}
    </button>
  );
}
