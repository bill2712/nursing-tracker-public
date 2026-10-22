import React, { useMemo, useState } from 'react';
import { cmToIn, getAgeInMonths, inToCm, lbToKg, toLocalDateInput, fromLocalDateInput } from '../app/utils';
import { formatPercentile, getPercentile, type Indicator } from '../app/who';
import type { Sex } from '../app/types';

export interface GrowthLabels {
  sex: string;
  boy: string;
  girl: string;
  birthDate: string;
  measureDate: string;
  weight: string;
  length: string;
  head: string;
  optional: string;
  result: string;
  /** Contains {months}. */
  ageTemplate: string;
  /** Contains {p}. */
  percentileTemplate: string;
  explainTitle: string;
  /** Contains {p}. */
  explainTemplate: string;
  outOfRange: string;
  ageOutOfRange: string;
}

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

/** WHO percentile calculator. Values stay in the browser; nothing is saved. */
const GrowthCalculator: React.FC<{ labels: GrowthLabels; defaultUnit: 'metric' | 'imperial' }> = ({ labels, defaultUnit }) => {
  const today = toLocalDateInput(Date.now());
  const sixMonthsAgo = toLocalDateInput(Date.now() - 182 * 86400000);
  const [imperial, setImperial] = useState(defaultUnit === 'imperial');
  const [sex, setSex] = useState<Sex>('girl');
  const [birth, setBirth] = useState(sixMonthsAgo);
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState(defaultUnit === 'imperial' ? '16.5' : '7.5');
  const [length, setLength] = useState(defaultUnit === 'imperial' ? '26' : '66');
  const [head, setHead] = useState('');

  const results = useMemo(() => {
    const b = fromLocalDateInput(birth);
    const d = fromLocalDateInput(date);
    if (b === null || d === null || d < b) return null;
    const age = getAgeInMonths(b, d);
    const toKg = (v: number) => (imperial ? lbToKg(v) : v);
    const toCm = (v: number) => (imperial ? inToCm(v) : v);
    const rows: { indicator: Indicator; label: string; p: number | null; outOfAge: boolean }[] = [];
    const add = (indicator: Indicator, label: string, raw: string, convert: (v: number) => number, maxAge: number) => {
      const value = parseFloat(raw);
      if (!(value > 0)) return;
      const p = age <= maxAge ? getPercentile(indicator, sex, age, convert(value)) : null;
      rows.push({ indicator, label, p, outOfAge: age > maxAge });
    };
    add('weight', labels.weight, weight, toKg, 60);
    add('length', labels.length, length, toCm, 24);
    add('head', labels.head, head, toCm, 60);
    return { age, rows };
  }, [birth, date, weight, length, head, sex, imperial, labels]);

  const switchUnits = () => {
    const w = parseFloat(weight); const l = parseFloat(length); const h = parseFloat(head);
    if (w > 0) setWeight((imperial ? lbToKg(w) : w * 2.20462).toFixed(1));
    if (l > 0) setLength((imperial ? inToCm(l) : cmToIn(l)).toFixed(1));
    if (h > 0) setHead((imperial ? inToCm(h) : cmToIn(h)).toFixed(1));
    setImperial(!imperial);
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <fieldset>
          <legend className="field-label">{labels.sex}</legend>
          <div className="flex gap-2">
            {(['girl', 'boy'] as Sex[]).map(option => (
              <button key={option} type="button" aria-pressed={sex === option} onClick={() => setSex(option)}
                className={`field flex-1 !min-h-[2.9rem] font-bold ${sex === option ? '!border-pink-500 !bg-pink-50 text-pink-700 dark:!bg-pink-950/40 dark:text-pink-200' : ''}`}>
                {option === 'girl' ? labels.girl : labels.boy}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block"><span className="field-label">{labels.birthDate}</span><input className="field" type="date" max={today} value={birth} onChange={e => setBirth(e.target.value)} /></label>
        <label className="block"><span className="field-label">{labels.measureDate}</span><input className="field" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></label>
        <label className="block"><span className="field-label">{labels.weight} ({imperial ? 'lb' : 'kg'})</span><input className="field" type="number" inputMode="decimal" min="0" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} /></label>
        <label className="block"><span className="field-label">{labels.length} ({imperial ? 'in' : 'cm'})</span><input className="field" type="number" inputMode="decimal" min="0" step="0.1" value={length} onChange={e => setLength(e.target.value)} /></label>
        <label className="block"><span className="field-label">{labels.head} ({imperial ? 'in' : 'cm'}, {labels.optional})</span><input className="field" type="number" inputMode="decimal" min="0" step="0.1" value={head} onChange={e => setHead(e.target.value)} /></label>
      </div>
      <button type="button" className="chip mt-3" onClick={switchUnits}>{imperial ? 'kg / cm' : 'lb / in'} ⇄</button>

      <div className="mt-6 space-y-3" aria-live="polite">
        {results && <p className="text-sm font-bold muted">{fill(labels.ageTemplate, { months: results.age.toFixed(1) })}</p>}
        {results?.rows.map(row => {
          const p = row.p;
          const out = p !== null && (p < 3 || p > 97);
          return (
            <div key={row.indicator} className={`${out ? 'notice' : 'callout'} p-4`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-black">{row.label}</span>
                <span className="text-2xl font-black tabular-nums">{p === null ? '—' : fill(labels.percentileTemplate, { p: formatPercentile(p) })}</span>
              </div>
              {row.outOfAge && <p className="mt-1 text-sm">{labels.ageOutOfRange}</p>}
              {p !== null && <p className="mt-1 text-sm">{out ? labels.outOfRange : fill(labels.explainTemplate, { p: formatPercentile(p).replace(/[<>]/g, '') })}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GrowthCalculator;
