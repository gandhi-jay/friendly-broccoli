import { defineBackground } from "wxt/utils/define-background";
import { loadData } from "../utils/storage";
import { getDefaults } from "../utils/defaults";
import { isUrlBlocked } from "../utils/matcher";

export default defineBackground({
  type: "module",
  main() {
    chrome.runtime.onInstalled.addListener(async ({ reason }) => {
      if (reason === "install") {
        const data = await loadData();
        const defaults = getDefaults();
        if (!data.blocklist?.length && !data.youtubeVideoIds?.length && !data.quotes?.length) {
          await chrome.storage.sync.set({ extensionData: defaults });
        }
      }
    });

    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      if (details.frameId !== 0) return;

      const url = details.url;
      if (!url || url.startsWith("chrome-extension://") || url.startsWith("chrome://")) return;

      const data = await loadData();
      if (isUrlBlocked(url, data.blocklist)) {
        const blockedUrl = chrome.runtime.getURL("blocked.html") + "?url=" + encodeURIComponent(url);
        chrome.tabs.update(details.tabId, { url: blockedUrl });
      }
    });
  },
});
