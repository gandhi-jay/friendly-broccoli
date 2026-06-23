import { describe, it, expect, beforeEach, vi } from "vitest";
import type { BlockStats } from "../../src/types";

const STATS_KEY = "blockStats";

let mockStorage: Record<string, BlockStats> = {};

vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: (key: string, cb: (result: Record<string, BlockStats>) => void) => {
        cb({ [key]: mockStorage[key] });
      },
      set: (data: Record<string, BlockStats>, cb?: () => void) => {
        Object.assign(mockStorage, data);
        cb?.();
      },
    },
  },
});

async function loadBlockStats(): Promise<BlockStats> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STATS_KEY, (result) => {
      resolve(
        (result[STATS_KEY] as BlockStats) ?? {
          totalNavigations: 0,
          totalNetworkBlocks: 0,
          lastBlockedUrl: null,
          lastBlockedDate: null,
          todayNavigations: 0,
          todayNetworkBlocks: 0,
          todayDate: new Date().toISOString().slice(0, 10),
          perPattern: {},
        },
      );
    });
  });
}

async function saveBlockStats(stats: BlockStats): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STATS_KEY]: stats }, resolve);
  });
}

async function incrementBlockStats(
  type: "navigation" | "network",
  url: string,
  pattern: string,
): Promise<void> {
  const stats = await loadBlockStats();
  const today = new Date().toISOString().slice(0, 10);

  if (stats.todayDate !== today) {
    stats.todayNavigations = 0;
    stats.todayNetworkBlocks = 0;
    stats.todayDate = today;
  }

  stats.lastBlockedUrl = url;
  stats.lastBlockedDate = new Date().toISOString();

  if (type === "navigation") {
    stats.totalNavigations++;
    stats.todayNavigations++;
  } else {
    stats.totalNetworkBlocks++;
    stats.todayNetworkBlocks++;
  }

  if (!stats.perPattern[pattern]) {
    stats.perPattern[pattern] = { navigations: 0, networkBlocks: 0 };
  }
  if (type === "navigation") {
    stats.perPattern[pattern].navigations++;
  } else {
    stats.perPattern[pattern].networkBlocks++;
  }

  await saveBlockStats(stats);
}

async function resetBlockStats(): Promise<void> {
  const defaults: BlockStats = {
    totalNavigations: 0,
    totalNetworkBlocks: 0,
    lastBlockedUrl: null,
    lastBlockedDate: null,
    todayNavigations: 0,
    todayNetworkBlocks: 0,
    todayDate: new Date().toISOString().slice(0, 10),
    perPattern: {},
  };
  await saveBlockStats(defaults);
}

function getDefaultBlockStats(): BlockStats {
  return {
    totalNavigations: 0,
    totalNetworkBlocks: 0,
    lastBlockedUrl: null,
    lastBlockedDate: null,
    todayNavigations: 0,
    todayNetworkBlocks: 0,
    todayDate: new Date().toISOString().slice(0, 10),
    perPattern: {},
  };
}

describe("BlockStats", () => {
  beforeEach(() => {
    mockStorage = {};
  });

  describe("incrementBlockStats", () => {
    it("increments total and today for navigation", async () => {
      await incrementBlockStats("navigation", "https://reddit.com", "*.reddit.com");
      const stats = await loadBlockStats();
      expect(stats.totalNavigations).toBe(1);
      expect(stats.todayNavigations).toBe(1);
      expect(stats.totalNetworkBlocks).toBe(0);
    });

    it("increments total and today for network", async () => {
      await incrementBlockStats("network", "https://reddit.com/style.css", "*.reddit.com");
      const stats = await loadBlockStats();
      expect(stats.totalNetworkBlocks).toBe(1);
      expect(stats.todayNetworkBlocks).toBe(1);
      expect(stats.totalNavigations).toBe(0);
    });

    it("increments navigation and network independently", async () => {
      await incrementBlockStats("navigation", "https://reddit.com", "*.reddit.com");
      await incrementBlockStats("network", "https://reddit.com/style.css", "*.reddit.com");
      const stats = await loadBlockStats();
      expect(stats.totalNavigations).toBe(1);
      expect(stats.totalNetworkBlocks).toBe(1);
      expect(stats.todayNavigations).toBe(1);
      expect(stats.todayNetworkBlocks).toBe(1);
    });

    it("updates per-pattern counters for navigation", async () => {
      await incrementBlockStats("navigation", "https://reddit.com", "*.reddit.com");
      const stats = await loadBlockStats();
      expect(stats.perPattern["*.reddit.com"]).toBeDefined();
      expect(stats.perPattern["*.reddit.com"].navigations).toBe(1);
      expect(stats.perPattern["*.reddit.com"].networkBlocks).toBe(0);
    });

    it("updates per-pattern counters for network", async () => {
      await incrementBlockStats("network", "https://reddit.com/img.png", "*.reddit.com");
      const stats = await loadBlockStats();
      expect(stats.perPattern["*.reddit.com"].networkBlocks).toBe(1);
      expect(stats.perPattern["*.reddit.com"].navigations).toBe(0);
    });

    it("tracks multiple patterns independently", async () => {
      await incrementBlockStats("navigation", "https://reddit.com", "*.reddit.com");
      await incrementBlockStats("navigation", "https://facebook.com", "facebook.com");
      await incrementBlockStats("network", "https://reddit.com/img.png", "*.reddit.com");
      const stats = await loadBlockStats();
      expect(stats.perPattern["*.reddit.com"].navigations).toBe(1);
      expect(stats.perPattern["*.reddit.com"].networkBlocks).toBe(1);
      expect(stats.perPattern["facebook.com"].navigations).toBe(1);
      expect(stats.perPattern["facebook.com"].networkBlocks).toBe(0);
      expect(stats.totalNavigations).toBe(2);
      expect(stats.totalNetworkBlocks).toBe(1);
    });

    it("records lastBlockedUrl and lastBlockedDate", async () => {
      const url = "https://reddit.com/r/all";
      await incrementBlockStats("navigation", url, "*.reddit.com");
      const stats = await loadBlockStats();
      expect(stats.lastBlockedUrl).toBe(url);
      expect(stats.lastBlockedDate).toBeTruthy();
    });

    it("resets today counter on day rollover", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const oldStats = getDefaultBlockStats();
      oldStats.todayNavigations = 10;
      oldStats.todayNetworkBlocks = 5;
      oldStats.totalNavigations = 100;
      oldStats.totalNetworkBlocks = 50;
      oldStats.todayDate = yesterdayStr;
      await saveBlockStats(oldStats);

      await incrementBlockStats("navigation", "https://reddit.com", "*.reddit.com");

      const stats = await loadBlockStats();
      expect(stats.todayNavigations).toBe(1);
      expect(stats.todayNetworkBlocks).toBe(0);
      expect(stats.totalNavigations).toBe(101);
      expect(stats.totalNetworkBlocks).toBe(50);
      expect(stats.todayDate).not.toBe(yesterdayStr);
    });
  });

  describe("resetBlockStats", () => {
    it("clears all counters", async () => {
      await incrementBlockStats("navigation", "https://reddit.com", "*.reddit.com");
      await incrementBlockStats("network", "https://reddit.com/img.png", "*.reddit.com");

      await resetBlockStats();
      const stats = await loadBlockStats();
      expect(stats.totalNavigations).toBe(0);
      expect(stats.totalNetworkBlocks).toBe(0);
      expect(stats.todayNavigations).toBe(0);
      expect(stats.todayNetworkBlocks).toBe(0);
      expect(stats.lastBlockedUrl).toBeNull();
      expect(stats.lastBlockedDate).toBeNull();
      expect(stats.perPattern).toEqual({});
    });
  });
});
