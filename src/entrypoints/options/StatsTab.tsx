import { useState, useEffect, useCallback } from "react";
import type { BlockStats } from "../../types";
import { loadBlockStats, resetBlockStats } from "../../utils/stats";
import { getDefaultBlockStats } from "../../utils/defaults";

export default function StatsTab() {
  const [stats, setStats] = useState<BlockStats>(getDefaultBlockStats());

  const refresh = useCallback(async () => {
    const s = await loadBlockStats();
    setStats(s);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleReset = async () => {
    await resetBlockStats();
    await refresh();
  };

  const patterns = Object.entries(stats.perPattern).sort(
    ([, a], [, b]) => b.navigations + b.networkBlocks - (a.navigations + a.networkBlocks),
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-4">
        Blocked Requests Stats
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Total navigation blocks"
          value={stats.totalNavigations}
        />
        <StatCard
          label="Total network blocks"
          value={stats.totalNetworkBlocks}
        />
        <StatCard
          label="Today (navigation)"
          value={stats.todayNavigations}
        />
        <StatCard
          label="Today (network)"
          value={stats.todayNetworkBlocks}
        />
      </div>

      {stats.lastBlockedUrl && (
        <div className="text-sm text-secondary mb-4 space-y-1">
          <p>
            <span className="text-primary font-medium">Last blocked: </span>
            {truncateUrl(stats.lastBlockedUrl)}
          </p>
          {stats.lastBlockedDate && (
            <p>
              <span className="text-primary font-medium">Last blocked at: </span>
              {formatDate(stats.lastBlockedDate)}
            </p>
          )}
        </div>
      )}

      {patterns.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-primary mb-2">By Pattern</h3>
          <div className="space-y-1">
            {patterns.map(([pattern, counts]) => (
              <div
                key={pattern}
                className="flex items-center justify-between bg-surface rounded-lg px-4 py-2 text-sm"
              >
                <code className="text-accent font-mono text-xs truncate mr-4">
                  {pattern}
                </code>
                <div className="flex gap-4 shrink-0 text-secondary">
                  <span>
                    nav: <span className="text-primary font-medium">{counts.navigations}</span>
                  </span>
                  <span>
                    net: <span className="text-primary font-medium">{counts.networkBlocks}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleReset}
        className="px-4 py-2 bg-btn-bg hover:bg-btn-bg rounded-lg text-sm font-medium transition-colors text-err ring-1 ring-err/50"
      >
        Reset Stats
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface rounded-lg px-4 py-3">
      <p className="text-xs text-secondary">{label}</p>
      <p className="text-2xl font-bold text-primary mt-1">{value}</p>
    </div>
  );
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 30 ? u.pathname.slice(0, 30) + "…" : u.pathname);
  } catch {
    return url.length > 50 ? url.slice(0, 50) + "…" : url;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}
