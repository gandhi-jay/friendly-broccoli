import { themeNames } from "../../themes";

interface Props {
  current: string;
  onSelect: (theme: string) => Promise<void>;
}

const previewColors: Record<string, string[]> = {
  terminal: ["#0d0f14", "#7ecf7e", "#58a6ff"],
  "github-dark": ["#0d1117", "#58a6ff", "#3fb950"],
  dracula: ["#282a36", "#bd93f9", "#50fa7b"],
  "catppuccin-mocha": ["#1e1e2e", "#89b4fa", "#a6e3a1"],
  "solarized-light": ["#fdf6e3", "#268bd2", "#859900"],
};

export default function ThemeTab({ current, onSelect }: Props) {
  return (
    <div>
      <p className="text-sm text-secondary mb-4">
        Choose your preferred color theme. Changes apply immediately.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {themeNames.map((t) => {
          const colors = previewColors[t.id] ?? ["#000", "#fff", "#888"];
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`rounded-lg border p-4 text-left transition-all ${
                active
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border hover:border-border"
              }`}
            >
              <div className="flex gap-1.5 mb-3">
                {colors.map((c, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="text-sm font-medium text-primary">{t.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
