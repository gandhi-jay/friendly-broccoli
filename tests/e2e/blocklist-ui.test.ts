import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext, Page } from "playwright";
import { createContext, closeContext, discoverExtensionId, clearStorage } from "./setup";

describe("Blocklist UI", () => {
  let context: BrowserContext;
  let extensionId: string;
  let page: Page;

  beforeAll(async () => {
    context = await createContext("blocklist-ui");
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

  it("shows empty state", async () => {
    const text = await page.textContent("body");
    expect(text).toContain("No patterns yet");
  });

  it("adds a pattern", async () => {
    const input = page.locator('input[placeholder="Add a new pattern..."]');
    await input.fill("*.reddit.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(200);

    expect(await page.textContent("body")).toContain("*.reddit.com");
    expect(await page.textContent("body")).toContain("1 pattern");
  });

  it("adds multiple patterns and shows correct count", async () => {
    const input = page.locator('input[placeholder="Add a new pattern..."]');
    await input.fill("*.reddit.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(100);

    await input.fill("facebook.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(100);

    expect(await page.textContent("body")).toContain("2 patterns");
  });

  it("toggles Block net checkbox", async () => {
    const input = page.locator('input[placeholder="Add a new pattern..."]');
    await input.fill("reddit.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(200);

    const checkbox = page.locator('input[type="checkbox"]').first();
    expect(await checkbox.isChecked()).toBe(false);

    await checkbox.check();
    await page.waitForTimeout(100);
    expect(await checkbox.isChecked()).toBe(true);

    expect(await page.textContent("body")).toContain("1 with network blocking");
  });

  it("removes a pattern", async () => {
    const input = page.locator('input[placeholder="Add a new pattern..."]');
    await input.fill("reddit.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(200);

    await page.locator("button", { hasText: "✕" }).click();
    await page.waitForTimeout(100);
    expect(await page.textContent("body")).toContain("No patterns yet");
  });

  it("persists patterns after reload", async () => {
    const input = page.locator('input[placeholder="Add a new pattern..."]');
    await input.fill("reddit.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(200);

    await page.reload();
    await page.waitForLoadState("networkidle");

    expect(await page.textContent("body")).toContain("reddit.com");
    expect(await page.textContent("body")).toContain("1 pattern");
  });

  it("DOM snapshot — populated blocklist", async () => {
    const input = page.locator('input[placeholder="Add a new pattern..."]');

    await input.fill("*.reddit.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(100);

    await input.fill("facebook.com");
    await page.locator("button", { hasText: "Add" }).click();
    await page.waitForTimeout(100);

    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(100);

    const body = await page.locator("main").innerHTML();
    expect(body).toMatchSnapshot();
  });

  it("DOM snapshot — empty blocklist", async () => {
    const body = await page.locator("main").innerHTML();
    expect(body).toMatchSnapshot();
  });
});
