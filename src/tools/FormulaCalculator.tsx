import React, { useMemo, useState } from 'react';
import { getMilkGuideMl, lbToKg, mlToOz } from '../app/utils';

export interface FormulaLabels {
  weight: string;
  age: string;
  ageUnit: string;
  feeds: string;
  dailyTotal: string;
  perFeed: string;
  range: string;
  perDay: string;
  /** Shown for newborns: the first week is different. */
  newbornNote: string;
  /** Display labels for ages 0–11 months. */
  months: string[];
}

const defaultFeeds = (age: number) => (age < 1 ? 8 : age < 2 ? 7 : age < 3 ? 6 : age < 6 ? 5 : 4);

/** Estimates daily and per-feed milk from weight and age. Nothing is stored. */
const FormulaCalculator: React.FC<{ labels: FormulaLabels; defaultUnit: 'metric' | 'imperial' }> = ({ labels, defaultUnit }) => {
  const [imperial, setImperial] = useState(defaultUnit === 'imperial');
  const [weight, setWeight] = useState(defaultUnit === 'imperial' ? '9' : '4.2');
  const [age, setAge] = useState(1);
  // Keep the raw text so the field can be cleared and retyped; clamp only for the result.
  const [feedsInput, setFeedsInput] = useState(String(defaultFeeds(1)));
  const feeds = Math.max(1, Math.min(14, parseInt(feedsInput, 10) || defaultFeeds(age)));

  const kg = imperial ? lbToKg(parseFloat(weight)) : parseFloat(weight);
  const guide = useMemo(() => (kg > 0 && kg < 30 ? getMilkGuideMl(kg, age) : null), [kg, age]);
  const vol = (ml: number) => (imperial ? `${(Math.round(mlToOz(ml) * 10) / 10).toString()} oz` : `${Math.round(ml)} ml`);

  return (
    <div className="card p-5 sm:p-6" role="form" aria-label={labels.dailyTotal}>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="field-label">{labels.weight} ({imperial ? 'lb' : 'kg'})</span>
          <div className="flex gap-2">
            <input className="field" type="number" inputMode="decimal" min="0" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
            <button type="button" className="chip shrink-0" onClick={() => {
              const value = parseFloat(weight);
              if (value > 0) setWeight((imperial ? lbToKg(value) : value * 2.20462).toFixed(1));
              setImperial(!imperial);
            }}>{imperial ? 'kg' : 'lb'}</button>
          </div>
        </label>
        <label className="block">
          <span className="field-label">{labels.age}</span>
          <select className="field" value={age} onChange={e => { const next = Number(e.target.value); setAge(next); setFeedsInput(String(defaultFeeds(next))); }}>
            {Array.from({ length: 12 }, (_, i) => i).map(month => (
              <option key={month} value={month}>{labels.months[month]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">{labels.feeds}</span>
          <input className="field" type="number" inputMode="numeric" min="1" max="14" value={feedsInput} onChange={e => setFeedsInput(e.target.value)} onBlur={() => setFeedsInput(String(feeds))} />
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2" aria-live="polite">
        <div className="callout p-5">
          <p className="text-sm font-bold muted">{labels.dailyTotal}</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-pink-700 dark:text-pink-300">{guide ? vol(guide.target) : '—'}</p>
          {guide && <p className="mt-1 text-sm font-semibold muted">{labels.range}: {vol(guide.low)}–{vol(guide.high)} {labels.perDay}</p>}
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold muted">{labels.perFeed}</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-indigo-700 dark:text-indigo-300">{guide ? vol(guide.target / feeds) : '—'}</p>
          {guide && <p className="mt-1 text-sm font-semibold muted">× {feeds}</p>}
        </div>
      </div>
      {age === 0 && <p className="notice mt-4 text-sm">{labels.newbornNote}</p>}
    </div>
  );
};

export default FormulaCalculator;
