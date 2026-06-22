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

export function isUrlBlocked(url: string, blocklist: string[]): boolean {
  if (!blocklist || blocklist.length === 0) return false;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    return blocklist.some((pattern) => {
      if (!pattern.trim()) return false;
      const regex = globToRegex(pattern.trim());
      return regex.test(hostname);
    });
  } catch {
    return false;
  }
}
