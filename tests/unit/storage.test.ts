import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ExtensionData } from "../../src/types";

const STORAGE_KEY = "extensionData";

let mockStorage: Record<string, unknown> = {};

vi.stubGlobal("chrome", {
  storage: {
    sync: {
      get: (
        key: string,
        cb: (result: Record<string, unknown>) => void,
      ) => {
        cb({ [key]: mockStorage[key] });
      },
      set: (
        data: Record<string, unknown>,
        cb?: () => void,
      ) => {
        Object.assign(mockStorage, data);
        cb?.();
      },
    },
  },
});

function getDefaults(): ExtensionData {
  return {
    blocklist: [],
    youtubeVideoIds: ["dQw4w9WgXcQ"],
    quotes: [],
    theme: "terminal",
    disableApiQuotes: false,
  };
}

function migrateBlocklist(
  raw: unknown,
  oldBlockNetwork: boolean,
): { pattern: string; blockNetwork: boolean }[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return (raw as string[]).map((p) => ({
      pattern: p,
      blockNetwork: oldBlockNetwork,
    }));
  }
  return raw as { pattern: string; blockNetwork: boolean }[];
}

async function loadData(): Promise<ExtensionData> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY] as Record<string, unknown> | undefined;
      if (!stored) {
        resolve(getDefaults());
        return;
      }
      const defaults = getDefaults();
      const migrated: ExtensionData = {
        ...defaults,
        ...stored,
        blocklist: migrateBlocklist(
          stored.blocklist,
          (stored as Record<string, boolean>).blockNetworkRequests ?? false,
        ),
      };
      delete (migrated as unknown as Record<string, unknown>).blockNetworkRequests;
      resolve(migrated);
    });
  });
}

function setMockStorage(data: Record<string, unknown>) {
  mockStorage = { [STORAGE_KEY]: data };
}

describe("Storage migration", () => {
  beforeEach(() => {
    mockStorage = {};
  });

  it("migrates old string[] blocklist with blockNetworkRequests: true", async () => {
    setMockStorage({
      blocklist: ["reddit.com", "facebook.com"],
      youtubeVideoIds: ["dQw4w9WgXcQ"],
      quotes: [],
      theme: "terminal",
      disableApiQuotes: false,
      blockNetworkRequests: true,
    });

    const data = await loadData();
    expect(data.blocklist).toHaveLength(2);
    expect(data.blocklist[0]).toEqual({
      pattern: "reddit.com",
      blockNetwork: true,
    });
    expect(data.blocklist[1]).toEqual({
      pattern: "facebook.com",
      blockNetwork: true,
    });
  });

  it("migrates old string[] blocklist with blockNetworkRequests: false", async () => {
    setMockStorage({
      blocklist: ["reddit.com"],
      youtubeVideoIds: [],
      quotes: [],
      theme: "terminal",
      disableApiQuotes: false,
      blockNetworkRequests: false,
    });

    const data = await loadData();
    expect(data.blocklist[0]).toEqual({
      pattern: "reddit.com",
      blockNetwork: false,
    });
  });

  it("passes through BlocklistEntry[] unchanged", async () => {
    setMockStorage({
      blocklist: [
        { pattern: "reddit.com", blockNetwork: true },
        { pattern: "facebook.com", blockNetwork: false },
      ],
      youtubeVideoIds: [],
      quotes: [],
      theme: "terminal",
      disableApiQuotes: false,
    });

    const data = await loadData();
    expect(data.blocklist).toHaveLength(2);
    expect(data.blocklist[0]).toEqual({
      pattern: "reddit.com",
      blockNetwork: true,
    });
    expect(data.blocklist[1]).toEqual({
      pattern: "facebook.com",
      blockNetwork: false,
    });
  });

  it("returns defaults when no data stored", async () => {
    const data = await loadData();
    expect(data.blocklist).toEqual([]);
    expect(data.theme).toBe("terminal");
    expect(data.disableApiQuotes).toBe(false);
  });

  it("handles empty array blocklist", async () => {
    setMockStorage({
      blocklist: [],
      youtubeVideoIds: [],
      quotes: [],
      theme: "terminal",
      disableApiQuotes: true,
    });

    const data = await loadData();
    expect(data.blocklist).toEqual([]);
    expect(data.disableApiQuotes).toBe(true);
  });

  it("removes stale blockNetworkRequests field from result", async () => {
    setMockStorage({
      blocklist: ["reddit.com"],
      youtubeVideoIds: [],
      quotes: [],
      theme: "terminal",
      disableApiQuotes: false,
      blockNetworkRequests: true,
    });

    const data = await loadData();
    expect((data as any).blockNetworkRequests).toBeUndefined();
  });

  it("fills missing fields from defaults", async () => {
    setMockStorage({
      blocklist: [{ pattern: "reddit.com", blockNetwork: true }],
    });

    const data = await loadData();
    expect(data.youtubeVideoIds).toEqual(["dQw4w9WgXcQ"]);
    expect(data.theme).toBe("terminal");
    expect(data.disableApiQuotes).toBe(false);
  });
});
