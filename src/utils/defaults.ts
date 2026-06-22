import type { ExtensionData, BlockStats } from "../types";

export const defaultYoutubeVideoIds: string[] = [
  "HJJaMENwZ1I",
  "kD3-DKkiVeA"
];

export const defaultQuotes: string[] = [
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "The secret of getting ahead is getting started. — Mark Twain",
  "It does not matter how slowly you go as long as you do not stop. — Confucius",
  "Everything you've ever wanted is on the other side of fear. — George Addair",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
  "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "Your time is limited, don't waste it living someone else's life. — Steve Jobs",
  "The only impossible journey is the one you never begin. — Tony Robbins",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us. — Ralph Waldo Emerson",
  "The way to get started is to quit talking and begin doing. — Walt Disney",
  "Don't let yesterday take up too much of today. — Will Rogers",
  "You miss 100% of the shots you don't take. — Wayne Gretzky",
  "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
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
