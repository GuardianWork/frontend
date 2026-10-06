import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName =
  "newsprint" | "lumen" | "cobalt" | "navy-sand" | "mint-coral" | "blush-lilac";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { id: ThemeName; label: string; preview: string }[];
}

const THEMES: { id: ThemeName; label: string; preview: string }[] = [
  { id: "newsprint", label: "Newsprint", preview: "#f6ede0" },
  { id: "lumen", label: "Lumen (Dark)", preview: "#10111a" },
  { id: "cobalt", label: "Cobalt", preview: "#0559d2" },
  { id: "navy-sand", label: "Navy Sand", preview: "#142a41" },
  { id: "mint-coral", label: "Mint Coral", preview: "#f3fbf6" },
  { id: "blush-lilac", label: "Blush Lilac", preview: "#fdefef" },
];

const ThemeContext = createContext<ThemeContextType>({
  theme: "newsprint",
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("newsprint");

  useEffect(() => {
    const saved = localStorage.getItem("guardian-theme") as ThemeName | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
      document.body.setAttribute("data-theme", saved);
      if (saved === "lumen") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.setAttribute("data-theme", "newsprint");
      document.body.setAttribute("data-theme", "newsprint");
    }
  }, []);

  const setTheme = (nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    localStorage.setItem("guardian-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body.setAttribute("data-theme", nextTheme);
    if (nextTheme === "lumen") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
