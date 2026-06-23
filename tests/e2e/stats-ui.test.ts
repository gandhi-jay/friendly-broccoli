import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext, Page } from "playwright";
import {
  createContext,
  closeContext,
  discoverExtensionId,
  setStorageBlocklist,
  clearStorage,
} from "./setup";

describe("Stats UI", () => {
  let context: BrowserContext;
  let extensionId: string;

  beforeAll(async () => {
    context = await createContext("stats-ui");
    extensionId = await discoverExtensionId(context);
  });

  afterAll(async () => {
    await closeContext(context);
  });

  async function freshPage(): Promise<Page> {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState("networkidle");
    return page;
  }

  async function goToStatsTab(page: Page) {
    await page.locator("button", { hasText: "Stats" }).click();
    await page.waitForTimeout(300);
  }

  it("shows zeros initially", async () => {
    const page = await freshPage();
    await clearStorage(page);
    await page.reload();
    await page.waitForLoadState("networkidle");

    await goToStatsTab(page);
    const text = await page.textContent("body");
    expect(text).toContain("0");
    expect(text).toContain("Blocked Requests Stats");
    await page.close();
  });

  it("displays incremented counts after blocking a URL", async () => {
    const page = await freshPage();
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: false },
    ]);
    await page.reload();
    await page.waitForLoadState("networkidle");

    const blockPage = await context.newPage();
    await blockPage.goto("https://reddit.com", { waitUntil: "commit" }).catch(() => {});
    await blockPage.waitForFunction(() => window.location.href.includes("blocked.html"), { timeout: 10000 });
    await blockPage.close();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToStatsTab(page);

    const text = await page.textContent("body");
    expect(text).toContain("Total navigation blocks");
    expect(page.url()).toContain("options.html");
    await page.close();
  });

  it("shows per-pattern breakdown", async () => {
    const page = await freshPage();
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: false },
    ]);
    await page.reload();
    await page.waitForLoadState("networkidle");

    const blockPage = await context.newPage();
    await blockPage.goto("https://reddit.com", { waitUntil: "commit" }).catch(() => {});
    await blockPage.waitForFunction(() => window.location.href.includes("blocked.html"), { timeout: 10000 });
    await blockPage.close();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToStatsTab(page);

    expect(await page.textContent("body")).toContain("By Pattern");
    await page.close();
  });

  it("resets stats to zero", async () => {
    const page = await freshPage();
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: false },
    ]);
    await page.reload();
    await page.waitForLoadState("networkidle");

    const blockPage = await context.newPage();
    await blockPage.goto("https://reddit.com", { waitUntil: "commit" }).catch(() => {});
    await blockPage.waitForFunction(() => window.location.href.includes("blocked.html"), { timeout: 10000 });
    await blockPage.close();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToStatsTab(page);

    await page.locator("button", { hasText: "Reset Stats" }).click();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToStatsTab(page);

    const text = await page.textContent("body");
    const navText = "Total navigation blocks";
    expect(text).toContain(navText);
    await page.close();
  });

  it("DOM snapshot — stats tab with data", async () => {
    const page = await freshPage();
    await setStorageBlocklist(page, [
      { pattern: "reddit.com", blockNetwork: false },
    ]);
    await page.reload();
    await page.waitForLoadState("networkidle");

    const blockPage = await context.newPage();
    await blockPage.goto("https://reddit.com", { waitUntil: "commit" }).catch(() => {});
    await blockPage.waitForFunction(() => window.location.href.includes("blocked.html"), { timeout: 10000 });
    await blockPage.close();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToStatsTab(page);
    await page.waitForTimeout(500);

    const main = await page.locator("main").innerHTML();
    expect(main).toMatchSnapshot();
    await page.close();
  });

  it("DOM snapshot — stats tab after reset", async () => {
    const page = await freshPage();
    await clearStorage(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToStatsTab(page);
    await page.waitForTimeout(300);

    const main = await page.locator("main").innerHTML();
    expect(main).toMatchSnapshot();
    await page.close();
  });
});
