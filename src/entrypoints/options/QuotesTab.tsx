import { useState } from "react";
import type { ExtensionData } from "../../types";

interface Props {
  data: ExtensionData;
  onUpdate: (partial: Partial<ExtensionData>) => Promise<void>;
}

export default function QuotesTab({ data, onUpdate }: Props) {
  const [input, setInput] = useState("");

  const addQuote = async () => {
    const q = input.trim();
    if (!q) return;
    await onUpdate({ quotes: [...data.quotes, q] });
    setInput("");
  };

  const removeQuote = async (index: number) => {
    await onUpdate({
      quotes: data.quotes.filter((_, i) => i !== index),
    });
  };

  const updateQuote = async (index: number, newText: string) => {
    const next = [...data.quotes];
    next[index] = newText;
    await onUpdate({ quotes: next });
  };

  return (
    <div>
      <label className="flex items-center gap-3 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={data.disableApiQuotes}
          onChange={(e) => onUpdate({ disableApiQuotes: e.target.checked })}
          className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent"
        />
        <span className="text-sm text-primary">Disable online quote API</span>
      </label>

      {!data.disableApiQuotes && (
        <p className="text-sm text-secondary mb-3">
          Quotes are fetched daily from{" "}
          <code className="text-accent code-bg px-1 rounded">
            type.fit/api/quotes
          </code>{" "}
          and{" "}
          <code className="text-accent code-bg px-1 rounded">
            zenquotes.io/api/quotes
          </code>
          . Falls back to your local list if both APIs are unavailable.
        </p>
      )}

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-surface border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-accent focus:ring-accent"
          placeholder="Add a new quote..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addQuote()}
        />
        <button
          onClick={addQuote}
          className="px-4 py-2 bg-btn-bg hover:bg-btn-bg rounded-lg text-sm font-medium transition-colors text-primary ring-1 ring-accent"
        >
          Add
        </button>
      </div>

      {data.quotes.length === 0 ? (
        <p className="text-secondary text-sm text-center py-8">No quotes yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.quotes.map((quote, i) => (
            <li
              key={i}
              className="flex items-start gap-2 bg-surface rounded-lg px-4 py-3"
            >
              <span className="text-secondary text-sm mt-1 shrink-0">
                {i + 1}.
              </span>
              <input
                className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-accent text-sm text-primary outline-none py-1 transition-colors"
                value={quote}
                onChange={(e) => updateQuote(i, e.target.value)}
              />
              <button
                onClick={() => removeQuote(i)}
                className="text-err hover:text-err text-sm font-medium shrink-0 mt-1"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-secondary text-sm mt-4">
        {data.quotes.length} quote
        {data.quotes.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
