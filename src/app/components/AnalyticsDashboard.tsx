"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { formatDuration } from "@/lib/utils";
import { handleAuthFailure } from "@/lib/api/http";
import ModalBackdrop from "@/components/ui/ModalBackdrop";

type AnalyticsData = {
  total: number;
  elapsed: number;
  countdown: number;
  archived: number;
  active: number;
  favorites: number;
  avgAge: number;
  longestAge: number;
  upcomingCountdowns: {
    _id: string;
    title: string;
    icon: string;
    remaining: number;
  }[];
  completedCountdowns: number;
  categoryDistribution: { category: string; count: number }[];
  tagDistribution: { tag: string; count: number }[];
  creationTrend: { month: string; count: number }[];
  longestStreak: number;
  totalEntries: number;
  heatmap: { date: string; count: number }[];
};

type Props = { open: boolean; onClose: () => void };

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-app-border bg-app-surface p-3">
      <div className="text-[11px] uppercase tracking-wider text-app-muted">
        {label}
      </div>
      <div
        className="mt-1 text-lg font-bold"
        style={{ color: color ?? "white" }}
      >
        {value}
      </div>
    </div>
  );
}

function BarChart({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1" style={{ height: 80 }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="group relative flex-1"
          style={{ height: "100%" }}
        >
          <div
            className="absolute bottom-0 w-full rounded-t-sm transition-all"
            style={{
              height: `${Math.max(2, (d.value / max) * 100)}%`,
              backgroundColor: d.value > 0 ? color : "var(--app-chart-empty)",
            }}
          />
          <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-app-surface-strong px-1.5 py-0.5 text-[9px] text-app-fg opacity-0 group-hover:opacity-100">
            {d.label}: {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard({ open, onClose }: Props) {
  const { theme } = useTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics");
      handleAuthFailure(res);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <ModalBackdrop open={open} onClose={onClose} maxWidth="max-w-3xl">
      <h2 className="mb-5 text-lg font-bold text-app-fg">
        Analytics Dashboard
      </h2>

      {loading && (
        <div className="py-12 text-center text-app-muted">
          Loading analytics...
        </div>
      )}
      {error && <div className="py-12 text-center text-app-danger">{error}</div>}

      {data && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Timers"
              value={data.total}
              color={theme.primary}
            />
            <StatCard label="Elapsed" value={data.elapsed} />
            <StatCard label="Countdown" value={data.countdown} />
            <StatCard
              label="Active"
              value={data.active}
              color={theme.primary}
            />
            <StatCard label="Archived" value={data.archived} />
            <StatCard label="Favorites" value={data.favorites} />
            <StatCard label="Avg Age" value={formatDuration(data.avgAge)} />
            <StatCard
              label="Longest"
              value={formatDuration(data.longestAge)}
              color={theme.primary}
            />
          </div>

          {/* Category distribution */}
          {data.categoryDistribution.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
                Category Distribution
              </h3>
              <div className="space-y-1.5">
                {data.categoryDistribution.map(({ category, count }) => {
                  const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                  return (
                    <div
                      key={category}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-20 capitalize text-app-muted">
                        {category}
                      </span>
                      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-app-surface-strong">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: theme.primary,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-app-muted">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {data.tagDistribution.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
                Top Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.tagDistribution.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="rounded-full border px-3 py-1 text-xs"
                    style={{
                      borderColor: `${theme.primary}30`,
                      color: theme.text,
                    }}
                  >
                    {tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creation trend */}
          {data.creationTrend.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
                Timer Creation Trend (12 months)
              </h3>
              <BarChart
                data={data.creationTrend.map((d) => ({
                  label: d.month,
                  value: d.count,
                }))}
                color={theme.primary}
              />
              <div className="mt-1 flex justify-between text-[9px] text-app-muted">
                <span>{data.creationTrend[0]?.month}</span>
                <span>
                  {data.creationTrend[data.creationTrend.length - 1]?.month}
                </span>
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
              Activity Heatmap (365 days)
            </h3>
            <div className="overflow-x-auto">
              <div
                className="grid grid-flow-col grid-rows-7 gap-[2px]"
                style={{ width: "fit-content" }}
              >
                {data.heatmap.map((d, i) => (
                  <div
                    key={i}
                    title={`${d.date}: ${d.count} timer${d.count !== 1 ? "s" : ""}`}
                    className="h-2.5 w-2.5 rounded-[1px]"
                    style={{
                      backgroundColor:
                        d.count > 0
                          ? `${theme.primary}${Math.min(255, 40 + d.count * 50)
                              .toString(16)
                              .padStart(2, "0")}`
                          : "var(--app-chart-empty)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming countdowns */}
          {data.upcomingCountdowns.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
                Upcoming Countdowns
              </h3>
              <div className="space-y-1.5">
                {data.upcomingCountdowns.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs"
                  >
                    <span>{c.icon}</span>
                    <span className="flex-1 text-app-fg">{c.title}</span>
                    <span style={{ color: theme.primary }}>
                      {formatDuration(c.remaining)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Streak & entries summary */}
          <div className="flex gap-3">
            <StatCard
              label="Longest Streak"
              value={formatDuration(data.longestStreak)}
              color={theme.primary}
            />
            <StatCard
              label="Completed Countdowns"
              value={data.completedCountdowns}
            />
            <StatCard label="Journal Entries" value={data.totalEntries} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full rounded-xl border border-app-border py-2.5 text-sm text-app-muted hover:text-app-fg"
      >
        Close
      </button>
    </ModalBackdrop>
  );
}
