import type { BlocklistEntry, ExtensionData } from "../types";
import { getDefaults } from "./defaults";

const STORAGE_KEY = "extensionData";

function migrateBlocklist(
  raw: unknown,
  oldBlockNetwork: boolean,
): BlocklistEntry[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return (raw as string[]).map((p) => ({
      pattern: p,
      blockNetwork: oldBlockNetwork,
    }));
  }
  return raw as BlocklistEntry[];
}

export async function loadData(): Promise<ExtensionData> {
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

export async function saveData(data: ExtensionData): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: data }, resolve);
  });
}
