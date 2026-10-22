import React, { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Modal } from './Modal';
import { showToast } from './Toast';
import { useFormat, useI18n } from '../i18n';
import { actions } from '../store';
import type { AppData, GrowthEntry } from '../types';
import { cmToIn, generateId, getAgeInMonths, getGrowthViewMaxAge, inToCm, kgToLb, lbToKg, toLocalDateInput, fromLocalDateInput } from '../utils';
import { formatPercentile, getPercentile, getWhoSeries, type Indicator } from '../who';

const FIELD: Record<Indicator, 'weight' | 'length' | 'headCircumference'> = { weight: 'weight', length: 'length', head: 'headCircumference' };

export const Growth: React.FC<{ data: AppData; dark: boolean; onOpenSettings: () => void }> = ({ data, dark, onOpenSettings }) => {
  const { m } = useI18n();
  const fmt = useFormat();
  const profile = data.profile;
  const [tab, setTab] = useState<Indicator>('weight');
  const [editing, setEditing] = useState<GrowthEntry | 'new' | null>(null);

  const isWeight = tab === 'weight';
  const unit = isWeight ? profile.weightUnit : profile.lengthUnit;
  const toDisplay = (value: number) => (isWeight ? (profile.weightUnit === 'lb' ? kgToLb(value) : value) : profile.lengthUnit === 'in' ? cmToIn(value) : value);
  const decimals = isWeight ? 2 : 1;
  const sexLabel = profile.sex === 'girl' ? m.growth.girls : m.growth.boys;
  const birth = profile.birthDate;

  const chart = useMemo(() => {
    const points = data.growth
      .filter(g => g[FIELD[tab]])
      .map(g => ({ age: birth ? getAgeInMonths(birth, g.date) : 0, value: toDisplay(g[FIELD[tab]] as number), raw: g[FIELD[tab]] as number, date: g.date }))
      .filter(p => p.age >= 0);
    const maxAge = getGrowthViewMaxAge(points.length ? Math.max(...points.map(p => p.age)) : birth ? getAgeInMonths(birth) : 0);
    const ref = getWhoSeries(tab, profile.sex).filter(p => p.month <= maxAge).map(p => ({
      age: p.month, p3: toDisplay(p.p3), p15: toDisplay(p.p15), p50: toDisplay(p.p50), p85: toDisplay(p.p85), p97: toDisplay(p.p97)
    }));
    const values = [...ref.flatMap(r => [r.p3, r.p97]), ...points.filter(p => p.age <= maxAge).map(p => p.value)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.06, isWeight ? 0.3 : 1);
    return { points: points.filter(p => p.age <= maxAge), ref, maxAge, domain: [Math.max(0, Math.floor((min - pad) * 10) / 10), Math.ceil((max + pad) * 10) / 10] as [number, number] };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.growth, tab, profile.sex, profile.weightUnit, profile.lengthUnit, birth]);

  const percentileOf = (entry: GrowthEntry, indicator: Indicator) => {
    const value = entry[FIELD[indicator]];
    if (!value || !birth) return null;
    const p = getPercentile(indicator, profile.sex, getAgeInMonths(birth, entry.date), value);
    return p === null ? null : formatPercentile(p);
  };

  const latest = [...data.growth].reverse().find(g => g[FIELD[tab]]);
  const latestP = latest ? percentileOf(latest, tab) : null;
  const tabLabel = { weight: m.growth.weight, length: m.growth.length, head: m.growth.headLong }[tab];
  const ticks = Array.from({ length: chart.maxAge + 1 }, (_, i) => i).filter(i => chart.maxAge <= 12 || i % (chart.maxAge <= 24 ? 2 : 6) === 0);

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow !text-[0.68rem]">{m.growth.eyebrow}</p>
          <h1 className="text-2xl font-black">{m.growth.of(profile.name)}</h1>
        </div>
        <button type="button" className="nt-btn nt-btn-primary !px-3 text-xs" onClick={() => setEditing('new')}>{m.growth.add}</button>
      </header>

      {!birth && (
        <div className="notice flex flex-wrap items-center gap-2 p-3 text-sm">
          <span className="flex-1">{m.growth.needProfile}</span>
          <button type="button" className="nt-btn nt-btn-dark !min-h-[2.3rem] text-xs" onClick={onOpenSettings}>{m.growth.goSettings}</button>
        </div>
      )}

      <div className="nt-seg" role="group">
        {(['weight', 'length', 'head'] as Indicator[]).map(option => (
          <button key={option} type="button" aria-pressed={tab === option} onClick={() => setTab(option)}>{{ weight: m.growth.weight, length: m.growth.length, head: m.growth.head }[option]}</button>
        ))}
      </div>

      <section className="nt-card p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[var(--nt-muted)]">{m.growth.latest(tabLabel)}</p>
            {latest ? (
              <>
                <p className="mt-0.5 text-3xl font-black tabular-nums text-pink-600 dark:text-pink-400">{toDisplay(latest[FIELD[tab]] as number).toFixed(decimals)}<span className="ms-1 text-sm">{unit}</span></p>
                <p className="mt-1 text-xs font-semibold text-[var(--nt-muted)]">
                  {birth ? `${m.growth.ageMonths(getAgeInMonths(birth, latest.date).toFixed(1))} · ` : ''}{m.growth.standard(sexLabel)}{latestP ? ` · ${m.growth.percentile(latestP)}` : ''}
                </p>
              </>
            ) : <p className="mt-1 text-sm font-bold text-[var(--nt-muted)]">{m.growth.none}</p>}
          </div>
          <button type="button" className="nt-chip-btn shrink-0" onClick={() => actions.setProfile({ ...profile, ...(isWeight ? { weightUnit: profile.weightUnit === 'kg' ? 'lb' : 'kg' } : { lengthUnit: profile.lengthUnit === 'cm' ? 'in' : 'cm' }) })}>
            {m.growth.unitToggle(unit)}
          </button>
        </div>
        <div className="h-[340px]" role="img" aria-label={`${tabLabel} — ${m.growth.standard(sexLabel)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="4 5" vertical={false} stroke={dark ? '#334155' : '#e2e8f0'} />
              <XAxis type="number" dataKey="age" domain={[0, chart.maxAge]} ticks={ticks} allowDataOverflow tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis domain={chart.domain} allowDataOverflow width={40} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', background: dark ? '#1e293b' : '#fff', fontSize: 12, fontWeight: 700 }}
                labelFormatter={(age: any) => m.growth.ageMonths(Number(age).toFixed(1))}
                formatter={(value: any, name: any) => [`${Number(value).toFixed(decimals)} ${unit}`, name === 'value' ? m.growth.legendBaby : name.replace('p', 'P')]}
              />
              {(['p3', 'p15', 'p50', 'p85', 'p97'] as const).map(key => (
                <Line key={key} data={chart.ref} isAnimationActive={false} type="monotone" dataKey={key} dot={false} activeDot={false}
                  stroke={key === 'p50' ? '#2563eb' : key === 'p3' || key === 'p97' ? '#94a3b8' : '#cbd5e1'} strokeWidth={key === 'p50' ? 2.5 : 1.8} strokeDasharray={key === 'p50' ? undefined : '6 5'} />
              ))}
              <Line data={chart.points} isAnimationActive={false} type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 3, fill: '#fff', stroke: '#ec4899' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--nt-muted)]">{m.growth.chartNote(sexLabel)}</p>
      </section>

      {data.growth.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-black uppercase tracking-wider text-[var(--nt-muted)]">{m.growth.history}</h2>
          {[...data.growth].reverse().map(entry => (
            <button key={entry.id} type="button" onClick={() => setEditing(entry)} className="nt-log-row w-full">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black">{fmt.date(entry.date)}</span>
                {birth && <span className="block text-xs text-[var(--nt-muted)]">{m.growth.ageMonths(getAgeInMonths(birth, entry.date).toFixed(1))}</span>}
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {(['weight', 'length', 'head'] as Indicator[]).map(indicator => {
                    const value = entry[FIELD[indicator]];
                    if (!value) return null;
                    const p = percentileOf(entry, indicator);
                    const display = indicator === 'weight'
                      ? `${(profile.weightUnit === 'lb' ? kgToLb(value) : value).toFixed(2)} ${profile.weightUnit}`
                      : `${(profile.lengthUnit === 'in' ? cmToIn(value) : value).toFixed(1)} ${profile.lengthUnit}`;
                    return (
                      <span key={indicator} className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {{ weight: m.growth.weight, length: m.growth.length, head: m.growth.head }[indicator]} {display}{p ? ` · P${p}` : ''}
                      </span>
                    );
                  })}
                </span>
              </span>
            </button>
          ))}
        </section>
      )}

      {editing && <GrowthForm data={data} entry={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

const GrowthForm: React.FC<{ data: AppData; entry?: GrowthEntry; onClose: () => void }> = ({ data, entry, onClose }) => {
  const { m } = useI18n();
  const p = data.profile;
  const fromKg = (kg?: number) => (kg ? (p.weightUnit === 'lb' ? kgToLb(kg) : kg).toFixed(2) : '');
  const fromCm = (cm?: number) => (cm ? (p.lengthUnit === 'in' ? cmToIn(cm) : cm).toFixed(1) : '');
  const [date, setDate] = useState(toLocalDateInput(entry?.date ?? Date.now()));
  const [weight, setWeight] = useState(fromKg(entry?.weight));
  const [length, setLength] = useState(fromCm(entry?.length));
  const [head, setHead] = useState(fromCm(entry?.headCircumference));
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [error, setError] = useState('');

  const save = () => {
    const ts = fromLocalDateInput(date);
    const w = parseFloat(weight);
    const l = parseFloat(length);
    const h = parseFloat(head);
    if (ts === null) return setError(m.form.pickTime);
    if (!(w > 0) && !(l > 0) && !(h > 0)) return setError(m.growth.invalid);
    const next: GrowthEntry = { id: entry?.id ?? generateId(), date: ts + 12 * 3600000 };
    if (w > 0) next.weight = p.weightUnit === 'lb' ? lbToKg(w) : w;
    if (l > 0) next.length = p.lengthUnit === 'in' ? inToCm(l) : l;
    if (h > 0) next.headCircumference = p.lengthUnit === 'in' ? inToCm(h) : h;
    if (notes.trim()) next.notes = notes.trim();
    actions.saveGrowth(next);
    showToast({ message: m.today.savedEntry });
    onClose();
  };

  const remove = () => {
    if (!entry || !window.confirm(m.growth.deleteConfirm)) return;
    actions.removeGrowth(entry.id);
    onClose();
  };

  return (
    <Modal title={entry ? m.growth.editTitle : m.growth.addTitle} onClose={onClose} closeLabel={m.common.close}
      footer={<div className="flex gap-2">{entry && <button type="button" className="nt-btn nt-btn-danger" onClick={remove}>{m.common.delete}</button>}<button type="button" className="nt-btn nt-btn-dark flex-1" onClick={save}>{m.common.save}</button></div>}>
      <div className="space-y-4">
        <label className="block"><span className="nt-label">{m.growth.date}</span><input type="date" className="nt-input" value={date} onChange={e => setDate(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="nt-label">{m.growth.weight} ({p.weightUnit})</span><input type="number" inputMode="decimal" step="0.01" min="0" className="nt-input text-lg font-bold" value={weight} onChange={e => setWeight(e.target.value)} /></label>
          <label><span className="nt-label">{m.growth.length} ({p.lengthUnit})</span><input type="number" inputMode="decimal" step="0.1" min="0" className="nt-input text-lg font-bold" value={length} onChange={e => setLength(e.target.value)} /></label>
        </div>
        <label className="block"><span className="nt-label">{m.growth.headLong} ({p.lengthUnit})</span><input type="number" inputMode="decimal" step="0.1" min="0" className="nt-input text-lg font-bold" value={head} onChange={e => setHead(e.target.value)} /></label>
        <label className="block"><span className="nt-label">{m.common.notes}</span><textarea className="nt-input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      </div>
    </Modal>
  );
};
