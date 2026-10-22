import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { actions } from '../store';
import type { AppData } from '../types';
import { getAgeInMonths } from '../utils';
import { DEV_MONTHS, monthForAge, type DevItem, type DevMonth } from '../../data/development';
import { CheckIcon } from './Icons';

export const Development: React.FC<{ data: AppData; months: DevMonth[]; milestonesUrl: (month: number) => string; monthLabel: (n: number) => string }> = ({ data, months, milestonesUrl, monthLabel }) => {
  const { m } = useI18n();
  const ageMonths = data.profile.birthDate ? getAgeInMonths(data.profile.birthDate) : null;
  const currentMonth = monthForAge(ageMonths, DEV_MONTHS);
  const [selected, setSelected] = useState<number>(currentMonth);
  const stripRef = useRef<HTMLDivElement>(null);
  const month = useMemo(() => months.find(item => item.month === selected) ?? months[0], [months, selected]);

  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [selected]);

  const section = (title: string, emoji: string, items: DevItem[], tone: string) => {
    if (!items.length) return null;
    const done = items.filter(item => data.checklist[item.id]).length;
    return (
      <section className="nt-card overflow-hidden">
        <div className={`flex items-center justify-between px-4 py-3 ${tone}`}>
          <h2 className="flex items-center gap-2 text-sm font-black"><span aria-hidden="true">{emoji}</span>{title}</h2>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-black dark:bg-black/20">{m.development.progress(Math.round((done / items.length) * 100))}</span>
        </div>
        <ul>
          {items.map(item => {
            const checked = Boolean(data.checklist[item.id]);
            return (
              <li key={item.id} className="border-t border-[var(--nt-line)]">
                <button type="button" aria-pressed={checked} onClick={() => actions.toggleChecklist(item.id)} className={`flex w-full items-start gap-3 px-4 py-3 text-start ${checked ? 'opacity-60' : ''}`}>
                  <span className="nt-check mt-0.5" data-checked={checked}>{checked && <CheckIcon className="h-3.5 w-3.5" />}</span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-black ${checked ? 'line-through' : ''}`}>{item.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--nt-muted)]">{item.text}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="nt-page space-y-4">
      <header>
        <p className="eyebrow !text-[0.68rem]">{m.development.eyebrow}</p>
        <h1 className="text-2xl font-black">{m.development.title}</h1>
      </header>

      <div ref={stripRef} className="no-scrollbar -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 py-0.5">
        {DEV_MONTHS.map(option => (
          <button key={option} type="button" className="nt-chip-btn snap-start gap-1" aria-pressed={selected === option} onClick={() => setSelected(option)}>
            {monthLabel(option)}
            {option === currentMonth && ageMonths !== null && <span className="rounded-full bg-pink-500 px-1.5 text-[9px] font-black text-white">{m.development.current}</span>}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-5 text-white shadow-lg">
        <h2 className="text-lg font-black">{monthLabel(month.month)}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/90">{month.summary}</p>
        <a href={milestonesUrl(month.month)} className="mt-3 inline-flex text-xs font-black text-white underline underline-offset-2">{m.development.readMore} →</a>
      </div>

      <p className="px-1 text-xs text-[var(--nt-muted)]">{m.development.note}</p>

      {section(m.development.abilities, '✨', month.abilities, 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200')}
      {month.challenges.length > 0 && (
        <section className="nt-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-black"><span aria-hidden="true">🌧️</span>{m.development.challenges}</h2>
          <ul className="mt-2 space-y-2.5">
            {month.challenges.map(item => (
              <li key={item.id}>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-[13px] leading-relaxed text-[var(--nt-muted)]">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {section(m.development.exercises, '🏃', month.exercises, 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200')}
      {section(m.development.care, '❤️', month.care, 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200')}
      <section className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100">
        <h2 className="text-sm font-black">⚠️ {m.development.warnings}</h2>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-[13px] leading-relaxed">
          {month.redFlags.map(flag => <li key={flag}>{flag}</li>)}
        </ul>
      </section>
    </div>
  );
};
