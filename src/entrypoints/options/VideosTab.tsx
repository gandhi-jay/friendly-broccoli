import { useState } from "react";
import type { ExtensionData } from "../../types";

interface Props {
  data: ExtensionData;
  onUpdate: (partial: Partial<ExtensionData>) => Promise<void>;
}

export default function VideosTab({ data, onUpdate }: Props) {
  const [input, setInput] = useState("");

  const addVideo = async () => {
    const id = input.trim();
    if (!id) return;
    if (data.youtubeVideoIds.includes(id)) {
      setInput("");
      return;
    }
    await onUpdate({ youtubeVideoIds: [...data.youtubeVideoIds, id] });
    setInput("");
  };

  const removeVideo = async (id: string) => {
    await onUpdate({
      youtubeVideoIds: data.youtubeVideoIds.filter((v) => v !== id),
    });
  };

  return (
    <div>
      <p className="text-sm text-secondary mb-3">
        YouTube video IDs that will play when a site is blocked.
        <br />
        Find the ID in any YouTube URL:{" "}
        <code className="text-accent code-bg px-1 rounded">
          youtube.com/watch?v=VIDEO_ID
        </code>
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-surface border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-accent focus:ring-accent"
          placeholder="Enter YouTube video ID..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addVideo()}
        />
        <button
          onClick={addVideo}
          className="px-4 py-2 bg-btn-bg hover:bg-btn-bg rounded-lg text-sm font-medium transition-colors text-primary ring-1 ring-accent"
        >
          Add
        </button>
      </div>

      {data.youtubeVideoIds.length === 0 ? (
        <p className="text-secondary text-sm text-center py-8">No videos added yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.youtubeVideoIds.map((id) => (
            <li
              key={id}
              className="flex items-center gap-3 bg-surface rounded-lg px-4 py-3"
            >
              <a
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm font-mono text-accent hover:text-accent truncate"
              >
                {id}
              </a>
              <button
                onClick={() => removeVideo(id)}
                className="text-err hover:text-err text-sm font-medium shrink-0"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-secondary text-sm mt-4">
        {data.youtubeVideoIds.length} video{data.youtubeVideoIds.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
