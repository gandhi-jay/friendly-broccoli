import { useState, useEffect, useCallback } from "react";
import type { ExtensionData } from "../../types";
import { getDefaults } from "../../utils/defaults";
import BlocklistTab from "./BlocklistTab";
import VideosTab from "./VideosTab";
import QuotesTab from "./QuotesTab";
import ThemeTab from "./ThemeTab";

type Tab = "blocklist" | "videos" | "quotes" | "theme";

const tabs: { id: Tab; label: string }[] = [
  { id: "blocklist", label: "Blocklist" },
  { id: "videos", label: "YouTube Videos" },
  { id: "quotes", label: "Quotes" },
  { id: "theme", label: "Theme" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("blocklist");
  const [data, setData] = useState<ExtensionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get("extensionData", (result) => {
      const d = (result.extensionData as ExtensionData) ?? getDefaults();
      setData(d);
      document.documentElement.setAttribute("data-theme", d.theme);
      setLoading(false);
    });
  }, []);

  const updateData = useCallback(
    async (partial: Partial<ExtensionData>) => {
      if (!data) return;
      const next: ExtensionData = { ...data, ...partial };
      setData(next);
      await chrome.storage.sync.set({ extensionData: next });
      if (partial.theme) {
        document.documentElement.setAttribute("data-theme", next.theme);
      }
    },
    [data],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-secondary text-lg">Loading settings...</p>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-primary">
        Friendly Broccoli Settings
      </h1>

      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-btn-bg text-primary ring-1 ring-accent"
                : "text-secondary hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "blocklist" && (
        <BlocklistTab data={data!} onUpdate={updateData} />
      )}
      {activeTab === "videos" && (
        <VideosTab data={data!} onUpdate={updateData} />
      )}
      {activeTab === "quotes" && (
        <QuotesTab data={data!} onUpdate={updateData} />
      )}
      {activeTab === "theme" && (
        <ThemeTab
          current={data!.theme}
          onSelect={(theme) => updateData({ theme })}
        />
      )}
    </main>
  );
}
