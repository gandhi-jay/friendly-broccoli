import { chromium, type BrowserContext, type Page } from "playwright";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EXTENSION_PATH = path.resolve(__dirname, "../../chrome-mv3");
const userDataDirs = new WeakMap<BrowserContext, string>();

export async function createContext(suffix: string): Promise<BrowserContext> {
  const userDataDir = path.resolve(
    __dirname,
    `../../.tmp/e2e-test-user-data-dir-${suffix}`,
  );
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  });
  userDataDirs.set(context, userDataDir);
  return context;
}

export async function closeContext(context: BrowserContext): Promise<void> {
  const userDataDir = userDataDirs.get(context);
  await context.close();
  if (userDataDir) {
    try {
      execSync(
        `ps aux | grep -F '${userDataDir}' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true`,
        { shell: true },
      );
    } catch {}
  }
}

export async function discoverExtensionId(
  context: BrowserContext,
): Promise<string> {
  const existing = context.serviceWorkers();
  if (existing.length > 0) {
    return new URL(existing[0].url()).hostname;
  }

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for extension service worker"));
    }, 15000);

    context.on("serviceworker", (worker) => {
      clearTimeout(timeout);
      resolve(new URL(worker.url()).hostname);
    });
  });
}

export async function setStorageBlocklist(
  page: Page,
  patterns: { pattern: string; blockNetwork: boolean }[],
): Promise<void> {
  await page.evaluate((patterns) => {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.get("extensionData", (result) => {
        const data = result.extensionData || {};
        data.blocklist = patterns;
        if (!Array.isArray(data.youtubeVideoIds))
          data.youtubeVideoIds = ["dQw4w9WgXcQ"];
        if (!Array.isArray(data.quotes)) data.quotes = ["Stay focused."];
        data.disableApiQuotes = true;
        chrome.storage.sync.set({ extensionData: data }, () => resolve());
      });
    });
  }, patterns);
}

export async function setStorageTheme(
  page: Page,
  theme: string,
): Promise<void> {
  await page.evaluate((t) => {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.get("extensionData", (result) => {
        const data = result.extensionData || {};
        data.theme = t;
        data.blocklist = (data.blocklist || []).map((p: any) =>
          typeof p === "string" ? { pattern: p, blockNetwork: false } : p,
        );
        if (!Array.isArray(data.youtubeVideoIds))
          data.youtubeVideoIds = ["dQw4w9WgXcQ"];
        if (!Array.isArray(data.quotes)) data.quotes = ["Stay focused."];
        data.disableApiQuotes = true;
        chrome.storage.sync.set({ extensionData: data }, () => resolve());
      });
    });
  }, theme);
}

export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => resolve());
      });
    });
  });
}
