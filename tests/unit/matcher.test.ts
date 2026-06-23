import { describe, it, expect } from "vitest";
import { isUrlBlocked, patternsToDNRRules } from "../../src/utils/matcher";
import type { BlocklistEntry } from "../../src/types";

describe("isUrlBlocked", () => {
  const patterns: BlocklistEntry[] = [
    { pattern: "*.reddit.com", blockNetwork: true },
    { pattern: "facebook.com", blockNetwork: false },
    { pattern: "*tube*", blockNetwork: true },
  ];

  it("matches by substring (no wildcard)", () => {
    const r = isUrlBlocked("https://facebook.com/some/page", patterns);
    expect(r.blocked).toBe(true);
    expect(r.pattern).toBe("facebook.com");
  });

  it("matches www.facebook.com", () => {
    const r = isUrlBlocked("https://www.facebook.com", patterns);
    expect(r.blocked).toBe(true);
    expect(r.pattern).toBe("facebook.com");
  });

  it("matches by anchored glob (*.reddit.com)", () => {
    const r = isUrlBlocked("https://old.reddit.com/r/earthporn", patterns);
    expect(r.blocked).toBe(true);
    expect(r.pattern).toBe("*.reddit.com");
  });

  it("matches subdomain glob correctly", () => {
    const r = isUrlBlocked("https://www.reddit.com", patterns);
    expect(r.blocked).toBe(true);
    expect(r.pattern).toBe("*.reddit.com");
  });

  it("does not match similar domain with glob", () => {
    const r = isUrlBlocked("https://creditt.com", patterns);
    expect(r.blocked).toBe(false);
  });

  it("matches wildcard in middle of pattern", () => {
    const r = isUrlBlocked("https://youtube.com", patterns);
    expect(r.blocked).toBe(true);
    expect(r.pattern).toBe("*tube*");
  });

  it("returns false for unmatched URL", () => {
    const r = isUrlBlocked("https://google.com", patterns);
    expect(r.blocked).toBe(false);
    expect(r.pattern).toBeNull();
  });

  it("returns false for chrome-extension:// URLs", () => {
    const r = isUrlBlocked(
      "chrome-extension://abc123/options.html",
      patterns,
    );
    expect(r.blocked).toBe(false);
  });

  it("returns false for chrome:// URLs", () => {
    const r = isUrlBlocked("chrome://settings", patterns);
    expect(r.blocked).toBe(false);
  });

  it("returns false for empty blocklist", () => {
    const r = isUrlBlocked("https://reddit.com", []);
    expect(r.blocked).toBe(false);
  });

  it("ignores malformed URLs gracefully", () => {
    const r = isUrlBlocked("not-a-url", patterns);
    expect(r.blocked).toBe(false);
  });

  it("snapshot — isUrlBlocked output for multiple patterns", () => {
    const urls = [
      "https://old.reddit.com",
      "https://facebook.com/newsfeed",
      "https://youtube.com/watch",
      "https://google.com",
      "chrome-extension://abc/options.html",
    ];
    const results = urls.map((url) => isUrlBlocked(url, patterns));
    expect(results).toMatchSnapshot();
  });

  it("handles URL with port number", () => {
    const r = isUrlBlocked("https://facebook.com:8080/path", patterns);
    expect(r.blocked).toBe(true);
  });

  it("handles URL with query params", () => {
    const r = isUrlBlocked(
      "https://www.reddit.com/r/all?sort=new",
      patterns,
    );
    expect(r.blocked).toBe(true);
  });
});

describe("patternsToDNRRules", () => {
  it("only includes entries with blockNetwork: true", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "*.reddit.com", blockNetwork: true },
      { pattern: "facebook.com", blockNetwork: false },
      { pattern: "*tube*", blockNetwork: true },
    ];
    const rules = patternsToDNRRules(entries, 1000);
    expect(rules).toHaveLength(2);
    expect(rules[0].id).toBe(1000);
    expect(rules[1].id).toBe(1001);
  });

  it("uses requestDomains for domain-like patterns", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "reddit.com", blockNetwork: true },
    ];
    const rules = patternsToDNRRules(entries, 1);
    expect(rules[0].condition.requestDomains).toEqual(["reddit.com"]);
    expect(rules[0].condition.regexFilter).toBeUndefined();
  });

  it("uses regexFilter for glob patterns with internal wildcard", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "*tube*", blockNetwork: true },
    ];
    const rules = patternsToDNRRules(entries, 1);
    expect(rules[0].condition.regexFilter).toBeDefined();
    expect(rules[0].condition.requestDomains).toBeUndefined();
  });

  it("uses requestDomains for *.domain.com after stripping leading wildcards", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "*.reddit.com", blockNetwork: true },
    ];
    const rules = patternsToDNRRules(entries, 1);
    expect(rules[0].condition.requestDomains).toBeDefined();
    expect(rules[0].condition.regexFilter).toBeUndefined();
  });

  it("returns empty array when no entries block network", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "reddit.com", blockNetwork: false },
    ];
    const rules = patternsToDNRRules(entries, 1);
    expect(rules).toHaveLength(0);
  });

  it("returns empty array for empty blocklist", () => {
    const rules = patternsToDNRRules([], 1);
    expect(rules).toHaveLength(0);
  });

  it("snapshot — full rules output for mixed entries", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "reddit.com", blockNetwork: true },
      { pattern: "*.facebook.com", blockNetwork: true },
      { pattern: "*tube*", blockNetwork: true },
      { pattern: "face*book*", blockNetwork: true },
      { pattern: "google.com", blockNetwork: false },
    ];
    const rules = patternsToDNRRules(entries, 100);
    expect(rules).toMatchSnapshot();
  });

  it("assigns sequential IDs from ruleIdStart", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "a.com", blockNetwork: true },
      { pattern: "b.com", blockNetwork: true },
      { pattern: "c.com", blockNetwork: true },
    ];
    const rules = patternsToDNRRules(entries, 500);
    expect(rules.map((r) => r.id)).toEqual([500, 501, 502]);
  });

  it("sets priority to 1 and action type to block", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "reddit.com", blockNetwork: true },
    ];
    const rules = patternsToDNRRules(entries, 1);
    expect(rules[0].priority).toBe(1);
    expect(rules[0].action.type).toBe("block");
  });

  it("includes all subresource types", () => {
    const entries: BlocklistEntry[] = [
      { pattern: "reddit.com", blockNetwork: true },
    ];
    const rules = patternsToDNRRules(entries, 1);
    expect(rules[0].condition.resourceTypes).toContain("xmlhttprequest");
    expect(rules[0].condition.resourceTypes).toContain("image");
    expect(rules[0].condition.resourceTypes).toContain("script");
    expect(rules[0].condition.resourceTypes).toContain("sub_frame");
    expect(rules[0].condition.resourceTypes).toContain("websocket");
  });
});
