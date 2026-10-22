import React, { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFormat, useI18n, useVolume } from '../i18n';
import type { AppData } from '../types';
import { dayKey, getAgeInMonths, getDailyTrends, getMilkGuideMl, mlToOz } from '../utils';

const DAYS = 10;

export const Trends: React.FC<{ data: AppData; dark: boolean }> = ({ data, dark }) => {
  const { m } = useI18n();
  const fmt = useFormat();
  const vol = useVolume(data.profile);
  const todayKey = dayKey(Date.now());
  const oz = data.profile.volumeUnit === 'oz';
  const toUnit = (ml: number) => (oz ? Math.round(mlToOz(ml) * 10) / 10 : ml);

  const latestWeight = useMemo(() => [...data.growth].reverse().find(g => g.weight)?.weight, [data.growth]);
  const age = data.profile.birthDate ? getAgeInMonths(data.profile.birthDate) : null;
  const guide = getMilkGuideMl(latestWeight, age);

  const rows = useMemo(() => getDailyTrends(data.logs, DAYS).map(day => ({
    ...day,
    label: fmt.short(day.date),
    totalPlot: day.hasFood ? toUnit(day.totalMl) : null,
    milkPlot: day.feedingCount > 0 ? toUnit(day.feedingMl) : null,
    solidsPlot: toUnit(day.solidsMl),
    urinePlot: toUnit(day.urineMl),
    guide: guide ? toUnit(guide.target) : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [data.logs, todayKey, fmt, guide?.target, oz]);

  const today = rows[rows.length - 1];
  const tick = dark ? '#94a3b8' : '#64748b';
  const grid = dark ? '#334155' : '#e2e8f0';
  const xAxis = { dataKey: 'label', tick: { fill: tick, fontSize: 11, fontWeight: 600 }, tickLine: false, axisLine: false, tickMargin: 8, interval: 1 } as const;
  const yAxis = { width: 40, tick: { fill: tick, fontSize: 11, fontWeight: 600 }, tickLine: false, axisLine: false } as const;
  const tooltipStyle = { contentStyle: { borderRadius: 14, border: `1px solid ${grid}`, background: dark ? '#1e293b' : '#fff', fontSize: 12, fontWeight: 700 }, labelStyle: { color: dark ? '#e2e8f0' : '#334155' } };
  const unitLabel = vol.unit;

  const tiles = [
    { label: m.trends.todayMilk, value: vol.format(today.feedingMl), extra: today.solidsMl > 0 ? m.trends.totalLine(vol.format(today.totalMl)) : '', cls: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30' },
    { label: m.trends.todayFeeds, value: m.trends.times(today.feedingCount), extra: '', cls: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: m.trends.todaySolids, value: vol.format(today.solidsMl), extra: '', cls: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: m.trends.todayUrine, value: vol.format(today.urineMl), extra: '', cls: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30' }
  ];

  return (
    <div className="nt-page space-y-4">
      <header>
        <p className="eyebrow !text-[0.68rem]">{m.trends.eyebrow}</p>
        <h1 className="text-2xl font-black">{m.trends.title}</h1>
        <p className="mt-1 text-sm text-[var(--nt-muted)]">{m.trends.lead}</p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        {tiles.map(tile => (
          <div key={tile.label} className={`nt-card p-3.5 ${tile.bg}`}>
            <p className="text-xs font-bold text-[var(--nt-muted)]">{tile.label}</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${tile.cls}`}>{tile.value}</p>
            {tile.extra && <p className="mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{tile.extra}</p>}
          </div>
        ))}
      </section>

      <ChartCard title={`${m.trends.dailyIntake} (${unitLabel})`} legend={[{ color: '#10b981', label: m.trends.totalLegend }, ...(guide ? [{ color: '#f59e0b', label: m.trends.guideLegend, dashed: true }] : [])]}
        note={guide ? m.trends.guideNote(`${vol.format(guide.low)}–${vol.format(guide.high)}`) : m.trends.guideMissing}>
        <AreaChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nt-total" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 5" vertical={false} stroke={grid} />
          <XAxis {...xAxis} />
          <YAxis {...yAxis} />
          <Tooltip {...tooltipStyle} formatter={(value: any, name: any) => [`${value} ${unitLabel}`, name === 'guide' ? m.trends.guide : m.trends.totalLegend]} />
          <Area isAnimationActive={false} type="monotone" dataKey="totalPlot" stroke="#10b981" fill="url(#nt-total)" strokeWidth={3} connectNulls dot={{ r: 4, fill: '#fff', strokeWidth: 2.5 }} />
          {guide && <Line isAnimationActive={false} type="monotone" dataKey="guide" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="7 5" dot={false} />}
        </AreaChart>
      </ChartCard>

      <ChartCard title={`${m.trends.dailyMilk} (${unitLabel})`} legend={[{ color: '#ec4899', label: m.trends.milkLegend }]}>
        <AreaChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nt-milk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} /><stop offset="95%" stopColor="#ec4899" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 5" vertical={false} stroke={grid} />
          <XAxis {...xAxis} />
          <YAxis {...yAxis} />
          <Tooltip {...tooltipStyle} formatter={(value: any) => [`${value} ${unitLabel}`, m.trends.milkLegend]} />
          <Area isAnimationActive={false} type="monotone" dataKey="milkPlot" stroke="#ec4899" fill="url(#nt-milk)" strokeWidth={3} connectNulls dot={{ r: 4, fill: '#fff', strokeWidth: 2.5 }} />
        </AreaChart>
      </ChartCard>

      <ChartCard title={m.trends.feedCount}>
        <BarChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 5" vertical={false} stroke={grid} />
          <XAxis {...xAxis} />
          <YAxis {...yAxis} allowDecimals={false} />
          <Tooltip {...tooltipStyle} cursor={{ fill: dark ? '#1e293b' : '#f8fafc' }} formatter={(value: any) => [m.trends.times(value), m.trends.feedCount]} />
          <Bar isAnimationActive={false} dataKey="feedingCount" fill="#a855f7" radius={[8, 8, 2, 2]} maxBarSize={22} />
        </BarChart>
      </ChartCard>

      <ChartCard title={m.trends.diapers} legend={[{ color: '#0284c7', label: m.trends.wet }, { color: '#d97706', label: m.trends.dirty }]}>
        <LineChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 5" vertical={false} stroke={grid} />
          <XAxis {...xAxis} />
          <YAxis {...yAxis} allowDecimals={false} />
          <Tooltip {...tooltipStyle} formatter={(value: any, name: any) => [m.trends.times(value), name === 'wet' ? m.trends.wet : m.trends.dirty]} />
          <Line isAnimationActive={false} type="monotone" dataKey="wet" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2.5 }} />
          <Line isAnimationActive={false} type="monotone" dataKey="dirty" stroke="#d97706" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2.5 }} />
        </LineChart>
      </ChartCard>

      <ChartCard title={`${m.trends.solidsUrine} (${unitLabel})`} legend={[{ color: '#f97316', label: m.trends.solids }, { color: '#06b6d4', label: m.trends.urine }]} note={m.trends.solidsUrineNote}>
        <BarChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="4 5" vertical={false} stroke={grid} />
          <XAxis {...xAxis} />
          <YAxis {...yAxis} />
          <Tooltip {...tooltipStyle} cursor={{ fill: dark ? '#1e293b' : '#f8fafc' }} formatter={(value: any, name: any) => [`${value} ${unitLabel}`, name === 'solidsPlot' ? m.trends.solids : m.trends.urine]} />
          <Bar isAnimationActive={false} dataKey="solidsPlot" fill="#f97316" radius={[6, 6, 2, 2]} maxBarSize={16} />
          <Bar isAnimationActive={false} dataKey="urinePlot" fill="#06b6d4" radius={[6, 6, 2, 2]} maxBarSize={16} />
        </BarChart>
      </ChartCard>

      <ChartCard title={m.trends.sleep}>
        <BarChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 5" vertical={false} stroke={grid} />
          <XAxis {...xAxis} />
          <YAxis {...yAxis} />
          <Tooltip {...tooltipStyle} cursor={{ fill: dark ? '#1e293b' : '#f8fafc' }} formatter={(value: any) => [`${value} ${m.trends.hours}`, m.trends.sleep]} />
          <Bar isAnimationActive={false} dataKey="sleepHours" fill="#6366f1" radius={[8, 8, 2, 2]} maxBarSize={22} />
        </BarChart>
      </ChartCard>

      <details className="nt-card group p-4">
        <summary className="cursor-pointer list-none text-center text-sm font-bold">{m.trends.showNumbers} <span className="inline-block transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-center text-xs font-semibold">
            <thead className="text-[var(--nt-muted)]">
              <tr><th className="py-2">{m.trends.date}</th><th>{m.trends.milkLegend}</th><th>{m.trends.solids}</th><th>{m.trends.totalLegend.replace(/\s*[（(].*$/, '')}</th>{guide && <th>{m.trends.guide}</th>}<th>{m.trends.wet}</th><th>{m.trends.dirty}</th></tr>
            </thead>
            <tbody>
              {rows.slice().reverse().map(row => (
                <tr key={row.key} className="border-t border-[var(--nt-line)]">
                  <td className="py-2">{row.label}</td>
                  <td className="text-pink-600 dark:text-pink-400">{row.feedingMl ? vol.format(row.feedingMl) : '—'}</td>
                  <td className="text-orange-600 dark:text-orange-400">{row.solidsMl ? vol.format(row.solidsMl) : '—'}</td>
                  <td className="text-emerald-600 dark:text-emerald-400">{row.totalMl ? vol.format(row.totalMl) : '—'}</td>
                  {guide && <td className="text-amber-600">{vol.format(guide.target)}</td>}
                  <td>{row.wet}</td>
                  <td>{row.dirty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; legend?: { color: string; label: string; dashed?: boolean }[]; note?: string; children: React.ReactElement }> = ({ title, legend, note, children }) => (
  <article className="nt-card p-4">
    <h2 className="text-sm font-black">{title}</h2>
    {legend && (
      <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] font-bold text-[var(--nt-muted)]">
        {legend.map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="inline-block w-5" style={item.dashed ? { borderTop: `2px dashed ${item.color}` } : { height: 4, borderRadius: 4, background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    )}
    <div className="mt-3 h-56" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
    {note && <p className="mt-2 text-[11px] leading-relaxed text-[var(--nt-muted)]">{note}</p>}
  </article>
);
