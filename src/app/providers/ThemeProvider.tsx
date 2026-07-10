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

export type ColorMode = "light" | "dark";

export type UserPreferences = {
  theme: string;
  language: string;
  reducedMotion: boolean;
};

type ThemeContextValue = {
  themeName: ThemeName;
  theme: ThemeColors;
  setThemeName: (name: ThemeName) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
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
  colorMode: "light",
  setColorMode: () => {},
  toggleColorMode: () => {},
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
  const [colorMode, setColorModeState] = useState<ColorMode>("light");
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [viewMode, setViewModeState] = useState<ViewMode>("grid");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("timer_theme") as ThemeName | null;
    if (savedTheme && THEME_NAMES.includes(savedTheme)) {
      setThemeNameState(savedTheme);
    }

    const savedColorMode = localStorage.getItem(
      "timer_color_mode",
    ) as ColorMode | null;
    if (savedColorMode === "light" || savedColorMode === "dark") {
      setColorModeState(savedColorMode);
    }

    const savedMotion = localStorage.getItem("timer_reduced_motion");
    if (savedMotion === "true") setReducedMotionState(true);

    const savedView = localStorage.getItem("timer_view") as ViewMode | null;
    if (savedView) setViewModeState(savedView);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && savedMotion !== "true" && savedMotion !== "false") {
      setReducedMotionState(true);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", colorMode === "dark");
    localStorage.setItem("timer_color_mode", colorMode);
  }, [colorMode, ready]);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    localStorage.setItem("timer_theme", name);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorModeState((prev) => (prev === "light" ? "dark" : "light"));
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
      // Accent theme is device-local (Header saves to timer_theme). DB defaults
      // stay at "emerald" and must not overwrite a user's local choice on reload.
      const savedTheme = localStorage.getItem(
        "timer_theme",
      ) as ThemeName | null;
      if (
        (!savedTheme || !THEME_NAMES.includes(savedTheme)) &&
        THEME_NAMES.includes(prefs.theme as ThemeName)
      ) {
        setThemeName(prefs.theme as ThemeName);
      }

      const savedMotion = localStorage.getItem("timer_reduced_motion");
      if (savedMotion !== "true" && savedMotion !== "false") {
        setReducedMotion(prefs.reducedMotion);
      }
    },
    [setThemeName, setReducedMotion],
  );

  const theme = getTheme(themeName);

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        theme,
        setThemeName,
        colorMode,
        setColorMode,
        toggleColorMode,
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
