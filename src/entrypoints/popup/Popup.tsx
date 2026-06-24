import { useState, useEffect } from "react";
import { loadData, saveData } from "../../utils/storage";
import { isUrlBlocked } from "../../utils/matcher";
import type { ExtensionData } from "../../types";

export default function Popup() {
  const [domain, setDomain] = useState<string | null>(null);
  const [data, setData] = useState<ExtensionData | null>(null);
  const [blockNetwork, setBlockNetwork] = useState(false);
  const [status, setStatus] = useState<"idle" | "added" | "already-blocked" | "no-url">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const d = await loadData();
      setData(d);
      document.documentElement.setAttribute("data-theme", d.theme);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        try {
          const parsed = new URL(tab.url);
          const host = parsed.hostname;
          setDomain(host);
          if (isUrlBlocked(tab.url, d.blocklist).blocked) {
            setStatus("already-blocked");
          }
        } catch {
          setStatus("no-url");
        }
      } else {
        setStatus("no-url");
      }
      setLoading(false);
    })();
  }, []);

  const stripWww = (host: string): string =>
    host.replace(/^www\./i, "");

  const handleBlock = async () => {
    if (!data || !domain) return;
    const pattern = stripWww(domain);
    const next: ExtensionData = {
      ...data,
      blocklist: [...data.blocklist, { pattern, blockNetwork }],
    };
    await saveData(next);
    setData(next);
    setStatus("added");
  };

  const blockedCount = data?.blocklist.length ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-base font-bold text-primary">Friendly Broccoli</h1>

      {status === "no-url" ? (
        <p className="text-sm text-secondary">No active tab URL found.</p>
      ) : (
        <>
          <div>
            <p className="text-xs text-secondary uppercase tracking-wide mb-1">Current site</p>
            <p className="text-sm font-mono text-primary truncate">{domain}</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={blockNetwork}
              onChange={(e) => setBlockNetwork(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border bg-surface text-accent focus:ring-accent"
              disabled={status !== "idle"}
            />
            <span className="text-sm text-secondary">Also block network requests</span>
          </label>

          {status === "idle" && (
            <button
              onClick={handleBlock}
              className="w-full py-2 px-4 bg-btn-bg hover:bg-btn-bg rounded-lg text-sm font-medium transition-colors text-primary ring-1 ring-accent"
            >
              Block this site
            </button>
          )}

          {status === "added" && (
            <p className="text-sm text-accent font-medium text-center py-2">
              Added to blocklist
            </p>
          )}

          {status === "already-blocked" && (
            <p className="text-sm text-secondary text-center py-2">
              This site is already blocked
            </p>
          )}
        </>
      )}

      <hr className="border-border" />

      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary">{blockedCount} site{blockedCount !== 1 ? "s" : ""} blocked</span>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-accent hover:underline"
        >
          Open full settings →
        </button>
      </div>
    </div>
  );
}
