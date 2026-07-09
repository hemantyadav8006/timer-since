import type { ThemeColors, ThemeName } from "@/types/timer";

export const THEMES: Record<ThemeName, ThemeColors> = {
  emerald: {
    primary: "#00FF88",
    primaryRgb: "0, 255, 136",
    accent: "emerald",
    glow: "rgba(0, 255, 136, 0.25)",
    glowHover: "rgba(0, 255, 136, 0.35)",
    border: "rgba(52, 211, 153, 0.15)",
    bg: "rgba(0, 255, 136, 0.08)",
    text: "#6ee7b7",
  },
  rose: {
    primary: "#FF6B9D",
    primaryRgb: "255, 107, 157",
    accent: "rose",
    glow: "rgba(255, 107, 157, 0.25)",
    glowHover: "rgba(255, 107, 157, 0.35)",
    border: "rgba(251, 113, 133, 0.15)",
    bg: "rgba(255, 107, 157, 0.08)",
    text: "#fda4af",
  },
  ocean: {
    primary: "#38BDF8",
    primaryRgb: "56, 189, 248",
    accent: "sky",
    glow: "rgba(56, 189, 248, 0.25)",
    glowHover: "rgba(56, 189, 248, 0.35)",
    border: "rgba(56, 189, 248, 0.15)",
    bg: "rgba(56, 189, 248, 0.08)",
    text: "#7dd3fc",
  },
  purple: {
    primary: "#A78BFA",
    primaryRgb: "167, 139, 250",
    accent: "purple",
    glow: "rgba(167, 139, 250, 0.25)",
    glowHover: "rgba(167, 139, 250, 0.35)",
    border: "rgba(167, 139, 250, 0.15)",
    bg: "rgba(167, 139, 250, 0.08)",
    text: "#c4b5fd",
  },
  amber: {
    primary: "#FBBF24",
    primaryRgb: "251, 191, 36",
    accent: "amber",
    glow: "rgba(251, 191, 36, 0.25)",
    glowHover: "rgba(251, 191, 36, 0.35)",
    border: "rgba(251, 191, 36, 0.15)",
    bg: "rgba(251, 191, 36, 0.08)",
    text: "#fcd34d",
  },
  monochrome: {
    primary: "#E5E5E5",
    primaryRgb: "229, 229, 229",
    accent: "neutral",
    glow: "rgba(229, 229, 229, 0.20)",
    glowHover: "rgba(229, 229, 229, 0.30)",
    border: "rgba(229, 229, 229, 0.12)",
    bg: "rgba(229, 229, 229, 0.06)",
    text: "#d4d4d4",
  },
};

export const THEME_NAMES: ThemeName[] = [
  "emerald",
  "rose",
  "ocean",
  "purple",
  "amber",
  "monochrome",
];

export function getTheme(name: ThemeName): ThemeColors {
  return THEMES[name] ?? THEMES.emerald;
}
