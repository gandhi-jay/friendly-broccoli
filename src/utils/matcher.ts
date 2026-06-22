import type { BlocklistEntry } from "../types";

const SUBRESOURCE_TYPES: chrome.declarativeNetRequest.ResourceType[] = [
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "media",
  "websocket",
  "webtransport",
  "webbundle",
  "other",
];

function globToRegex(pattern: string): RegExp {
  const hasWildcard = pattern.includes("*");
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  if (hasWildcard) {
    return new RegExp(`^${escaped}$`, "i");
  }
  return new RegExp(escaped, "i");
}

export function isUrlBlocked(
  url: string,
  blocklist: BlocklistEntry[],
): { blocked: boolean; pattern: string | null } {
  if (!blocklist || blocklist.length === 0) return { blocked: false, pattern: null };

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    for (const entry of blocklist) {
      if (!entry.pattern.trim()) continue;
      const regex = globToRegex(entry.pattern.trim());
      if (regex.test(hostname)) {
        return { blocked: true, pattern: entry.pattern };
      }
    }
    return { blocked: false, pattern: null };
  } catch {
    return { blocked: false, pattern: null };
  }
}

function globToRegexStr(pattern: string): string {
  return pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
}

export function patternsToDNRRules(
  blocklist: BlocklistEntry[],
  ruleIdStart: number,
): chrome.declarativeNetRequest.Rule[] {
  const rules: chrome.declarativeNetRequest.Rule[] = [];
  const dnrEntries = blocklist.filter((e) => e.blockNetwork);
  for (let i = 0; i < dnrEntries.length; i++) {
    const entry = dnrEntries[i];
    if (!entry) continue;
    const trimmed = entry.pattern.trim();
    if (!trimmed) continue;

    const stripped = trimmed.replace(/^\*+|\*+$/g, "");
    let condition: chrome.declarativeNetRequest.RuleCondition;

    if (stripped.includes(".") && !stripped.includes("*")) {
      condition = {
        requestDomains: [stripped],
        resourceTypes: SUBRESOURCE_TYPES,
      };
    } else {
      condition = {
        regexFilter: `^https?://[^/]*${globToRegexStr(trimmed)}`,
        isUrlFilterCaseSensitive: false,
        resourceTypes: SUBRESOURCE_TYPES,
      };
    }

    rules.push({
      id: ruleIdStart + i,
      priority: 1,
      action: { type: "block" },
      condition,
    });
  }
  return rules;
}
