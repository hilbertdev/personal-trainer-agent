import { createContext, useContext } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export type ThemeContextValue = {
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  theme: Theme;
};

export const themeStorageKey = "workout-planner-theme";
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
}

export function getStoredTheme(): Theme {
  const storedTheme = localStorage.getItem(themeStorageKey);

  if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
    return storedTheme;
  }

  return "dark";
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
