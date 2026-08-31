import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Globe, MousePointerClick, Users } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { AnalyticsData, CountItem } from '@/lib/types';
import { Spinner, ErrorState } from '@/components/ui';

const RANGES = [7, 14, 30] as const;

const fmt = (n: number) => n.toLocaleString('id-ID');

function fmtDay(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return iso.slice(5);
  }
}

function fmtFullDay(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

function StatCard({
  label,
  value,
  sub,
  Icon,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: typeof Users;
  delta?: number | null;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <Icon size={16} className="text-accent" aria-hidden="true" />
        {delta !== undefined && delta !== null && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[11px] ${
              delta >= 0 ? 'text-accent' : 'text-red-300'
            }`}
          >
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="font-mono text-2xl text-mist-50">{value}</p>
      <p className="mt-1 font-mono text-xs text-mist-600">{label}</p>
      {sub && <p className="mt-2 text-xs text-mist-400">{sub}</p>}
    </div>
  );
}

function RankedList({ title, items, valueOf }: { title: string; items: CountItem[]; valueOf: (i: CountItem) => string }) {
  const max = Math.max(1, ...items.map((i) => i.views));
  return (
    <div className="card p-5">
      <h2 className="mono-label mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-mist-600">belum ada data</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate font-mono text-[13px] text-mist-200">{valueOf(item)}</span>
                <span className="shrink-0 font-mono text-xs text-mist-600">{fmt(item.views)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-accent/70 transition-all duration-500"
                  style={{ width: `${Math.max(2, (item.views / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <div className="card p-5">
      <h2 className="mono-label mb-4">{title}</h2>
      {entries.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-mist-600">belum ada data</p>
      ) : (
        <ul className="space-y-2.5">
          {entries.map(([name, count]) => (
            <li key={name}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="font-mono text-[13px] text-mist-200">{name}</span>
                <span className="font-mono text-xs text-mist-600">
                  {fmt(count)} · {((count / total) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-accent/60 transition-all duration-500"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DailyChart({ data, mode }: { data: AnalyticsData['daily']; mode: 'views' | 'visitors' }) {
  const W = 720;
  const H = 190;
  const PAD = 8;

  const max = Math.max(1, ...data.map((d) => (mode === 'views' ? d.views : d.visitors)));
  const barW = Math.max(2, (W - PAD * 2) / data.length - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik kunjungan harian">
      {/* gridlines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={PAD}
          x2={W - PAD}
          y1={H - (H - 24) * f}
          y2={H - (H - 24) * f}
          stroke="#1D222A"
          strokeWidth="1"
        />
      ))}

      {data.map((d, i) => {
        const v = mode === 'views' ? d.views : d.visitors;
        const h = v === 0 ? 0 : Math.max(2, ((H - 24) * v) / max);
        const x = PAD + i * ((W - PAD * 2) / data.length);
        const isToday = i === data.length - 1;
        return (
          <g key={d.date}>
            <rect
              x={x + (barW > 3 ? 1 : 0)}
              y={H - h - 12}
              width={barW}
              height={h}
              rx={2}
              fill={isToday ? '#4ADE80' : v === 0 ? '#2A303B' : 'rgba(74,222,128,0.45)'}
            >
              <title>{`${fmtFullDay(d.date)}: ${fmt(v)}`}</title>
            </rect>
            {i === 0 || i === Math.floor(data.length / 2) || isToday ? (
              <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#5C6577" fontFamily="JetBrains Mono, monospace">
                {fmtDay(d.date)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [mode, setMode] = useState<'views' | 'visitors'>('views');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (d: number) => {
    setLoading(true);
    setError('');
    apiData<AnalyticsData>(`/admin/analytics?days=${d}`, { auth: true })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(days), [days]);

  const s = data?.summary;
  const delta = s ? (s.views_prev_7d > 0 ? s.delta_7d : null) : null;

  const totalRef = useMemo(() => {
    const refs = data?.referrers ?? [];
    return refs.find((r) => r.host === '(direct)')?.views ?? 0;
  }, [data]);

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState message={error} onRetry={() => load(days)} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-mist-50">Analytics</h1>
          <p className="mt-1 font-mono text-xs text-mist-600">statistik kunjungan, bersih dari bot & aset</p>
        </div>
        <div className="flex gap-1 rounded-md border border-ink-700 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`min-h-[36px] rounded px-3 font-mono text-xs transition-colors ${
                days === r ? 'bg-accent text-ink-950' : 'text-mist-400 hover:text-mist-50'
              }`}
              aria-pressed={days === r}
            >
              {r} hari
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={() => load(days)} />}

      {!error && data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="pengunjung unik" value={fmt(s?.total_visitors ?? 0)} Icon={Users} />
            <StatCard label="total kunjungan" value={fmt(s?.total_views ?? 0)} Icon={MousePointerClick} />
            <StatCard
              label="hari ini"
              value={fmt(s?.views_today ?? 0)}
              sub={`${fmt(s?.visitors_today ?? 0)} pengunjung`}
              Icon={BarChart3}
            />
            <StatCard
              label="7 hari terakhir"
              value={fmt(s?.views_7d ?? 0)}
              sub={delta === null ? 'data baru mulai terkumpul' : `vs 7 hari sebelumnya`}
              delta={delta}
              Icon={Globe}
            />
          </div>

          {/* Daily chart */}
          <div className="card mt-6 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="mono-label">kunjungan harian</h2>
              <div className="flex gap-1 rounded-md border border-ink-700 p-0.5">
                {(['views', 'visitors'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`min-h-[30px] rounded px-3 font-mono text-[11px] transition-colors ${
                      mode === m ? 'bg-accent text-ink-950' : 'text-mist-400 hover:text-mist-50'
                    }`}
                    aria-pressed={mode === m}
                  >
                    {m === 'views' ? 'kunjungan' : 'pengunjung'}
                  </button>
                ))}
              </div>
            </div>
            <DailyChart data={data.daily} mode={mode} />
            <p className="mt-3 text-right font-mono text-[11px] text-mist-600">
              {mode === 'views' ? 'total kunjungan' : 'pengunjung unik'} per hari · bar hijau = hari ini
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <RankedList title="halaman teratas" items={data.pages} valueOf={(i) => i.page || '/'} />
            <RankedList
              title="sumber kunjungan"
              items={data.referrers}
              valueOf={(i) => (i.host === '(direct)' ? '(direct)' : i.host || '')}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Breakdown title="perangkat" data={data.devices} />
            <Breakdown title="browser" data={data.browsers} />
          </div>

          {totalRef > 0 && (
            <p className="mt-6 font-mono text-[11px] text-mist-600">
              {fmt(totalRef)} kunjungan langsung tanpa referrer ({(totalRef / Math.max(1, s?.total_views ?? 1) * 100).toFixed(0)}%)
            </p>
          )}
        </>
      )}
    </div>
  );
}
