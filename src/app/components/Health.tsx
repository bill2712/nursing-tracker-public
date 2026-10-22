import React, { useState } from 'react';
import { Growth } from './Growth';
import { Modal } from './Modal';
import { useI18n } from '../i18n';
import { actions } from '../store';
import type { AppData, VaccineItem } from '../types';
import { fromLocalDateInput, toLocalDateInput } from '../utils';
import { CheckIcon, PlusIcon, TrashIcon } from './Icons';

export const Health: React.FC<{ data: AppData; dark: boolean; onOpenSettings: () => void }> = ({ data, dark, onOpenSettings }) => {
  const { m } = useI18n();
  const [tab, setTab] = useState<'growth' | 'vaccines'>('growth');
  return (
    <div className="nt-page space-y-3">
      <div className="nt-seg" role="group">
        {(['growth', 'vaccines'] as const).map(option => (
          <button key={option} type="button" aria-pressed={tab === option} onClick={() => setTab(option)}>{m.health.tabs[option]}</button>
        ))}
      </div>
      {tab === 'growth' ? <Growth data={data} dark={dark} onOpenSettings={onOpenSettings} /> : <Vaccines data={data} />}
    </div>
  );
};

const Vaccines: React.FC<{ data: AppData }> = ({ data }) => {
  const { m } = useI18n();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('2');

  const groups = data.vaccines.reduce<Record<number, VaccineItem[]>>((acc, v) => { (acc[v.ageMonths] ||= []).push(v); return acc; }, {});
  const ages = Object.keys(groups).map(Number).sort((a, b) => a - b);
  const label = (v: VaccineItem) => (v.presetKey ? m.vaccines.presets[v.presetKey] ?? v.presetKey : v.name ?? '');

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{m.vaccines.title}</h1>
        <button type="button" className="nt-btn nt-btn-primary !px-3 text-xs" onClick={() => setAdding(true)}><PlusIcon className="h-4 w-4" />{m.common.add}</button>
      </header>
      <p className="notice p-3 text-xs leading-relaxed">{m.vaccines.note}</p>

      {ages.map(ageMonths => {
        const items = groups[ageMonths];
        return (
          <section key={ageMonths} className="nt-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--nt-line)] bg-slate-50 px-4 py-2.5 dark:bg-slate-900/50">
              <h2 className="text-sm font-black">{ageMonths === 0 ? m.vaccines.birth : m.vaccines.months(ageMonths)}</h2>
              <span className="text-xs font-bold text-[var(--nt-muted)]">{m.vaccines.done(items.filter(i => i.done).length, items.length)}</span>
            </div>
            <ul>
              {items.map(item => (
                <li key={item.id} className="flex items-start gap-3 border-b border-[var(--nt-line)] px-4 py-3 last:border-0">
                  <button type="button" className="nt-check mt-0.5 !rounded-full" data-checked={item.done} aria-pressed={item.done} aria-label={label(item)} onClick={() => actions.toggleVaccine(item.id)}>
                    {item.done && <CheckIcon className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${item.done ? 'text-[var(--nt-muted)] line-through' : ''}`}>{label(item)}</p>
                    {item.done && (
                      <label className="mt-1.5 flex items-center gap-2 text-xs text-[var(--nt-muted)]">
                        {m.vaccines.dateLabel}
                        <input type="date" className="rounded-lg border border-[var(--nt-line)] bg-transparent px-2 py-1 text-xs" value={item.date ? toLocalDateInput(item.date) : ''}
                          onChange={e => { const ts = fromLocalDateInput(e.target.value); if (ts) actions.setVaccineDate(item.id, ts); }} />
                      </label>
                    )}
                  </div>
                  <button type="button" className="nt-icon-btn !h-8 !w-8 text-slate-300 hover:text-red-500 dark:text-slate-600" aria-label={m.common.delete}
                    onClick={() => { if (window.confirm(m.vaccines.removeConfirm)) actions.removeVaccine(item.id); }}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <button type="button" className="w-full py-2 text-xs font-bold text-[var(--nt-muted)] underline-offset-2 hover:underline" onClick={() => { if (window.confirm(m.vaccines.resetConfirm)) actions.resetVaccines(); }}>
        {m.vaccines.reset}
      </button>

      {adding && (
        <Modal title={m.vaccines.addTitle} onClose={() => setAdding(false)} closeLabel={m.common.close}
          footer={<button type="button" className="nt-btn nt-btn-dark w-full" disabled={!name.trim()} onClick={() => { actions.addVaccine(name.trim(), Math.max(0, parseInt(age, 10) || 0)); setName(''); setAdding(false); }}>{m.common.save}</button>}>
          <div className="space-y-4">
            <label className="block"><span className="nt-label">{m.vaccines.name}</span><input className="nt-input" value={name} onChange={e => setName(e.target.value)} /></label>
            <label className="block"><span className="nt-label">{m.vaccines.age}</span><input type="number" inputMode="numeric" min="0" max="72" className="nt-input" value={age} onChange={e => setAge(e.target.value)} /></label>
          </div>
        </Modal>
      )}
    </div>
  );
};
