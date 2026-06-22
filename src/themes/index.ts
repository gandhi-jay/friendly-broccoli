export const themeNames: { id: string; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "github-dark", label: "GitHub Dark" },
  { id: "dracula", label: "Dracula" },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { id: "solarized-light", label: "Solarized Light" },
];

export function getThemeLabel(id: string): string {
  return themeNames.find((t) => t.id === id)?.label ?? id;
}
