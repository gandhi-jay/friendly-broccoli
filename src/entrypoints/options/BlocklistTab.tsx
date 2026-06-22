import { useState } from "react";
import type { ExtensionData } from "../../types";

interface Props {
  data: ExtensionData;
  onUpdate: (partial: Partial<ExtensionData>) => Promise<void>;
}

export default function BlocklistTab({ data, onUpdate }: Props) {
  const [text, setText] = useState(data.blocklist.join("\n"));
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const patterns = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    await onUpdate({ blocklist: patterns });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      <textarea
        className="w-full h-64 bg-surface border-border rounded-lg p-4 text-sm font-mono text-primary focus:border-accent focus:ring-accent resize-y"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter patterns, one per line..."
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-btn-bg hover:bg-btn-bg rounded-lg text-sm font-medium transition-colors text-primary ring-1 ring-accent"
        >
          Save Blocklist
        </button>
        {saved && <span className="text-accent text-sm">Saved!</span>}
        <span className="text-secondary text-sm ml-auto">
          {data.blocklist.length} pattern{data.blocklist.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
