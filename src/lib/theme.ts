export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export type ThemeOption = (typeof THEME_OPTIONS)[number];

export const THEME_LABELS: Record<ThemeOption, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};

export function isThemeOption(value: unknown): value is ThemeOption {
  return typeof value === "string" && (THEME_OPTIONS as readonly string[]).includes(value);
}

// Orden del botón: claro -> oscuro -> sistema -> claro.
export function nextThemeOption(current: ThemeOption): ThemeOption {
  return THEME_OPTIONS[(THEME_OPTIONS.indexOf(current) + 1) % THEME_OPTIONS.length];
}
