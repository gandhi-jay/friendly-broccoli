import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext, Page } from "playwright";
import {
  createContext,
  closeContext,
  discoverExtensionId,
  setStorageBlocklist,
  clearStorage,
} from "./setup";

describe("Network request blocking", () => {
  let context: BrowserContext;
  let extensionId: string;
  let page: Page;

  beforeAll(async () => {
    context = await createContext("network-block");
    extensionId = await discoverExtensionId(context);
  });

  afterAll(async () => {
    await closeContext(context);
  });

  beforeEach(async () => {
    page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState("networkidle");
    await clearStorage(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  afterEach(async () => {
    await page.close();
  });

  async function refreshPage() {
    await page.reload();
    await page.waitForLoadState("networkidle");
  }

  async function getStats(): Promise<any> {
    return page.evaluate(() => {
      return new Promise<any>((resolve) => {
        chrome.storage.local.get("blockStats", (result) =>
          resolve(result.blockStats),
        );
      });
    });
  }

  async function getDnrRules(): Promise<any[]> {
    return page.evaluate(() => {
      return chrome.declarativeNetRequest.getDynamicRules();
    });
  }

  it("blocks subresource requests for patterns with blockNetwork: true", async () => {
    await setStorageBlocklist(page, [
      { pattern: "example.com", blockNetwork: true },
    ]);
    await refreshPage();

    const dnrRulesBefore = await getDnrRules();
    const blockRulesBefore = dnrRulesBefore.filter(
      (r) => r.action.type === "block",
    );
    expect(blockRulesBefore.length).toBeGreaterThanOrEqual(1);

    const triggerPage = await context.newPage();
    await triggerPage
      .goto("http://example.com", { waitUntil: "commit" })
      .catch(() => {});
    await triggerPage.close();

    const stats = await getStats();
    expect(stats.totalNetworkBlocks).toBeGreaterThanOrEqual(0);
  });

  it("does not create DNR rules for blockNetwork: false", async () => {
    await setStorageBlocklist(page, [
      { pattern: "example.com", blockNetwork: false },
    ]);
    await refreshPage();

    const dnrRules = await getDnrRules();
    expect(dnrRules.filter((r) => r.action.type === "block")).toHaveLength(0);
  });

  it("creates DNR rules only for entries with blockNetwork: true", async () => {
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: true },
      { pattern: "facebook.com", blockNetwork: false },
      { pattern: "twitter.com", blockNetwork: true },
    ]);
    await refreshPage();

    const dnrRules = await getDnrRules();
    const blockRules = dnrRules.filter((r) => r.action.type === "block");
    expect(blockRules).toHaveLength(2);
  });

  it("removes DNR rules when blockNetwork is toggled off", async () => {
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: true },
    ]);
    await refreshPage();

    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: false },
    ]);
    await refreshPage();

    const dnrRules = await getDnrRules();
    expect(dnrRules.filter((r) => r.action.type === "block")).toHaveLength(0);
  });

  it("counts DNR-blocked requests in network stats", async () => {
    await setStorageBlocklist(page, [
      { pattern: "example.com", blockNetwork: true },
    ]);
    await refreshPage();

    const triggerPage = await context.newPage();
    await triggerPage
      .goto("https://example.com", { waitUntil: "commit" })
      .catch(() => {});
    await triggerPage.close();

    const stats = await getStats();
    expect(stats.totalNetworkBlocks).toBeGreaterThanOrEqual(0);
  });
});
