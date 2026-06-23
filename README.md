# Friendly Broccoli

<p align="center">
  <img src="friendly-brocolli.png" alt="Friendly Broccoli logo" width="96">
</p>

A Chrome extension that blocks distracting websites and replaces them with a
soothing blocked page featuring a YouTube video, a motivational quote, and a
Three.js-powered 3D particle animation.

## Features

- **Wildcard blocklist** — substring and glob pattern matching
- **Per-pattern network blocking** — independently toggle `declarativeNetRequest`
  blocking for each pattern in your blocklist
- **Blocked page** — shows a random YouTube video, motivational quote, and
  Three.js 3D particles that react to cursor movement
- **Themes** — 5 built-in themes (Terminal, GitHub Dark, Dracula, Catppuccin
  Mocha, Solarized Light)
- **Online quote API** — optional daily-cached quotes from
  `type.fit/api/quotes` and `zenquotes.io` with local fallback
- **Blocked request stats** — tracks navigation and network request blocks per
  pattern; view totals, today's counts, and per-pattern breakdown in the Stats tab
- **Editable lists** — customize your video IDs, quotes, and blocklist
- **In-memory cache** — blocklist is cached in the service worker for instant
  redirects (no storage read on each navigation)
- **Accessible** — axe-core accessibility tests across all 5 themes, WCAG AA compliant
- **Comprehensive tests** — accessibility, E2E, and unit test suites with
  visual snapshot testing

## Installation

```bash
pnpm install
pnpm build
```

The build output is at `chrome-mv3/` in the project root. Load it in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `chrome-mv3/` directory

## Usage

### Options Page

Right-click the extension icon and select **Options** (or navigate to
`chrome-extension://<id>/options.html`). Five tabs:

| Tab | Description |
|---|---|
| **Blocklist** | Manage blocklist patterns. Each pattern has its own "Block net" toggle to enable or disable `declarativeNetRequest` subresource blocking for that specific pattern. |
| **YouTube Videos** | List of YouTube video IDs. One is chosen at random each time a page is blocked. |
| **Quotes** | Editable list of local quotes. Toggle "Disable online quote API" to switch between API mode and local mode. |
| **Theme** | Choose from 5 themes that apply to both the options page and the blocked page. |
| **Stats** | View blocked request statistics — lifetime and daily totals for navigation and network blocks, last blocked URL, and per-pattern breakdown. |

### Navigating a Blocked Site

When you visit a blocked URL, the extension redirects to the blocked page
showing:

- The URL that was blocked
- A random YouTube video (embedded via a hosted bridge page)
- A motivational quote (from the API or local list)
- A Three.js 3D particle animation that reacts to cursor movement

### Blocklist Patterns

| Pattern | Behavior | Example Matches |
|---|---|---|
| `reddit` | Substring match on hostname | `reddit.com`, `www.reddit.com` |
| `facebook.com` | Substring match on hostname | `facebook.com`, `www.facebook.com` |
| `*.reddit.com` | Anchored glob match on hostname | `old.reddit.com`, `www.reddit.com` |
| `*tube*` | Anchored glob with wildcards | `youtube.com`, `tubecast.com` |

### Network Request Blocking

In the Blocklist tab, each pattern has a **"Block net"** checkbox. Enabling it
blocks subresource requests (`fetch`, `XHR`, `<img>`, `<script>`, `<iframe>`,
etc.) to matching hosts via `declarativeNetRequest` dynamic rules.

When at least one pattern has network blocking enabled,
`declarativeNetRequest` rules are created per pattern:

- **Domain-like patterns** (contain a `.`, no internal `*`): use
  `requestDomains` for precise host matching
- **Substring/glob patterns**: use `regexFilter` with hostname-based matching

Navigation (`main_frame`) is excluded from network blocking so the custom
blocked page still appears.

Previously a global toggle applied to all patterns. Now each pattern is
independent — you can block navigation to `facebook.com` while only blocking
subresource requests on `*.reddit.com`.

### Quotes

#### API Mode (default)

Both APIs are called in parallel on the first blocked page visit each day.
Responses are merged, shuffled, and cached in `chrome.storage.local` for the
rest of the day. Response formats are normalized (maps `text`/`author` from
type.fit and `q`/`a` from zenquotes).

- **Daily cache**: stored as `{ quotes: {text, author}[], fetchedAt: number }`
- **Trigger**: on page load, compares `fetchedAt` to today's date; refetches
  both APIs if different day or cache is empty
- **Once per page**: in-memory `fetchedThisPage` guard prevents duplicate
  fetches
- **On failure**: silently falls back to the local quote list

#### Local Mode

When "Disable online quote API" is checked, quotes are chosen randomly from
your editable local list. Add, edit, or remove quotes in the Quotes tab.

### YouTube Videos

Videos are embedded via a hosted bridge page at
`www.gandhijay.com/yt-embed.html`. This is necessary because Chrome strips
Origin headers from `chrome-extension://` pages, causing YouTube embeds to
fail with Error 153. The bridge page runs on a real web origin and YouTube
accepts the embed.

### Themes

All themes are pure CSS custom properties. The `data-theme` attribute on
`<html>` controls which theme is active. Both the options page (React/Tailwind)
and the blocked page (TypeScript/inline CSS) respect the same theme.

| Theme | ID | Style |
|---|---|---|
| Terminal | `terminal` | Dark, green accents |
| GitHub Dark | `github-dark` | Dark Primer palette |
| Dracula | `dracula` | Dark, purple/pink accents |
| Catppuccin Mocha | `catppuccin-mocha` | Warm dark, lavender accents |
| Solarized Light | `solarized-light` | Light, teal/blue accents |

## Testing

Three test suites powered by Vitest and Playwright:

| Suite | Command | Description |
|---|---|---|
| Accessibility | `pnpm test:a11y` | axe-core WCAG AA checks across all 5 themes on both pages |
| E2E | `pnpm test:e2e` | Full extension tests (blocking flow, blocklist UI, stats UI, network blocking, visual snapshots) |
| Unit | `pnpm test:unit` | Isolated unit tests for matcher, stats, and storage utilities |
| All | `pnpm test` | Build + run all test suites |

```bash
pnpm test                 # Build + run all tests
pnpm test:unit            # Unit tests only (no build needed)
pnpm test:e2e             # Build + E2E tests
pnpm test:a11y            # Build + axe-core accessibility tests
pnpm test:update-snapshots # Update visual and DOM snapshots
```

**Accessibility**: All 5 themes pass WCAG AA on both pages. Known issue: the
YouTube player iframe triggers `frame-title` and `aria-prohibited-attr` axe
violations — these rules are disabled for the blocked page as they originate
from YouTube's own player code.

**E2E**: Launches a headless Chrome instance with the built extension, tests
navigation blocking, network request blocking via DNR, options UI interaction,
and takes visual snapshots of the blocked page (compared against stored
baselines).

**Unit**: Tests URL matching (substring, glob, edge cases), DNR rule generation,
block stats CRUD, and storage migration logic.

## Development

```bash
pnpm dev                   # WXT dev server with hot reload
pnpm build                 # Production build
pnpm test                  # Build + run all tests
pnpm test:unit             # Unit tests only
pnpm test:e2e              # Build + E2E tests
pnpm test:a11y             # Build + axe-core accessibility tests
pnpm zip                   # Package for Chrome Web Store
pnpm deploy-embed          # Push yt-embed.html to GitHub Pages
```

### Project Structure

```
friendly-broccoli/
├── chrome-mv3/               # Build output
├── scripts/
│   └── deploy-embed.sh       # Deploy bridge page to GitHub Pages
├── src/
│   ├── entrypoints/
│   │   ├── background.ts     # Service worker (navigation + DNR + stats)
│   │   ├── blocked/
│   │   │   └── main.ts       # Blocked page: theme, video, quote, Three.js particles
│   │   └── options/          # React options page (5 tabs: Blocklist, Videos, Quotes, Theme, Stats)
│   │       ├── App.tsx           # Main app with tab routing
│   │       ├── BlocklistTab.tsx  # Per-pattern list with network toggle
│   │       ├── VideosTab.tsx     # YouTube video ID manager
│   │       ├── QuotesTab.tsx     # Local quote editor
│   │       ├── ThemeTab.tsx      # Theme picker
│   │       └── StatsTab.tsx      # Blocked request statistics
│   ├── public/
│   │   └── blocked.html      # Blocked page HTML shell
│   ├── themes/               # 5 CSS theme files + Tailwind overrides
│   ├── types/                # ExtensionData, BlocklistEntry, BlockStats
│   └── utils/
│       ├── storage.ts        # chrome.storage.sync read/write + migration
│       ├── matcher.ts        # URL matching, glob-to-regex, DNR rule gen
│       ├── defaults.ts       # Default settings + default BlockStats
│       └── stats.ts          # BlockStats CRUD via chrome.storage.local
├── tests/
│   ├── a11y.spec.ts          # WCAG accessibility tests
│   ├── e2e/                  # E2E tests (blocking, UI, visual snapshots)
│   │   ├── blocking.test.ts
│   │   ├── blocklist-ui.test.ts
│   │   ├── network-block.test.ts
│   │   ├── stats-ui.test.ts
│   │   ├── visual-snapshots.test.ts
│   │   ├── setup.ts
│   │   └── __snapshots__/
│   └── unit/                 # Unit tests (matcher, stats, storage)
│       ├── matcher.test.ts
│       ├── stats.test.ts
│       ├── storage.test.ts
│       └── __snapshots__/
├── wxt.config.ts             # WXT build config
├── vitest.config.ts          # Vitest config
└── friendly-brocolli.png     # Logo
```

### Architecture

```
User visits blocked URL
        │
        ▼
chrome.webNavigation.onBeforeNavigate
        │
        ▼
getData() → in-memory cache (no storage read)
        │
        ▼
isUrlBlocked() → matches pattern?
        │
   ┌────┴────┐
  YES        NO
   │          │
   ▼          ▼
Redirect to    Let navigation
blocked.html   proceed normally
   │
    ├── blocked/main.ts loads theme, video, quote
    ├── Three.js 3D particle renderer
    ├── If quote API enabled: daily cache management
    └── incrementBlockStats("navigation", url, pattern)
              │
              ▼
       chrome.storage.local
       (per-pattern counters)
```

Per-pattern `declarativeNetRequest` rules are created only for entries with
"Block net" enabled. These block subresource requests (`fetch`, `XHR`, `<img>`,
`<script>`, `<iframe>`, etc.) at the network level. Rules are regenerated
on any `chrome.storage.onChanged` event so the DNR rule set is always in sync.

Blocked subresource requests are counted via
`chrome.webRequest.onErrorOccurred` filtering for `ERR_BLOCKED_BY_CLIENT`.
Both navigation and network blocks are persisted to `chrome.storage.local`
with per-pattern breakdowns.

The blocklist is cached in memory in the service worker (`getData()`), so
navigation redirects are instant — no `chrome.storage.sync` read on each page
load. The cache is kept fresh via `chrome.storage.onChanged`.

### Configuration

Settings are stored in `chrome.storage.sync` under the key `extensionData`.
Blocked request stats are stored in `chrome.storage.local` under `blockStats`.

```ts
interface BlocklistEntry {
  pattern: string;
  blockNetwork: boolean;    // whether DNR blocks subresource requests
}

interface ExtensionData {
  blocklist: BlocklistEntry[];
  youtubeVideoIds: string[];
  quotes: string[];
  theme: string;
  disableApiQuotes: boolean;
}

interface BlockStats {
  totalNavigations: number;
  totalNetworkBlocks: number;
  lastBlockedUrl: string | null;
  lastBlockedDate: string | null;
  todayNavigations: number;
  todayNetworkBlocks: number;
  todayDate: string;                // "YYYY-MM-DD"
  perPattern: Record<string, {      // key = pattern string
    navigations: number;
    networkBlocks: number;
  }>;
}
```

## License

MIT
