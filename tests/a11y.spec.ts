import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type BrowserContext, type Page } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, "../chrome-mv3");

const themes = [
  "terminal",
  "github-dark",
  "dracula",
  "catppuccin-mocha",
  "solarized-light",
];

async function discoverExtensionId(
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

async function setStorageTheme(page: Page, theme: string): Promise<void> {
  await page.evaluate((t) => {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.get("extensionData", (result) => {
        const data = result.extensionData || {};
        data.theme = t;
        if (!Array.isArray(data.blocklist)) data.blocklist = [];
        if (!Array.isArray(data.youtubeVideoIds))
          data.youtubeVideoIds = ["dQw4w9WgXcQ"];
        if (!Array.isArray(data.quotes)) data.quotes = ["Stay focused."];
        data.disableApiQuotes = true;
        chrome.storage.sync.set({ extensionData: data }, () => resolve());
      });
    });
  }, theme);
}

function printViolations(label: string, results: { violations: any[] }) {
  if (results.violations.length > 0) {
    console.log(`${label}: ${results.violations.length} violation(s) found:`);
    for (const v of results.violations) {
      console.log(`  - ${v.id} (${v.impact}): ${v.help}`);
      console.log(`    ${v.helpUrl}`);
      for (const node of v.nodes) {
        console.log(`    Target: ${node.target}`);
      }
    }
  }
}

describe("Accessibility", () => {
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    const userDataDir = path.resolve(
      __dirname,
      "../.tmp/axe-test-user-data-dir",
    );

    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    extensionId = await discoverExtensionId(context);
    console.log("Extension ID:", extensionId);
  });

  afterAll(async () => {
    await context.close();
  });

  describe.each(themes)("theme: %s", (theme) => {
    it("options page has no a11y violations", async () => {
      const page = await context.newPage();

      await page.goto(`chrome-extension://${extensionId}/options.html`);
      await page.waitForLoadState("networkidle");

      await setStorageTheme(page, theme);

      await page.reload();
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page }).analyze();
      printViolations(`[${theme}] Options page`, results);
      expect(results.violations).toEqual([]);

      await page.close();
    });

    it("blocked page has no a11y violations", async () => {
      const page = await context.newPage();

      await page.goto(`chrome-extension://${extensionId}/options.html`);
      await page.waitForLoadState("networkidle");

      await setStorageTheme(page, theme);

      await page.goto(
        `chrome-extension://${extensionId}/blocked.html?url=reddit.com`,
      );
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .disableRules(["aria-prohibited-attr", "frame-title"])
        .analyze();
      printViolations(`[${theme}] Blocked page`, results);
      expect(results.violations).toEqual([]);

      await page.close();
    });
  });
});
