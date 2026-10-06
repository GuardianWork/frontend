import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionaries, type Dictionary, type Locale } from "@/lib/dictionary";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "vn",
  setLocale: () => {},
  dict: dictionaries.vn as Dictionary,
});

export function LanguageProvider({
  defaultLocale = "vn",
  children,
}: {
  defaultLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Check path for initial language
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/en")) {
        setLocaleState("en");
      } else if (path.startsWith("/vn")) {
        setLocaleState("vn");
      } else {
        const saved = localStorage.getItem("guardian-locale") as Locale | null;
        if (saved && (saved === "vn" || saved === "en")) {
          setLocaleState(saved);
        }
      }
    }
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("guardian-locale", nextLocale);
      document.documentElement.lang = nextLocale;
    }
  };

  const dict = (dictionaries[locale] || dictionaries.vn) as Dictionary;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
