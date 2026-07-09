"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ThemeName, ThemeColors, ViewMode } from "@/types/timer";
import { getTheme, THEME_NAMES } from "@/lib/themes";

export type UserPreferences = {
  theme: string;
  language: string;
  reducedMotion: boolean;
};

type ThemeContextValue = {
  themeName: ThemeName;
  theme: ThemeColors;
  setThemeName: (name: ThemeName) => void;
  language: string;
  setLanguage: (lang: string) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  applyUserPreferences: (prefs: UserPreferences) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  themeName: "emerald",
  theme: getTheme("emerald"),
  setThemeName: () => {},
  language: "en",
  setLanguage: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
  viewMode: "grid",
  setViewMode: () => {},
  applyUserPreferences: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>("emerald");
  const [language, setLanguageState] = useState("en");
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [viewMode, setViewModeState] = useState<ViewMode>("grid");

  useEffect(() => {
    const saved = localStorage.getItem("timer_theme") as ThemeName | null;
    if (saved && THEME_NAMES.includes(saved)) setThemeNameState(saved);

    const savedLang = localStorage.getItem("timer_language");
    if (savedLang) setLanguageState(savedLang);

    const savedMotion = localStorage.getItem("timer_reduced_motion");
    if (savedMotion === "true") setReducedMotionState(true);

    const savedView = localStorage.getItem("timer_view") as ViewMode | null;
    if (savedView) setViewModeState(savedView);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && !savedMotion) setReducedMotionState(true);
  }, []);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    localStorage.setItem("timer_theme", name);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("timer_language", lang);
  }, []);

  const setReducedMotion = useCallback((v: boolean) => {
    setReducedMotionState(v);
    localStorage.setItem("timer_reduced_motion", String(v));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem("timer_view", mode);
  }, []);

  const applyUserPreferences = useCallback(
    (prefs: UserPreferences) => {
      const theme = prefs.theme as ThemeName;
      if (THEME_NAMES.includes(theme)) setThemeName(theme);
      if (prefs.language) setLanguage(prefs.language);
      setReducedMotion(prefs.reducedMotion);
    },
    [setThemeName, setLanguage, setReducedMotion],
  );

  const theme = getTheme(themeName);

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        theme,
        setThemeName,
        language,
        setLanguage,
        reducedMotion,
        setReducedMotion,
        viewMode,
        setViewMode,
        applyUserPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
