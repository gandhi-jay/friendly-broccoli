export interface BlocklistEntry {
  pattern: string;
  blockNetwork: boolean;
}

export interface BlockStats {
  totalNavigations: number;
  totalNetworkBlocks: number;
  lastBlockedUrl: string | null;
  lastBlockedDate: string | null;
  todayNavigations: number;
  todayNetworkBlocks: number;
  todayDate: string;
  perPattern: Record<string, { navigations: number; networkBlocks: number }>;
}

export interface ExtensionData {
  blocklist: BlocklistEntry[];
  youtubeVideoIds: string[];
  quotes: string[];
  theme: string;
  disableApiQuotes: boolean;
}
