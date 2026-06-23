import type { ExtensionData, BlockStats } from "../types";

export const defaultYoutubeVideoIds: string[] = [
  "HJJaMENwZ1I",
  "kD3-DKkiVeA"
];

export const defaultQuotes: string[] = [
  "We win because we are determined. Disciplined. Not because we feel superior.",
  "In moments of crisis, panic does nothing. Harness it. Let it serve you.",
  "There is no grand design. No script. Only the choices you make. That your choices are so predictable merely makes us seem prescient."
];

export function getDefaults(): ExtensionData {
  return {
    blocklist: [],
    youtubeVideoIds: defaultYoutubeVideoIds,
    quotes: defaultQuotes,
    theme: "terminal",
    disableApiQuotes: false,
  };
}

export function getDefaultBlockStats(): BlockStats {
  const now = new Date();
  return {
    totalNavigations: 0,
    totalNetworkBlocks: 0,
    lastBlockedUrl: null,
    lastBlockedDate: null,
    todayNavigations: 0,
    todayNetworkBlocks: 0,
    todayDate: now.toISOString().slice(0, 10),
    perPattern: {},
  };
}
