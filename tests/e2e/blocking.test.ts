import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext, Page } from "playwright";
import {
  createContext,
  closeContext,
  discoverExtensionId,
  setStorageBlocklist,
} from "./setup";

describe("Navigation blocking", () => {
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    context = await createContext("blocking");
    extensionId = await discoverExtensionId(context);
  });

  afterAll(async () => {
    await closeContext(context);
  });

  async function setupBlocklist(
    patterns: { pattern: string; blockNetwork: boolean }[],
  ) {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState("networkidle");
    await setStorageBlocklist(page, patterns);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.close();
  }

  async function triggerBlockedNavigation(page: Page, url: string) {
    await page.goto(url, { waitUntil: "commit" }).catch(() => {});
    await page.waitForFunction(
      (expected) => window.location.href.includes("blocked.html"),
      "blocked.html",
      { timeout: 10000 },
    );
  }

  it("redirects to blocked.html for a blocked URL", async () => {
    await setupBlocklist([{ pattern: "*.reddit.com", blockNetwork: false }]);

    const page = await context.newPage();
    await triggerBlockedNavigation(page, "https://old.reddit.com");

    expect(page.url()).toContain("blocked.html");
    expect(page.url()).toContain(
      encodeURIComponent("https://old.reddit.com"),
    );
    await page.close();
  });

  it("does not redirect for a safe URL", async () => {
    await setupBlocklist([{ pattern: "*.reddit.com", blockNetwork: false }]);

    const page = await context.newPage();
    await page.goto("https://example.com", { waitUntil: "commit" });
    const url = page.url();
    expect(url).not.toContain("blocked.html");
    await page.close();
  });

  it("records navigation stats after blocking", async () => {
    await setupBlocklist([{ pattern: "reddit.com", blockNetwork: false }]);

    const page = await context.newPage();
    await triggerBlockedNavigation(page, "https://reddit.com");
    await page.close();

    const statsPage = await context.newPage();
    await statsPage.goto(
      `chrome-extension://${extensionId}/options.html`,
    );
    await statsPage.waitForLoadState("networkidle");
    const stats = await statsPage.evaluate(() => {
      return new Promise<any>((resolve) => {
        chrome.storage.local.get("blockStats", (result) =>
          resolve(result.blockStats),
        );
      });
    });
    expect(stats.totalNavigations).toBeGreaterThanOrEqual(1);
    expect(stats.perPattern["reddit.com"]?.navigations).toBeGreaterThanOrEqual(
      1,
    );
    expect(stats.lastBlockedUrl).toContain("reddit.com");
    await statsPage.close();
  });

  it("records per-pattern stats for multiple blocked domains", async () => {
    await setupBlocklist([
      { pattern: "reddit.com", blockNetwork: false },
      { pattern: "facebook.com", blockNetwork: false },
    ]);

    const page1 = await context.newPage();
    await triggerBlockedNavigation(page1, "https://reddit.com");
    await page1.close();

    const page2 = await context.newPage();
    await triggerBlockedNavigation(page2, "https://facebook.com");
    await page2.close();

    const statsPage = await context.newPage();
    await statsPage.goto(
      `chrome-extension://${extensionId}/options.html`,
    );
    await statsPage.waitForLoadState("networkidle");
    const stats = await statsPage.evaluate(() => {
      return new Promise<any>((resolve) => {
        chrome.storage.local.get("blockStats", (result) =>
          resolve(result.blockStats),
        );
      });
    });
    expect(stats.totalNavigations).toBeGreaterThanOrEqual(2);
    expect(stats.perPattern["reddit.com"]?.navigations).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      stats.perPattern["facebook.com"]?.navigations,
    ).toBeGreaterThanOrEqual(1);
    await statsPage.close();
  });
});
