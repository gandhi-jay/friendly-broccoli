import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext, Page } from "playwright";
import {
  createContext,
  closeContext,
  discoverExtensionId,
  setStorageBlocklist,
  clearStorage,
  setStorageTheme,
} from "./setup";

describe("Visual snapshots", () => {
  let context: BrowserContext;
  let extensionId: string;
  let page: Page;

  beforeAll(async () => {
    context = await createContext("visual-snapshots");
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
    await setStorageTheme(page, "terminal");
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  afterEach(async () => {
    await page.close();
  });

  it("screenshot — options page blocklist tab (empty)", async () => {
    await page.setViewportSize({ width: 800, height: 600 });
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchSnapshot();
  });

  it("screenshot — blocklist tab (populated)", async () => {
    const input = page.locator('input[placeholder="Add a new pattern..."]');

    await input.fill("*.reddit.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(100);

    await input.fill("facebook.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(100);

    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(100);

    await page.setViewportSize({ width: 800, height: 600 });
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchSnapshot();
  });

  it("screenshot — blocked page", async () => {
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: false },
    ]);
    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.goto(
      `chrome-extension://${extensionId}/blocked.html?url=${encodeURIComponent("https://reddit.com")}`,
    );
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 1280, height: 720 });
    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot).toMatchSnapshot();
  });

  it("screenshot — stats tab", async () => {
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: false },
    ]);
    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.goto("https://reddit.com", { waitUntil: "commit" }).catch(() => {});
    await page.waitForFunction(() => window.location.href.includes("blocked.html"), { timeout: 10000 });

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState("networkidle");

    await page.locator("button", { hasText: "Stats" }).click();
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 800, height: 600 });
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchSnapshot();
  });
});
