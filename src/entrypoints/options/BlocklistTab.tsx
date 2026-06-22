import { useState } from "react";
import type { ExtensionData } from "../../types";

interface Props {
  data: ExtensionData;
  onUpdate: (partial: Partial<ExtensionData>) => Promise<void>;
}

export default function BlocklistTab({ data, onUpdate }: Props) {
  const [input, setInput] = useState("");

  const addPattern = async () => {
    const p = input.trim();
    if (!p) return;
    await onUpdate({
      blocklist: [...data.blocklist, { pattern: p, blockNetwork: false }],
    });
    setInput("");
  };

  const removePattern = async (index: number) => {
    await onUpdate({
      blocklist: data.blocklist.filter((_, i) => i !== index),
    });
  };

  const updatePattern = async (index: number, pattern: string) => {
    const entry = data.blocklist[index];
    if (!entry) return;
    const next = [...data.blocklist];
    next[index] = { pattern, blockNetwork: entry.blockNetwork };
    await onUpdate({ blocklist: next });
  };

  const toggleNetwork = async (index: number) => {
    const entry = data.blocklist[index];
    if (!entry) return;
    const next = [...data.blocklist];
    next[index] = { pattern: entry.pattern, blockNetwork: !entry.blockNetwork };
    await onUpdate({ blocklist: next });
  };

  return (
    <div>
      <p className="text-sm text-secondary mb-3">
        One pattern per line. Use <code className="text-accent code-bg px-1 rounded">*</code> as a wildcard.
        <br />
        Examples: <code className="text-accent code-bg px-1 rounded">*.reddit.com</code>,{" "}
        <code className="text-accent code-bg px-1 rounded">facebook.com</code>,{" "}
        <code className="text-accent code-bg px-1 rounded">face*.*</code>
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-surface border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-accent focus:ring-accent"
          placeholder="Add a new pattern..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPattern()}
        />
        <button
          onClick={addPattern}
          className="px-4 py-2 bg-btn-bg hover:bg-btn-bg rounded-lg text-sm font-medium transition-colors text-primary ring-1 ring-accent"
        >
          Add
        </button>
      </div>

      {data.blocklist.length === 0 ? (
        <p className="text-secondary text-sm text-center py-8">No patterns yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.blocklist.map((entry, i) => (
            <li
              key={i}
              className="flex items-start gap-2 bg-surface rounded-lg px-4 py-3"
            >
              <input
                className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-accent text-sm text-primary outline-none py-1 transition-colors font-mono"
                value={entry.pattern}
                onChange={(e) => updatePattern(i, e.target.value)}
              />
              <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.blockNetwork}
                  onChange={() => toggleNetwork(i)}
                  className="w-3.5 h-3.5 rounded border-border bg-surface text-accent focus:ring-accent"
                />
                <span className="text-xs text-secondary whitespace-nowrap">Block net</span>
              </label>
              <button
                onClick={() => removePattern(i)}
                className="text-err hover:text-err text-sm font-medium shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-secondary text-sm mt-4">
        {data.blocklist.length} pattern{data.blocklist.length !== 1 ? "s" : ""}
        {" — "}
        {data.blocklist.filter((e) => e.blockNetwork).length} with network blocking
      </p>
    </div>
  );
}
