import type { BlockStats } from "../types";
import { getDefaultBlockStats } from "./defaults";

const STATS_KEY = "blockStats";

export async function loadBlockStats(): Promise<BlockStats> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STATS_KEY, (result) => {
      resolve((result[STATS_KEY] as BlockStats) ?? getDefaultBlockStats());
    });
  });
}

export async function saveBlockStats(stats: BlockStats): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STATS_KEY]: stats }, resolve);
  });
}

export async function incrementBlockStats(
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

export async function resetBlockStats(): Promise<void> {
  await saveBlockStats(getDefaultBlockStats());
}
