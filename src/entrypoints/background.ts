import { defineBackground } from "wxt/utils/define-background";
import { loadData } from "../utils/storage";
import { getDefaults } from "../utils/defaults";
import { isUrlBlocked, patternsToDNRRules } from "../utils/matcher";
import { incrementBlockStats } from "../utils/stats";
import type { ExtensionData } from "../types";

let cachedData: ExtensionData | null = null;

async function getData(): Promise<ExtensionData> {
  if (cachedData) return cachedData;
  cachedData = await loadData();
  return cachedData;
}

function updateCache(data: ExtensionData): void {
  cachedData = data;
}

async function updateDNR(data: ExtensionData): Promise<void> {
  const removeRuleIds = (
    await chrome.declarativeNetRequest.getDynamicRules()
  ).map((r) => r.id);

  const hasDnrEntries = data.blocklist?.some((e) => e.blockNetwork);
  const addRules =
    hasDnrEntries && data.blocklist?.length
      ? patternsToDNRRules(data.blocklist, 1000)
      : [];

  if (removeRuleIds.length > 0 || addRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
  }
}

export default defineBackground({
  type: "module",
  main() {
    chrome.runtime.onInstalled.addListener(async ({ reason }) => {
      if (reason === "install") {
        const data = await getData();
        const defaults = getDefaults();
        if (
          !data.blocklist?.length &&
          !data.youtubeVideoIds?.length &&
          !data.quotes?.length
        ) {
          await chrome.storage.sync.set({ extensionData: defaults });
          updateCache(defaults);
        }
      }
      if (reason === "install" || reason === "update") {
        const data = await getData();
        if (data.blocklist?.some((e) => e.blockNetwork)) {
          await updateDNR(data);
        }
      }
    });

    chrome.storage.onChanged.addListener(async (changes) => {
      if (changes.extensionData) {
        const newValue = changes.extensionData.newValue as ExtensionData;
        updateCache(newValue);
        await updateDNR(newValue);
      }
    });

    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      if (details.frameId !== 0) return;

      const url = details.url;
      if (!url || url.startsWith("chrome-extension://") || url.startsWith("chrome://")) return;

      const data = await getData();
      const result = isUrlBlocked(url, data.blocklist);
      if (result.blocked) {
        const blockedUrl = chrome.runtime.getURL("blocked.html") + "?url=" + encodeURIComponent(url);
        chrome.tabs.update(details.tabId, { url: blockedUrl });

        await incrementBlockStats("navigation", url, result.pattern!);
      }
    });

    chrome.webRequest.onErrorOccurred.addListener(
      async (details) => {
        if (details.error !== "net::ERR_BLOCKED_BY_CLIENT") return;

        const data = await getData();
        const result = isUrlBlocked(details.url, data.blocklist);
        if (result.blocked) {
          await incrementBlockStats("network", details.url, result.pattern!);
        }
      },
      { urls: ["<all_urls>"] },
    );
  },
});
